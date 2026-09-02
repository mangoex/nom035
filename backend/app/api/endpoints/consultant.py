# backend/app/api/endpoints/consultant.py
import secrets
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from backend.app.db.session import get_db
from backend.app.db.models import User, Company, SurveySession, SurveyResponse
from backend.app.schemas.company import CompanyOut, CompanyCreate, CompanyUpdate
from backend.app.schemas.action_plan import ActionPlanPinOut
from backend.app.schemas.auth import (
    ConsultantUserCreate,
    ConsultantUserUpdate,
    SubConsultantCreate,
    SubConsultantUpdate,
    SubConsultantOut
)
from backend.app.core.auth import (
    get_current_consultant,
    get_current_senior_consultant,
    get_password_hash, action_plan_pin_secret
)
from backend.app.core.company_utils import normalize_departments
from backend.app.api.endpoints.survey import (
    build_session_results_excel,
    build_survey_responses,
    build_survey_statistics,
)

router = APIRouter()


@router.post("/survey-sessions/{session_id}/action-plan-pin", response_model=ActionPlanPinOut)
def generate_action_plan_pin(
    session_id: int,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_consultant),
):
    """Creates a replacement PIN and returns it once to the responsible consultant."""
    survey_session = db.query(SurveySession).join(Company).filter(
        SurveySession.id == session_id,
        SurveySession.consultant_access_enabled == True,
        SurveySession.guide_type.in_(["GUIA_II", "GUIA_III"]),
        Company.consultant_id == current_user.id,
    ).with_for_update().first()
    if not survey_session:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada o no pertenece a su consultoría.")
    if not db.query(SurveyResponse.id).filter(SurveyResponse.survey_session_id == survey_session.id).first():
        raise HTTPException(status_code=400, detail="El PIN sólo puede generarse cuando la encuesta tenga resultados.")
    pin = f"{secrets.randbelow(10_000):04d}"
    survey_session.action_plan_pin_hash = bcrypt.hashpw(action_plan_pin_secret(pin), bcrypt.gensalt()).decode("utf-8")
    survey_session.action_plan_pin_attempts = 0
    survey_session.action_plan_pin_locked_until = None
    survey_session.action_plan_pin_version = (survey_session.action_plan_pin_version or 0) + 1
    db.commit()
    response.headers["Cache-Control"] = "no-store"
    return {"pin": pin, "survey_session_id": survey_session.id}


def consultant_consumed_credits(db: Session, consultant_id: int) -> int:
    """Responses belonging to the consultant's own companies consume quota."""
    return db.query(SurveyResponse).join(
        Company, SurveyResponse.company_id == Company.id
    ).filter(Company.consultant_id == consultant_id).count()


def consultant_available_credits(db: Session, consultant: User) -> int:
    return max(0, (consultant.creditos or 0) - consultant_consumed_credits(db, consultant.id))


def locked_consultant(db: Session, consultant_id: int) -> User:
    # PostgreSQL locks the quota row; SQLite safely ignores FOR UPDATE.
    return db.query(User).filter(User.id == consultant_id).with_for_update().one()


def commit_or_rollback(db: Session):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se pudo guardar el cambio por un conflicto de integridad.",
        )
    except Exception:
        db.rollback()
        raise

def get_authorized_consultant_session(
    db: Session,
    consultant_id: int,
    session_id: int
):
    session = (
        db.query(SurveySession)
        .join(Company, SurveySession.company_id == Company.id)
        .filter(
            SurveySession.id == session_id,
            SurveySession.consultant_access_enabled == True,
            SurveySession.guide_type.in_(["GUIA_II", "GUIA_III"]),
            Company.consultant_id == consultant_id,
        )
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Encuesta no encontrada o sin autorizacion para consultoria."
        )
    return session

@router.get("/stats")
def get_consultant_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_consultant)
):
    # Fetch all companies registered by this consultant
    companies = db.query(Company).filter(Company.consultant_id == current_user.id).all()
    company_ids = [c.id for c in companies]
    
    total_companies = len(companies)
    total_sessions = 0
    total_responses = 0
    total_missing = 0
    
    if company_ids:
        # Sum of survey sessions generated
        total_sessions = db.query(SurveySession).filter(SurveySession.company_id.in_(company_ids)).count()
        
        # Sum of completed responses
        total_responses = db.query(SurveyResponse).filter(SurveyResponse.company_id.in_(company_ids)).count()
        
        # Calculate missing surveys per company
        for company in companies:
            responses_count = db.query(SurveyResponse).filter(SurveyResponse.company_id == company.id).count()
            missing = max(0, company.employee_count - responses_count)
            total_missing += missing
            
    creditos_totales = current_user.creditos or 0
    creditos_disponibles = consultant_available_credits(db, current_user)
    
    return {
        "total_companies": total_companies,
        "total_sessions": total_sessions,
        "total_responses": total_responses,
        "total_missing": total_missing,
        "creditos_totales": creditos_totales,
        "creditos_disponibles": creditos_disponibles
    }

