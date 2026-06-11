# backend/app/schemas/company.py
from pydantic import BaseModel
from typing import Optional
import datetime

class CompanyCreate(BaseModel):
    name: str
    rfc: str
    employee_count: int
    sector: Optional[str] = None

class CompanyOut(BaseModel):
    id: int
    name: str
    rfc: str
    employee_count: int
    sector: Optional[str]
    active_guide: str  # 'GUIA_I', 'GUIA_II', 'GUIA_III'
    created_at: datetime.datetime

    class Config:
        from_attributes = True
