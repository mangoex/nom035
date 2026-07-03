# backend/app/schemas/superadmin.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime

class TrainingItem(BaseModel):
    codigo: str
    nombre: str
    horas: int
    nivel: Optional[int] = 1

class ConsultantCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    cedula_profesional: Optional[str] = None
    creditos: Optional[int] = 0
    capacitaciones: Optional[List[TrainingItem]] = []
    is_active: Optional[bool] = True

class ConsultantUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    cedula_profesional: Optional[str] = None
    creditos: Optional[int] = None
    capacitaciones: Optional[List[TrainingItem]] = None
    is_active: Optional[bool] = None

class PaymentHistoryItem(BaseModel):
    date: datetime.date
    amount: int
    note: Optional[str] = None

class ConsultantBillingUpdate(BaseModel):
    billing_paid: bool = False
    billing_due_date: Optional[datetime.date] = None
    billing_amount: Optional[int] = 0
    billing_history: Optional[List[PaymentHistoryItem]] = []

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
    is_active: bool = True
    billing_paid: bool = False
    billing_due_date: Optional[datetime.date] = None
    billing_amount: Optional[int] = 0
    billing_history: Optional[List[PaymentHistoryItem]] = []
    created_at: datetime.datetime

    class Config:
        from_attributes = True