@router.get("/survey-sessions")
def get_authorized_survey_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_consultant)
):
    sessions = (
        db.query(SurveySession, Company)
        .join(Company, SurveySession.company_id == Company.id)
        .filter(
            Company.consultant_id == current_user.id,
            SurveySession.consultant_access_enabled == True,
            SurveySession.guide_type.in_(["GUIA_II", "GUIA_III"]),
        )
        .order_by(SurveySession.created_at.desc())
        .all()
    )

    return [
        {
            "id": session.id,
            "company_id": company.id,
            "company_name": company.name,
            "guide_type": session.guide_type,
            "is_active": session.is_active,
            "recopilador": session.recopilador,
            "creador": session.creador,
            "cedula_creador": session.cedula_creador,
            "fecha_fin": session.fecha_fin,
            "created_at": session.created_at,
            "response_count": session.response_count,
        }
        for session, company in sessions
    ]

@router.get("/survey-sessions/{session_id}/context")
def get_authorized_survey_context(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_consultant)
):
    session = get_authorized_consultant_session(db, current_user.id, session_id)
    company = db.query(Company).filter(Company.id == session.company_id).first()
    return {
        "session": {
            "id": session.id,
            "guide_type": session.guide_type,
            "response_count": session.response_count,
            "created_at": session.created_at,
            "fecha_fin": session.fecha_fin,
        },
        "company": {
            "id": company.id,
            "name": company.name,
            "rfc": company.rfc,
            "employee_count": company.employee_count,
            "sector": company.sector,
            "address": company.address,
            "phone": company.phone,
            "main_activity": company.main_activity,
            "departments": company.departments or [],
            "active_guide": company.active_guide,
            "logo_url": company.logo_url,
            "consultant_id": company.consultant_id,
            "created_at": company.created_at,
        }
    }

@router.get("/survey-sessions/{session_id}/stats")
def get_authorized_survey_statistics(
    session_id: int,
    age_range: Optional[str] = None,
    gender: Optional[str] = None,
    department: Optional[str] = None,
    position: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_consultant)
):
    session = get_authorized_consultant_session(db, current_user.id, session_id)
    company = db.query(Company).filter(Company.id == session.company_id).first()
    return build_survey_statistics(
        db,
        company.id,
        session.guide_type,
        age_range,
        gender,
        department,
        position,
        start_date,
        end_date,
        session.id,
        None
    )

@router.get("/survey-sessions/{session_id}/responses")
def get_authorized_survey_responses(
    session_id: int,
    age_range: Optional[str] = None,
    gender: Optional[str] = None,
    department: Optional[str] = None,
    position: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_consultant)
):
    session = get_authorized_consultant_session(db, current_user.id, session_id)
    return build_survey_responses(
        db,
        session.company_id,
        age_range,
        gender,
        department,
        position,
        start_date,
        end_date,
        session.id,
        None
    )

@router.get("/survey-sessions/{session_id}/export-excel")
def export_authorized_survey_results_excel(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_consultant)
):
    session = get_authorized_consultant_session(db, current_user.id, session_id)
    responses = db.query(SurveyResponse).filter(SurveyResponse.survey_session_id == session.id).all()
    if not responses:
        raise HTTPException(status_code=400, detail="No hay respuestas para exportar.")
    return build_session_results_excel(session, responses)

@router.get("/companies", response_model=List[CompanyOut])
def get_consultant_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_consultant)
):
    return db.query(Company).filter(Company.consultant_id == current_user.id).order_by(Company.created_at.desc()).all()

@router.post("/companies", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
def create_consultant_company(
    company_in: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_consultant)
):
    # Check if company already exists by name/rfc
    existing = db.query(Company).filter(
        (Company.name == company_in.name) | (Company.rfc == company_in.rfc)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Una empresa con este nombre o RFC ya existe."
        )

    emp_count = company_in.employee_count
    guide_type = "GUIA_II" if emp_count <= 50 else "GUIA_III"

    company = Company(
        name=company_in.name,
        rfc=company_in.rfc,
        employee_count=emp_count,
        sector=company_in.sector,
        address=company_in.address,
        phone=company_in.phone,
        main_activity=company_in.main_activity,
        departments=normalize_departments(company_in.departments) or [],
        active_guide=guide_type,
        consultant_id=current_user.id
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company

@router.put("/companies/{company_id}", response_model=CompanyOut)
def update_consultant_company(
    company_id: int,
    company_in: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_consultant)
):
    company = db.query(Company).filter(
        Company.id == company_id, 
        Company.consultant_id == current_user.id
    ).first()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa no encontrada o no pertenece a su consultoría."
        )

    if company_in.name is not None:
        company.name = company_in.name
    if company_in.rfc is not None:
        company.rfc = company_in.rfc
    if company_in.employee_count is not None:
        company.employee_count = company_in.employee_count
        company.active_guide = "GUIA_II" if company_in.employee_count <= 50 else "GUIA_III"
    if company_in.sector is not None:
        company.sector = company_in.sector
    if company_in.address is not None:
        company.address = company_in.address
    if company_in.phone is not None:
        company.phone = company_in.phone
    if company_in.main_activity is not None:
        company.main_activity = company_in.main_activity
    if company_in.departments is not None:
        company.departments = normalize_departments(company_in.departments)

    db.commit()
    db.refresh(company)
    return company

