# backend/app/schemas/superadmin.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime

class TrainingItem(BaseModel):
    codigo: str
    nombre: str
    horas: int

class ConsultantCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    cedula_profesional: Optional[str] = None
    creditos: Optional[int] = 0
    capacitaciones: Optional[List[TrainingItem]] = []

class ConsultantUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    cedula_profesional: Optional[str] = None
    creditos: Optional[int] = None
    capacitaciones: Optional[List[TrainingItem]] = None

class ConsultantOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    cedula_profesional: Optional[str] = None
    cedula_image_url: Optional[str] = None
    creditos: Optional[int] = 0
    logo_url: Optional[str] = None
    capacitaciones: Optional[List[TrainingItem]] = []
    created_at: datetime.datetime

    class Config:
        from_attributes = True
