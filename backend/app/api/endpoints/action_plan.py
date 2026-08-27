# backend/app/api/endpoints/action_plan.py
from datetime import datetime, timedelta
from typing import Optional

import jwt
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.db.models import User, Company, ActionPlan, SurveyResponse, SurveySession
from backend.app.schemas.action_plan import ActionPlanCreate, ActionPlanUpdate, ActionPlanOut, ActionPlanPinVerify
from backend.app.core.auth import ALGORITHM, SECRET_KEY, action_plan_pin_secret, get_current_user
import bcrypt
from backend.app.core.nom035_engine import (
    GUIA_II_MAPPING,
    GUIA_II_THRESHOLDS,
    GUIA_III_MAPPING,
    GUIA_III_THRESHOLDS,
    get_risk_level,
)

router = APIRouter()
ACTION_PLAN_COOKIE = "action_plan_access"
ACTION_PLAN_ACCESS_MINUTES = 30
MAX_PIN_ATTEMPTS = 5
PIN_LOCK_MINUTES = 15


def get_action_plan_user(current_user: User = Depends(get_current_user)) -> User:
    """Authentication boundary for all action-plan endpoints."""
    if current_user.role not in ("superadmin", "company_admin", "consultor"):
        raise HTTPException(status_code=403, detail="No tiene acceso al plan de acción.")
    return current_user


def get_action_plan_context(
    request: Request,
    survey_session_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_action_plan_user),
):
    """Authorizes one company+survey scope; company admins also need the scoped PIN cookie."""
    if survey_session_id is None:
        raise HTTPException(status_code=400, detail="Seleccione una encuesta para acceder al plan de acción.")

    survey_session = db.query(SurveySession).filter(SurveySession.id == survey_session_id).first()
    if not survey_session:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada.")
    company = db.query(Company).filter(Company.id == survey_session.company_id).first()
    if current_user.role == "company_admin":
        if current_user.company_id != company.id:
            raise HTTPException(status_code=403, detail="La encuesta no pertenece a su empresa.")
        token = request.cookies.get(ACTION_PLAN_COOKIE)
        try:
            claims = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        except jwt.PyJWTError:
            raise HTTPException(status_code=403, detail="Ingrese el PIN entregado por su consultor para esta encuesta.")
        if not (claims.get("scope") == "action_plan" and claims.get("sub") == str(current_user.id)
                and claims.get("company_id") == company.id and claims.get("survey_session_id") == survey_session.id):
            raise HTTPException(status_code=403, detail="La autorización PIN no corresponde a esta encuesta.")
        if claims.get("pin_version") != survey_session.action_plan_pin_version:
            raise HTTPException(status_code=403, detail="El PIN fue renovado. Ingréselo nuevamente.")
    elif current_user.role == "consultor":
        if company.consultant_id != current_user.id:
            raise HTTPException(status_code=403, detail="La empresa no pertenece a su consultoría.")
        if not survey_session.consultant_access_enabled or survey_session.guide_type not in ("GUIA_II", "GUIA_III"):
            raise HTTPException(status_code=403, detail="La empresa no autorizó el acceso a estos resultados.")
    return current_user, survey_session, company.id


@router.get("/available-sessions")
def available_action_plan_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_action_plan_user),
):
    query = db.query(SurveySession, Company).join(Company).join(
        SurveyResponse, SurveyResponse.survey_session_id == SurveySession.id
    ).filter(SurveySession.guide_type.in_(["GUIA_II", "GUIA_III"])).distinct()
    if current_user.role == "company_admin":
        query = query.filter(Company.id == current_user.company_id)
    elif current_user.role == "consultor":
        query = query.filter(Company.consultant_id == current_user.id)
    sessions = query.order_by(SurveySession.created_at.desc()).all()
    return [{
        "id": survey_session.id, "company_id": company.id,
        "company_name": company.name, "guide_type": survey_session.guide_type,
        "response_count": survey_session.response_count,
        "has_action_plan_pin": bool(survey_session.action_plan_pin_hash),
        "has_responsible_consultant": company.consultant_id is not None,
    } for survey_session, company in sessions]


