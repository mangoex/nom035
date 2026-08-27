# backend/app/api/endpoints/action_plan.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.db.models import User, ActionPlan, SurveyResponse
from backend.app.schemas.action_plan import ActionPlanCreate, ActionPlanUpdate, ActionPlanOut
from backend.app.core.auth import get_current_admin
from backend.app.core.nom035_engine import (
    GUIA_II_MAPPING,
    GUIA_II_THRESHOLDS,
    GUIA_III_MAPPING,
    GUIA_III_THRESHOLDS,
    get_risk_level,
)

router = APIRouter()

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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return db.query(ActionPlan).filter(ActionPlan.company_id == current_user.company_id).all()

@router.post("/tasks", response_model=ActionPlanOut, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: ActionPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    task = ActionPlan(
        company_id=current_user.company_id,
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    task = db.query(ActionPlan).filter(
        ActionPlan.id == task_id,
        ActionPlan.company_id == current_user.company_id
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    deleted_count = db.query(ActionPlan).filter(
        ActionPlan.company_id == current_user.company_id
    ).delete()
    db.commit()
    return {"message": f"Tablero limpiado. {deleted_count} tareas eliminadas."}

@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    task = db.query(ActionPlan).filter(
        ActionPlan.id == task_id,
        ActionPlan.company_id == current_user.company_id
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    # Fetch latest response stats or raw responses to find high risks
    responses = db.query(SurveyResponse).filter(
        SurveyResponse.company_id == current_user.company_id
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
                        current_user.company.active_guide,
                    ),
                })
                
    return {
        "flagged_categories": list(flagged_categories),
        "suggestions": suggestions
    }
