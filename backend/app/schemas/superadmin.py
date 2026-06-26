# backend/app/schemas/superadmin.py
from pydantic import BaseModel, EmailStr
from typing import Optional
import datetime

class ConsultantCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    cedula_profesional: Optional[str] = None
    creditos: Optional[int] = 0

class ConsultantUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    cedula_profesional: Optional[str] = None
    creditos: Optional[int] = None

class ConsultantOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    cedula_profesional: Optional[str] = None
    creditos: Optional[int] = 0
    logo_url: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True