@router.post("/access/verify", status_code=status.HTTP_204_NO_CONTENT)
def verify_action_plan_pin(
    access: ActionPlanPinVerify,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_action_plan_user),
):
    if current_user.role != "company_admin":
        raise HTTPException(status_code=403, detail="Sólo los administradores de empresa requieren PIN.")
    survey_session = db.query(SurveySession).filter(
        SurveySession.id == access.survey_session_id,
        SurveySession.company_id == current_user.company_id,
    ).with_for_update().first()
    if not survey_session or not survey_session.action_plan_pin_hash:
        raise HTTPException(status_code=403, detail="No hay un PIN activo para esta encuesta. Solicítelo a su consultor.")
    now = datetime.utcnow()
    if survey_session.action_plan_pin_locked_until and survey_session.action_plan_pin_locked_until > now:
        retry_after = max(1, int((survey_session.action_plan_pin_locked_until - now).total_seconds()))
        raise HTTPException(
            status_code=429,
            detail="PIN bloqueado temporalmente. Intente más tarde.",
            headers={"Retry-After": str(retry_after)},
        )
    if not bcrypt.checkpw(action_plan_pin_secret(access.pin), survey_session.action_plan_pin_hash.encode("utf-8")):
        survey_session.action_plan_pin_attempts = (survey_session.action_plan_pin_attempts or 0) + 1
        if survey_session.action_plan_pin_attempts >= MAX_PIN_ATTEMPTS:
            survey_session.action_plan_pin_attempts = 0
            survey_session.action_plan_pin_locked_until = now + timedelta(minutes=PIN_LOCK_MINUTES)
        db.commit()
        raise HTTPException(status_code=403, detail="PIN incorrecto.")
    survey_session.action_plan_pin_attempts = 0
    survey_session.action_plan_pin_locked_until = None
    db.commit()
    token = jwt.encode({
        "sub": str(current_user.id), "company_id": current_user.company_id,
        "survey_session_id": survey_session.id, "scope": "action_plan",
        "pin_version": survey_session.action_plan_pin_version,
        "exp": now + timedelta(minutes=ACTION_PLAN_ACCESS_MINUTES),
    }, SECRET_KEY, algorithm=ALGORITHM)
    forwarded_proto = request.headers.get("x-forwarded-proto", request.url.scheme).split(",", 1)[0].strip()
    is_secure = forwarded_proto == "https"
    response.headers["Cache-Control"] = "no-store"
    response.set_cookie(ACTION_PLAN_COOKIE, token, max_age=ACTION_PLAN_ACCESS_MINUTES * 60,
                        httponly=True, samesite="lax", secure=is_secure, path="/api/action_plan")

