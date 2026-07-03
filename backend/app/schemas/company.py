# backend/app/schemas/company.py
from pydantic import BaseModel, Field
from typing import Optional
import datetime

class CompanyCreate(BaseModel):
    name: str
    rfc: str
    employee_count: int
    sector: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    main_activity: Optional[str] = None
    departments: Optional[list[str]] = Field(default_factory=list)

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    rfc: Optional[str] = None
    employee_count: Optional[int] = None
    sector: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    main_activity: Optional[str] = None
    departments: Optional[list[str]] = None

class PolicyUpdate(BaseModel):
    policy_text: str

class CompanyOut(BaseModel):
    id: int
    name: str
    rfc: str
    employee_count: int
    sector: Optional[str]
    address: Optional[str] = None
    phone: Optional[str] = None
    main_activity: Optional[str] = None
    departments: Optional[list[str]] = Field(default_factory=list)
    active_guide: str  # 'GUIA_I', 'GUIA_II', 'GUIA_III'
    logo_url: Optional[str] = None
    policy_text: Optional[str] = None
    policy_pdf_url: Optional[str] = None
    consultant_id: Optional[int] = None
    consultant_logo_url: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True
