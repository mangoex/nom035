# backend/app/api/endpoints/consultant.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from backend.app.db.session import get_db
from backend.app.db.models import User, Company, SurveySession, SurveyResponse
from backend.app.schemas.company import CompanyOut, CompanyCreate, CompanyUpdate
from backend.app.schemas.auth import ConsultantUserCreate, ConsultantUserUpdate
from backend.app.core.auth import get_current_consultant, get_password_hash
from backend.app.core.company_utils import normalize_departments

router = APIRouter()

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
    creditos_disponibles = max(0, creditos_totales - total_responses)
    
    return {
        "total_companies": total_companies,
        "total_sessions": total_sessions,
        "total_responses": total_responses,
        "total_missing": total_missing,
        "creditos_totales": creditos_totales,
        "creditos_disponibles": creditos_disponibles
    }

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