STANDARD_SUGGESTIONS = {
    "Ambiente de trabajo": [
        {
            "intervention_level": "first_level",
            "description": "Realizar mantenimientos preventivos a las instalaciones físicas para asegurar condiciones seguras e higiénicas de trabajo."
        },
        {
            "intervention_level": "second_level",
            "description": "Capacitar al personal sobre medidas de prevención de accidentes y el correcto uso del equipo de seguridad."
        }
    ],
    "Carga de trabajo": [
        {
            "intervention_level": "first_level",
            "description": "Revisar la distribución de cargas de trabajo y documentar descriptivos de puesto detallados para evitar la duplicidad de funciones."
        },
        {
            "intervention_level": "second_level",
            "description": "Taller para directivos y mandos medios en técnicas de delegación y planeación efectiva de proyectos."
        }
    ],
    "Falta de control sobre el trabajo": [
        {
            "intervention_level": "first_level",
            "description": "Implementar dinámicas donde los colaboradores participen activamente en la mejora continua de sus procesos de trabajo."
        },
        {
            "intervention_level": "second_level",
            "description": "Establecer programas de capacitación continua para habilitar a los empleados en la toma de decisiones autónomas dentro de sus áreas."
        }
    ],
    "Jornada de trabajo": [
        {
            "intervention_level": "first_level",
            "description": "Implementar un control estricto de horas extras y esquemas de rotación de turnos equitativos de conformidad con la Ley Federal del Trabajo."
        }
    ],
    "Interferencia en la relación trabajo-familia": [
        {
            "intervention_level": "first_level",
            "description": "Implementar políticas que respeten los horarios de salida y eviten el envío de comunicaciones laborales fuera del horario de trabajo."
        },
        {
            "intervention_level": "second_level",
            "description": "Taller grupal sobre balance de vida y carrera y manejo del estrés."
        }
    ],
    "Liderazgo": [
        {
            "intervention_level": "first_level",
            "description": "Establecer y difundir una política clara de liderazgo participativo y canales seguros de comunicación jefe-colaborador."
        },
        {
            "intervention_level": "second_level",
            "description": "Impartir cursos obligatorios de liderazgo asertivo, comunicación efectiva y empatía para gerentes y supervisores."
        }
    ],
    "Relaciones en el trabajo": [
        {
            "intervention_level": "first_level",
            "description": "Establecer mecanismos y dinámicas que fomenten el trabajo en equipo y el apoyo social entre las diversas áreas de la empresa."
        },
        {
            "intervention_level": "second_level",
            "description": "Sesiones de integración grupal dirigidas a fortalecer las relaciones interpersonales y la empatía en los equipos."
        }
    ],
    "Violencia": [
        {
            "intervention_level": "first_level",
            "description": "Implementar el Protocolo contra la Violencia Laboral y asegurar la operación confidencial del Buzón de Denuncias / Quejas."
        },
        {
            "intervention_level": "second_level",
            "description": "Campañas internas de difusión contra el hostigamiento, maltrato y acoso laboral."
        }
    ]
}


def build_impacted_dimensions(responses, source_name: str, guide_type: str) -> list[dict]:
    """Build traceable dimension evidence for a flagged category or domain."""
    if guide_type == "GUIA_II":
        mapping = GUIA_II_MAPPING
        thresholds = GUIA_II_THRESHOLDS
    elif guide_type == "GUIA_III":
        mapping = GUIA_III_MAPPING
        thresholds = GUIA_III_THRESHOLDS
    else:
        return []

    source_items = mapping.get("categories", {}).get(source_name)
    if source_items is None:
        source_items = mapping.get("domains", {}).get(source_name)
    if not source_items:
        return []

    source_item_ids = set(source_items)
    impacts = []
    for dimension_name, dimension_items in mapping.get("dimensions", {}).items():
        if source_item_ids.isdisjoint(dimension_items):
            continue

        scores = []
        for response in responses:
            calculated_scores = response.calculated_scores or {}
            value = calculated_scores.get("dimension_scores", {}).get(dimension_name)
            if isinstance(value, (int, float)):
                scores.append(value)

        if not scores:
            continue

        average = round(sum(scores) / len(scores), 2)
        dimension_cutoffs = thresholds.get("dimensions", {}).get(dimension_name, [3, 4, 5, 6])
        impacts.append({
            "name": dimension_name,
            "score": average,
            "risk": get_risk_level(average, dimension_cutoffs),
        })

    return impacts

@router.get("/tasks", response_model=list[ActionPlanOut])
def get_tasks(
    context=Depends(get_action_plan_context),
    db: Session = Depends(get_db),
):
    _, survey_session, company_id = context
    query = db.query(ActionPlan).filter(ActionPlan.company_id == company_id)
    query = query.filter(ActionPlan.survey_session_id == survey_session.id)
    return query.all()

