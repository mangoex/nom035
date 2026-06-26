# backend/app/api/endpoints/consultant.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from backend.app.db.session import get_db
from backend.app.db.models import User, Company, SurveySession, SurveyResponse
from backend.app.schemas.company import CompanyOut, CompanyCreate, CompanyUpdate
from backend.app.core.auth import get_current_consultant

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
