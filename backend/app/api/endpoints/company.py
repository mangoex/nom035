# backend/app/api/endpoints/company.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
import os
import shutil
import uuid
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.db.models import User, Company
from backend.app.schemas.company import CompanyOut, CompanyUpdate
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

@router.put("/me", response_model=CompanyOut)
def update_my_company(
    company_in: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada.")
    
    if company_in.name is not None:
        company.name = company_in.name
    if company_in.rfc is not None:
        company.rfc = company_in.rfc
    if company_in.employee_count is not None:
        company.employee_count = company_in.employee_count
    if company_in.sector is not None:
        company.sector = company_in.sector
    if company_in.address is not None:
        company.address = company_in.address
    if company_in.phone is not None:
        company.phone = company_in.phone
    if company_in.main_activity is not None:
        company.main_activity = company_in.main_activity
        
    db.commit()
    db.refresh(company)
    return company

@router.post("/me/logo")
def upload_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada.")

    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="El archivo debe ser PNG o JPEG.")

    # Create uploads directory if not exists
    from backend.app.db.session import get_uploads_dir
    uploads_dir = os.path.join(get_uploads_dir(), "logos")
    os.makedirs(uploads_dir, exist_ok=True)

    # Generate unique filename
    ext = file.filename.split(".")[-1]
    filename = f"logo_{company.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(uploads_dir, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Clean up old logo if exists
    if company.logo_url:
        old_filename = company.logo_url.split("/")[-1]
        old_filepath = os.path.join(uploads_dir, old_filename)
        if os.path.exists(old_filepath):
            try:
                os.remove(old_filepath)
            except:
                pass

    company.logo_url = f"/uploads/logos/{filename}"
    db.commit()
    db.refresh(company)
    
    return {"logo_url": company.logo_url}

@router.get("/consultant-trainings")
def get_consultant_trainings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada.")
        
    if not company.consultant_id:
        return []
        
    consultant = db.query(User).filter(User.id == company.consultant_id, User.role == "consultor").first()
    if not consultant or not consultant.capacitaciones:
        return []
        
    return consultant.capacitaciones
