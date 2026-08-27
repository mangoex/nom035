# backend/app/schemas/action_plan.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional
import datetime

class DimensionImpact(BaseModel):
    name: str
    score: float
    risk: str


class ActionPlanCreate(BaseModel):
    category_flagged: Optional[str] = None
    domain_flagged: Optional[str] = None
    intervention_level: str  # 'first_level', 'second_level', 'third_level'
    description: str
    assigned_to: Optional[str] = None
    impacted_dimensions: list[DimensionImpact] = Field(default_factory=list)
    status: Optional[str] = "pending"  # 'pending', 'in_progress', 'completed'
    due_date: Optional[datetime.date] = None

class ActionPlanUpdate(BaseModel):
    intervention_level: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    impacted_dimensions: Optional[list[DimensionImpact]] = None
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
    assigned_to: Optional[str] = None
    impacted_dimensions: list[DimensionImpact] = Field(default_factory=list)
    due_date: Optional[datetime.date]
    created_at: datetime.datetime

    @field_validator("impacted_dimensions", mode="before")
    @classmethod
    def normalize_missing_dimensions(cls, value):
        return value or []

    class Config:
        from_attributes = True
