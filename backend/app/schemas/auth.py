# backend/app/schemas/auth.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
import datetime

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    company_name: Optional[str] = None
    employee_count: Optional[int] = None
    rfc: Optional[str] = None
    sector: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    company_id: Optional[int] = None
    cedula_profesional: Optional[str] = None
    cedula_image_url: Optional[str] = None
    creditos: Optional[int] = None
    logo_url: Optional[str] = None
    capacitaciones: Optional[List[Dict[str, Any]]] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class TokenOut(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class ConsultantUserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    company_id: int

class ConsultantUserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    company_id: Optional[int] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    cedula_profesional: Optional[str] = None
    capacitaciones: Optional[List[Dict[str, Any]]] = None

