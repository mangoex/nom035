# backend/app/db/models.py
import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Date
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    rfc = Column(String, nullable=False)
    employee_count = Column(Integer, default=0)
    sector = Column(String, nullable=True)
    active_guide = Column(String, nullable=False)  # 'GUIA_I', 'GUIA_II', 'GUIA_III'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="company", cascade="all, delete-orphan")
    survey_sessions = relationship("SurveySession", back_populates="company", cascade="all, delete-orphan")
    survey_responses = relationship("SurveyResponse", back_populates="company", cascade="all, delete-orphan")
    action_plans = relationship("ActionPlan", back_populates="company", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=True)  # Nullable for superadmin
    role = Column(String, nullable=False)  # 'superadmin', 'company_admin'
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="users")


class SurveySession(Base):
    __tablename__ = "survey_sessions"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    guide_type = Column(String, nullable=False)  # 'GUIA_I', 'GUIA_II', 'GUIA_III'
    link_hash = Column(String, unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="survey_sessions")
    responses = relationship("SurveyResponse", back_populates="survey_session", cascade="all, delete-orphan")


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    survey_session_id = Column(Integer, ForeignKey("survey_sessions.id", ondelete="CASCADE"), nullable=True) # Nullable if CSV uploaded
    
    # JSON containing demographics: {age_range, gender, department, position}
    demographics = Column(JSON, nullable=False)
    
    # JSON containing raw answers: {q1: 'Siempre', q2: 3, ...}
    answers = Column(JSON, nullable=False)
    
    # JSON containing calculated scores: {final_score, final_risk, category_scores, category_risks, ...}
    calculated_scores = Column(JSON, nullable=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="survey_responses")
    survey_session = relationship("SurveySession", back_populates="responses")


class ActionPlan(Base):
    __tablename__ = "action_plans"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    category_flagged = Column(String, nullable=True)
    domain_flagged = Column(String, nullable=True)
    intervention_level = Column(String, nullable=False)  # 'first_level', 'second_level', 'third_level'
    status = Column(String, default="pending")  # 'pending', 'in_progress', 'completed'
    description = Column(String, nullable=False)
    due_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="action_plans")