@router.delete("/companies/{company_id}", status_code=status.HTTP_200_OK)
def delete_consultant_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_consultant)
):
    company = db.query(Company).filter(
        Company.id == company_id, 
        Company.consultant_id == current_user.id
    ).first()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa no encontrada o no pertenece a su consultoría."
        )

    db.delete(company)
    db.commit()
    return {"message": "Empresa eliminada exitosamente."}

@router.get("/users")
def get_consultant_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_consultant)
):
    # Get all companies of this consultant
    companies = db.query(Company).filter(Company.consultant_id == current_user.id).all()
    company_ids = [c.id for c in companies]
    
    if not company_ids:
        return []
        
    users = db.query(User).filter(User.company_id.in_(company_ids)).order_by(User.created_at.desc()).all()
    
    # Map users to include company name
    result = []
    for u in users:
        comp = next((c for c in companies if c.id == u.company_id), None)
        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "company_id": u.company_id,
            "company_name": comp.name if comp else None,
            "created_at": u.created_at
        })
    return result

@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_consultant_user(
    user_in: ConsultantUserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_consultant)
):
    # Verify company belongs to this consultant
    company = db.query(Company).filter(
        Company.id == user_in.company_id,
        Company.consultant_id == current_user.id
    ).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La empresa seleccionada no existe o no pertenece a su consultoría."
        )
        
    # Check if email is already taken
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado por otro usuario."
        )
        
    hashed_pwd = get_password_hash(user_in.password)
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hashed_pwd,
        role="company_admin",
        company_id=user_in.company_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "role": new_user.role,
        "company_id": new_user.company_id,
        "company_name": company.name,
        "created_at": new_user.created_at
    }

@router.put("/users/{user_id}")
def update_consultant_user(
    user_id: int,
    user_in: ConsultantUserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_consultant)
):
    # Verify target user belongs to a company registered by this consultant
    companies = db.query(Company).filter(Company.consultant_id == current_user.id).all()
    company_ids = [c.id for c in companies]
    
    user = db.query(User).filter(
        User.id == user_id,
        User.company_id.in_(company_ids)
    ).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado o no pertenece a su consultoría."
        )
        
    if user_in.company_id is not None:
        # Verify the new company also belongs to this consultant
        new_company = db.query(Company).filter(
            Company.id == user_in.company_id,
            Company.consultant_id == current_user.id
        ).first()
        if not new_company:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La nueva empresa seleccionada no pertenece a su consultoría."
            )
        user.company_id = user_in.company_id
        
    if user_in.email is not None:
        # Check if email is already taken by another user
        existing = db.query(User).filter(
            User.email == user_in.email,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya está registrado por otro usuario."
            )
        user.email = user_in.email
        
    if user_in.name is not None:
        user.name = user_in.name
        
    if user_in.password is not None and user_in.password.strip() != "":
        user.password_hash = get_password_hash(user_in.password)
        
    db.commit()
    db.refresh(user)
    
    comp = db.query(Company).filter(Company.id == user.company_id).first()
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "company_id": user.company_id,
        "company_name": comp.name if comp else None,
        "created_at": user.created_at
    }

@router.delete("/users/{user_id}")
def delete_consultant_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_consultant)
):
    # Verify user belongs to a company registered by this consultant
    companies = db.query(Company).filter(Company.consultant_id == current_user.id).all()
    company_ids = [c.id for c in companies]
    
    user = db.query(User).filter(
        User.id == user_id,
        User.company_id.in_(company_ids)
    ).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado o no pertenece a su consultoría."
        )
        
    db.delete(user)
    db.commit()
    return {"message": "Usuario eliminado exitosamente."}


# --- SENIOR CONSULTANT: SUB-CONSULTANTS MANAGEMENT ---

@router.get("/sub-consultants", response_model=List[SubConsultantOut])
def get_sub_consultants(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_senior_consultant)
):
    sub_consultants = (
        db.query(User)
        .filter(User.parent_consultant_id == current_user.id, User.role == "consultor")
        .order_by(User.created_at.desc())
        .all()
    )
    return sub_consultants

