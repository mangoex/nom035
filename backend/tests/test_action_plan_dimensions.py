from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.api.endpoints.action_plan import build_impacted_dimensions
from backend.app.core.auth import get_current_admin
from backend.app.db.models import ActionPlan, Company, SurveyResponse, User
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
    session.commit()

    def override_get_db():
        yield session

    def override_get_current_admin():
        return admin

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_admin] = override_get_current_admin
    try:
        yield TestClient(app), company
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
    test_client, company = client
    session.add(SurveyResponse(
        company_id=company.id,
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

    suggestions_response = test_client.get("/api/action_plan/suggested")
    assert suggestions_response.status_code == 200
    suggestion = suggestions_response.json()["suggestions"][0]
    assert [dimension["name"] for dimension in suggestion["impacted_dimensions"]] == [
        "Cargas cuantitativas",
        "Carga mental",
    ]

    create_response = test_client.post("/api/action_plan/tasks", json={
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
