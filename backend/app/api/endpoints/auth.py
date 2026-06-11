# backend/app/api/endpoints/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.db.models import User, Company
from backend.app.schemas.auth import UserRegister, UserLogin, UserOut
from backend.app.core.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter()

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, response: Response, db: Session = Depends(get_db)):
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
    if emp_count <= 15:
        guide_type = "GUIA_I"
    elif emp_count <= 50:
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
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=60 * 60 * 24,  # 1 day
        samesite="lax",
        secure=False  # Set to True in production with HTTPS
    )

    return user

@router.post("/login")
def login(user_in: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Correo electrónico o contraseña incorrectos."
        )

    # Generate token and set HttpOnly Cookie
    access_token = create_access_token(data={"sub": user.email})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=60 * 60 * 24,  # 1 day
        samesite="lax",
        secure=False  # Set to True in production with HTTPS
    )

    return {"user": UserOut.model_validate(user), "access_token": access_token}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Sesión cerrada correctamente."}

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
