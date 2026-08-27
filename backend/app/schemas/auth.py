# backend/app/schemas/auth.py
from pydantic import BaseModel, EmailStr, ConfigDict, Field, StrictBool
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
    is_active: bool = True
    is_senior: bool = False
    parent_consultant_id: Optional[int] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

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

class SubConsultantCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    cedula_profesional: Optional[str] = None
    creditos: int = Field(default=0, ge=0)

class SubConsultantUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    cedula_profesional: Optional[str] = None
    creditos: Optional[int] = Field(default=None, ge=0)
    is_active: Optional[StrictBool] = None

class SubConsultantOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    cedula_profesional: Optional[str] = None
    cedula_image_url: Optional[str] = None
    creditos: Optional[int] = 0
    logo_url: Optional[str] = None
    is_active: bool = True
    is_senior: bool = False
    parent_consultant_id: Optional[int] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    cedula_profesional: Optional[str] = None
    capacitaciones: Optional[List[Dict[str, Any]]] = None