@router.post("/tasks", response_model=ActionPlanOut, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: ActionPlanCreate,
    context=Depends(get_action_plan_context), db: Session = Depends(get_db),
):
    _, survey_session, company_id = context
    task = ActionPlan(
        company_id=company_id, survey_session_id=survey_session.id,
        category_flagged=task_in.category_flagged,
        domain_flagged=task_in.domain_flagged,
        intervention_level=task_in.intervention_level,
        description=task_in.description,
        assigned_to=task_in.assigned_to,
        impacted_dimensions=[dimension.model_dump() for dimension in task_in.impacted_dimensions],
        status=task_in.status,
        due_date=task_in.due_date
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.put("/tasks/{task_id}", response_model=ActionPlanOut)
def update_task(
    task_id: int,
    task_in: ActionPlanUpdate,
    context=Depends(get_action_plan_context), db: Session = Depends(get_db),
):
    _, survey_session, company_id = context
    task = db.query(ActionPlan).filter(
        ActionPlan.id == task_id,
        ActionPlan.company_id == company_id,
        ActionPlan.survey_session_id == survey_session.id,
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarea del plan de acción no encontrada."
        )
        
    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
        
    db.commit()
    db.refresh(task)
    return task

@router.delete("/tasks/all")
def delete_all_tasks(
    context=Depends(get_action_plan_context), db: Session = Depends(get_db),
):
    _, survey_session, company_id = context
    deleted_count = db.query(ActionPlan).filter(
        ActionPlan.company_id == company_id,
        ActionPlan.survey_session_id == survey_session.id,
    ).delete()
    db.commit()
    return {"message": f"Tablero limpiado. {deleted_count} tareas eliminadas."}

@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    context=Depends(get_action_plan_context), db: Session = Depends(get_db),
):
    _, survey_session, company_id = context
    task = db.query(ActionPlan).filter(
        ActionPlan.id == task_id,
        ActionPlan.company_id == company_id,
        ActionPlan.survey_session_id == survey_session.id,
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarea del plan de acción no encontrada."
        )
        
    db.delete(task)
    db.commit()
    return {"message": "Tarea eliminada correctamente."}

@router.get("/suggested")
def get_suggested_recommendations(
    context=Depends(get_action_plan_context), db: Session = Depends(get_db),
):
    _, survey_session, company_id = context
    if not survey_session:
        return {"message": "Seleccione una encuesta para ver sugerencias.", "suggestions": []}
    # Fetch latest response stats or raw responses to find high risks
    responses = db.query(SurveyResponse).filter(
        SurveyResponse.company_id == company_id,
        SurveyResponse.survey_session_id == survey_session.id,
    ).all()
    
    if not responses:
        return {"message": "No hay resultados registrados para sugerir tareas en el plan de acción.", "suggestions": []}
        
    # Find all categories or domains that triggered Medium/Alto/Muy Alto risks
    flagged_categories = set()
    for r in responses:
        scores = r.calculated_scores
        if "category_risks" in scores:
            for cat, risk in scores["category_risks"].items():
                if risk in ("Medio", "Alto", "Muy Alto"):
                    flagged_categories.add(cat)
                    
        # Check if the domain corresponding to violence is flagged
        if "domain_risks" in scores:
            for dom, risk in scores["domain_risks"].items():
                if dom == "Violencia" and risk in ("Medio", "Alto", "Muy Alto"):
                    flagged_categories.add("Violencia")

    suggestions = []
    for cat in flagged_categories:
        # Match with standard suggestions
        # Note: mapping category names to standard suggestion keys
        key = cat
        if cat.startswith("Factores propios"):
            key = "Carga de trabajo" # default to carga/control suggestion
        elif cat.startswith("Liderazgo"):
            key = "Liderazgo"
        elif cat.startswith("Organización"):
            key = "Jornada de trabajo"

        if key in STANDARD_SUGGESTIONS:
            for sugg in STANDARD_SUGGESTIONS[key]:
                suggestions.append({
                    "category_flagged": cat,
                    "intervention_level": sugg["intervention_level"],
                    "description": sugg["description"],
                    "impacted_dimensions": build_impacted_dimensions(
                        responses,
                        cat,
                        survey_session.guide_type,
                    ),
                })
                
    return {
        "flagged_categories": list(flagged_categories),
        "suggestions": suggestions
    }
