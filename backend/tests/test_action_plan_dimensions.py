from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.api.endpoints.action_plan import build_impacted_dimensions, get_action_plan_context
from backend.app.core.auth import get_current_admin
from backend.app.db.models import ActionPlan, Company, SurveyResponse, SurveySession, User
from backend.app.db.session import Base, get_db
from backend.app.main import app


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(name="session")
def session_fixture():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(name="client")
def client_fixture(session):
    company = Company(
        name="Empresa dimensional",
        rfc="DIM010101AA1",
        employee_count=35,
        active_guide="GUIA_II",
    )
    session.add(company)
    session.flush()
    admin = User(
        name="Administradora",
        email="admin-dimensional@example.com",
        password_hash="hash",
        role="company_admin",
        company_id=company.id,
    )
    session.add(admin)
    survey_session = SurveySession(
        company_id=company.id, guide_type="GUIA_II", link_hash="dimensions-session"
    )
    session.add(survey_session)
    session.commit()

    def override_get_db():
        yield session

    def override_action_plan_context():
        return admin, survey_session, company.id

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_action_plan_context] = override_action_plan_context
    try:
        yield TestClient(app), company, survey_session
    finally:
        app.dependency_overrides.clear()


def test_build_impacted_dimensions_uses_only_dimensions_related_to_source_category():
    responses = [
        SimpleNamespace(calculated_scores={
            "dimension_scores": {
                "Cargas cuantitativas": 5,
                "Carga mental": 7,
                "Características del liderazgo": 9,
            }
        }),
        SimpleNamespace(calculated_scores={
            "dimension_scores": {
                "Cargas cuantitativas": 3,
                "Carga mental": 5,
                "Características del liderazgo": 7,
            }
        }),
    ]

    impacts = build_impacted_dimensions(
        responses,
        "Factores propios de la actividad",
        "GUIA_II",
    )

    assert impacts == [
        {"name": "Cargas cuantitativas", "score": 4.0, "risk": "Medio"},
        {"name": "Carga mental", "score": 6.0, "risk": "Muy Alto"},
    ]


def test_suggestions_include_dimensions_and_tasks_persist_them(client, session):
    test_client, company, survey_session = client
    session.add(SurveyResponse(
        company_id=company.id,
        survey_session_id=survey_session.id,
        demographics={"department": "Operaciones"},
        answers={},
        calculated_scores={
            "category_risks": {"Factores propios de la actividad": "Medio"},
            "dimension_scores": {
                "Cargas cuantitativas": 5,
                "Carga mental": 7,
                "Características del liderazgo": 9,
            },
        },
    ))
    session.commit()

    suggestions_response = test_client.get(f"/api/action_plan/suggested?survey_session_id={survey_session.id}")
    assert suggestions_response.status_code == 200
    suggestion = suggestions_response.json()["suggestions"][0]
    assert [dimension["name"] for dimension in suggestion["impacted_dimensions"]] == [
        "Cargas cuantitativas",
        "Carga mental",
    ]

    create_response = test_client.post(f"/api/action_plan/tasks?survey_session_id={survey_session.id}", json={
        "category_flagged": suggestion["category_flagged"],
        "intervention_level": suggestion["intervention_level"],
        "description": suggestion["description"],
        "impacted_dimensions": suggestion["impacted_dimensions"],
        "status": "pending",
    })
    assert create_response.status_code == 201
    assert create_response.json()["impacted_dimensions"] == suggestion["impacted_dimensions"]

    stored_task = session.query(ActionPlan).one()
    assert stored_task.impacted_dimensions == suggestion["impacted_dimensions"]
    assert stored_task.survey_session_id == survey_session.id