@router.post("/sub-consultants", response_model=SubConsultantOut, status_code=status.HTTP_201_CREATED)
def create_sub_consultant(
    sub_in: SubConsultantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_senior_consultant)
):
    # Check email uniqueness
    existing = db.query(User).filter(User.email == sub_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado por otro usuario."
        )

    # Check and deduct credits from Senior consultant
    credits_to_assign = sub_in.creditos or 0
    if credits_to_assign < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los créditos asignados no pueden ser negativos."
        )
    
    senior = locked_consultant(db, current_user.id)
    available_credits = consultant_available_credits(db, senior)
    if credits_to_assign > available_credits:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"No cuentas con créditos disponibles ({available_credits}) para asignar {credits_to_assign} créditos."
        )

    # Deduct from senior
    senior.creditos = (senior.creditos or 0) - credits_to_assign

    hashed_password = get_password_hash(sub_in.password)
    new_sub = User(
        name=sub_in.name,
        email=sub_in.email,
        password_hash=hashed_password,
        role="consultor",
        cedula_profesional=sub_in.cedula_profesional,
        creditos=credits_to_assign,
        is_active=True,
        is_senior=False,  # Sub-consultants can NEVER be senior
        parent_consultant_id=current_user.id,
        company_id=None
    )
    db.add(new_sub)
    commit_or_rollback(db)
    db.refresh(new_sub)
    return new_sub

@router.put("/sub-consultants/{user_id}", response_model=SubConsultantOut)
def update_sub_consultant(
    user_id: int,
    sub_in: SubConsultantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_senior_consultant)
):
    sub = db.query(User).filter(
        User.id == user_id,
        User.parent_consultant_id == current_user.id,
        User.role == "consultor"
    ).first()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultor subordinado no encontrado."
        )

    # Lock quota rows before applying any request-provided mutation.  Otherwise
    # autoflush can surface a uniqueness error outside the rollback boundary.
    senior = locked_consultant(db, current_user.id)
    sub = locked_consultant(db, sub.id)

    if sub_in.email is not None and sub_in.email != sub.email:
        existing = db.query(User).filter(User.email == sub_in.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya está en uso por otro usuario."
            )
        sub.email = sub_in.email

    if sub_in.name is not None:
        sub.name = sub_in.name

    if sub_in.password is not None and sub_in.password.strip() != "":
        sub.password_hash = get_password_hash(sub_in.password)

    if sub_in.cedula_profesional is not None:
        sub.cedula_profesional = sub_in.cedula_profesional

    if sub_in.is_active is not None:
        sub.is_active = sub_in.is_active

    if sub_in.creditos is not None:
        new_credits = sub_in.creditos
        consumed_credits = consultant_consumed_credits(db, sub.id)
        if new_credits < consumed_credits:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"No se puede reducir la cuota por debajo de los créditos consumidos ({consumed_credits}).",
            )
        old_credits = sub.creditos or 0
        diff = new_credits - old_credits
        if diff > 0:
            available_credits = consultant_available_credits(db, senior)
            if diff > available_credits:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"No cuentas con créditos disponibles ({available_credits}) para aumentar {diff} créditos."
                )
            senior.creditos = (senior.creditos or 0) - diff
        elif diff < 0:
            senior.creditos = (senior.creditos or 0) + abs(diff)
        sub.creditos = new_credits

    commit_or_rollback(db)
    db.refresh(sub)
    return sub

@router.delete("/sub-consultants/{user_id}", status_code=status.HTTP_200_OK)
def delete_sub_consultant(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_senior_consultant)
):
    sub = db.query(User).filter(
        User.id == user_id,
        User.parent_consultant_id == current_user.id,
        User.role == "consultor"
    ).first()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultor subordinado no encontrado."
        )

    senior = locked_consultant(db, current_user.id)
    sub = locked_consultant(db, sub.id)
    # Only unconsumed quota returns to the senior's available balance.
    refund_credits = max(0, (sub.creditos or 0) - consultant_consumed_credits(db, sub.id))
    if refund_credits > 0:
        senior.creditos = (senior.creditos or 0) + refund_credits

    db.query(Company).filter(Company.consultant_id == sub.id).update(
        {Company.consultant_id: None}, synchronize_session=False
    )
    db.delete(sub)
    commit_or_rollback(db)
    return {"message": "Consultor subordinado eliminado exitosamente."}

@router.put("/sub-consultants/{user_id}/toggle-active", response_model=SubConsultantOut)
def toggle_sub_consultant_active(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_senior_consultant)
):
    sub = db.query(User).filter(
        User.id == user_id,
        User.parent_consultant_id == current_user.id,
        User.role == "consultor"
    ).first()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultor subordinado no encontrado."
        )

    sub.is_active = not sub.is_active
    db.commit()
    db.refresh(sub)
    return sub
