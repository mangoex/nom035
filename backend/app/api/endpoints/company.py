# backend/app/api/endpoints/company.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.db.models import User, Company
from backend.app.schemas.company import CompanyOut
from backend.app.core.auth import get_current_admin

router = APIRouter()

@router.get("/me", response_model=CompanyOut)
def get_my_company(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa no encontrada."
        )
    return company
