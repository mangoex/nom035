# backend/app/schemas/action_plan.py
from pydantic import BaseModel
from typing import Optional
import datetime

class ActionPlanCreate(BaseModel):
    category_flagged: Optional[str] = None
    domain_flagged: Optional[str] = None
    intervention_level: str  # 'first_level', 'second_level', 'third_level'
    description: str
    status: Optional[str] = "pending"  # 'pending', 'in_progress', 'completed'
    due_date: Optional[datetime.date] = None

class ActionPlanUpdate(BaseModel):
    intervention_level: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None  # 'pending', 'in_progress', 'completed'
    due_date: Optional[datetime.date] = None

class ActionPlanOut(BaseModel):
    id: int
    company_id: int
    category_flagged: Optional[str]
    domain_flagged: Optional[str]
    intervention_level: str
    status: str
    description: str
    due_date: Optional[datetime.date]
    created_at: datetime.datetime

    class Config:
        from_attributes = True
