# backend/app/schemas/survey.py
from pydantic import BaseModel, Field
from typing import Optional, Any
import datetime

class DemographicsSchema(BaseModel):
    age_range: str = Field(description="e.g. 18-25, 26-35, 36-45, 46+")
    gender: str = Field(description="e.g. Masculino, Femenino, Otro")
    department: str = Field(description="e.g. Administración, Ventas, Operaciones")
    position: str = Field(description="e.g. Operativo, Supervisor, Directivo")

class SurveySessionOut(BaseModel):
    id: int
    company_id: int
    guide_type: str
    link_hash: str
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class SurveyResponseCreate(BaseModel):
    demographics: DemographicsSchema
    # dict where keys are 'q1', 'q2', etc., and values are strings ("Siempre", "Nunca", etc.) or ints
    answers: dict[str, Any]

class SurveyResponseOut(BaseModel):
    id: int
    company_id: int
    survey_session_id: Optional[int]
    demographics: DemographicsSchema
    answers: dict[str, Any]
    calculated_scores: dict[str, Any]
    created_at: datetime.datetime

    class Config:
        from_attributes = True
