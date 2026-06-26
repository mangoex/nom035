# backend/app/api/endpoints/superadmin.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.app.db.session import get_db
from backend.app.db.models import User, Company
from backend.app.schemas.company import CompanyOut, CompanyCreate, CompanyUpdate
from backend.app.schemas.superadmin import ConsultantCreate, ConsultantUpdate, ConsultantOut
from backend.app.core.auth import get_current_superadmin, get_password_hash

router = APIRouter()

# --- COMPANY MANAGEMENT ---

@router.get("/companies", response_model=List[CompanyOut])
def get_all_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    return db.query(Company).order_by(Company.created_at.desc()).all()

@router.post("/companies", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
def create_company_admin(
    company_in: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
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
        active_guide=guide_type
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company

@router.put("/companies/{company_id}", response_model=CompanyOut)
def update_company_admin(
    company_id: int,
    company_in: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa no encontrada."
        )

    if company_in.name is not None:
        company.name = company_in.name
    if company_in.rfc is not None:
        company.rfc = company_in.rfc
    if company_in.employee_count is not None:
        company.employee_count = company_in.employee_count
        # Automatically update active guide if employee count changes
        company.active_guide = "GUIA_II" if company_in.employee_count <= 50 else "GUIA_III"
    if company_in.sector is not None:
        company.sector = company_in.sector

    db.commit()
    db.refresh(company)
    return company

@router.delete("/companies/{company_id}", status_code=status.HTTP_200_OK)
def delete_company_admin(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa no encontrada."
        )

    db.delete(company)
    db.commit()
    return {"message": "Empresa eliminada exitosamente."}


# --- CONSULTANT MANAGEMENT ---

@router.get("/consultants", response_model=List[ConsultantOut])
def get_all_consultants(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    return db.query(User).filter(User.role == "consultor").order_by(User.created_at.desc()).all()

@router.post("/consultants", response_model=ConsultantOut, status_code=status.HTTP_201_CREATED)
def create_consultant(
    consultant_in: ConsultantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    # Check if user already exists
    existing = db.query(User).filter(User.email == consultant_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado."
        )

    hashed_password = get_password_hash(consultant_in.password)
    user = User(
        name=consultant_in.name,
        email=consultant_in.email,
        password_hash=hashed_password,
        role="consultor",
        cedula_profesional=consultant_in.cedula_profesional,
        creditos=consultant_in.creditos,
        company_id=None
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.put("/consultants/{user_id}", response_model=ConsultantOut)
def update_consultant(
    user_id: int,
    consultant_in: ConsultantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    user = db.query(User).filter(User.id == user_id, User.role == "consultor").first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultor no encontrado."
        )

    if consultant_in.name is not None:
        user.name = consultant_in.name
    if consultant_in.email is not None:
        # Check email uniqueness if changing email
        if consultant_in.email != user.email:
            existing = db.query(User).filter(User.email == consultant_in.email).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El correo electrónico ya está en uso por otro usuario."
                )
        user.email = consultant_in.email
    if consultant_in.password is not None and consultant_in.password != "":
        user.password_hash = get_password_hash(consultant_in.password)
    if consultant_in.cedula_profesional is not None:
        user.cedula_profesional = consultant_in.cedula_profesional
    if consultant_in.creditos is not None:
        user.creditos = consultant_in.creditos

    db.commit()
    db.refresh(user)
    return user

@router.delete("/consultants/{user_id}", status_code=status.HTTP_200_OK)
def delete_consultant(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    user = db.query(User).filter(User.id == user_id, User.role == "consultor").first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultor no encontrado."
        )

    db.delete(user)
    db.commit()
    return {"message": "Consultor eliminado exitosamente."}
