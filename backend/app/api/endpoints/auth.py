# backend/app/api/endpoints/auth.py
import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, UploadFile, File
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.db.models import User, Company
from backend.app.schemas.auth import UserRegister, UserLogin, UserOut, ProfileUpdate
from backend.app.core.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter()

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, response: Response, request: Request, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado."
        )

    # 1. Determine guide type based on employee count
    if not user_in.company_name or not user_in.rfc or user_in.employee_count is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los datos de la empresa (nombre, RFC, empleados) son requeridos para el registro."
        )

    emp_count = user_in.employee_count
    if emp_count <= 50:
        guide_type = "GUIA_II"
    else:
        guide_type = "GUIA_III"

    # 2. Create Company
    company = Company(
        name=user_in.company_name,
        rfc=user_in.rfc,
        employee_count=emp_count,
        sector=user_in.sector,
        active_guide=guide_type
    )
    db.add(company)
    db.commit()
    db.refresh(company)

    # 3. Create User
    hashed_password = get_password_hash(user_in.password)
    user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hashed_password,
        role="company_admin",
        company_id=company.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 4. Generate token and set HttpOnly Cookie
    access_token = create_access_token(data={"sub": user.email})
    host = request.headers.get("host", "")
    is_secure = "localhost" not in host and "127.0.0.1" not in host
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=60 * 60 * 24,  # 1 day
        samesite="lax",
        secure=is_secure
    )

    return user

@router.post("/login")
def login(user_in: UserLogin, response: Response, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Correo electrónico o contraseña incorrectos."
        )

    # Generate token and set HttpOnly Cookie
    access_token = create_access_token(data={"sub": user.email})
    host = request.headers.get("host", "")
    is_secure = "localhost" not in host and "127.0.0.1" not in host
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=60 * 60 * 24,  # 1 day
        samesite="lax",
        secure=is_secure
    )

    return {"user": UserOut.model_validate(user), "message": "Inicio de sesión exitoso"}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Sesión cerrada correctamente."}

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserOut)
def update_profile(
    profile_in: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if profile_in.email is not None:
        # Check if email is already taken by another user
        existing = db.query(User).filter(
            User.email == profile_in.email,
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya está registrado por otro usuario."
            )
        current_user.email = profile_in.email

    if profile_in.name is not None:
        current_user.name = profile_in.name

    if profile_in.password is not None and profile_in.password.strip() != "":
        current_user.password_hash = get_password_hash(profile_in.password)

    if profile_in.cedula_profesional is not None:
        current_user.cedula_profesional = profile_in.cedula_profesional

    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/logo")
def upload_user_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="El archivo debe ser PNG o JPEG.")

    from backend.app.db.session import get_uploads_dir
    uploads_dir = os.path.join(get_uploads_dir(), "user_logos")
    os.makedirs(uploads_dir, exist_ok=True)

    ext = file.filename.split(".")[-1]
    filename = f"user_{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(uploads_dir, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    if current_user.logo_url:
        old_filename = current_user.logo_url.split("/")[-1]
        old_filepath = os.path.join(uploads_dir, old_filename)
        if os.path.exists(old_filepath):
            try:
                os.remove(old_filepath)
            except Exception:
                pass

    current_user.logo_url = f"/uploads/user_logos/{filename}"
    db.commit()
    db.refresh(current_user)
    return {"logo_url": current_user.logo_url}

