# backend/app/schemas/company.py
from pydantic import BaseModel
from typing import Optional
import datetime

class CompanyCreate(BaseModel):
    name: str
    rfc: str
    employee_count: int
    sector: Optional[str] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    rfc: Optional[str] = None
    employee_count: Optional[int] = None
    sector: Optional[str] = None

class CompanyOut(BaseModel):
    id: int
    name: str
    rfc: str
    employee_count: int
    sector: Optional[str]
    active_guide: str  # 'GUIA_I', 'GUIA_II', 'GUIA_III'
    logo_url: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True
