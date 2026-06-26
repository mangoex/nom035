# backend/tests/test_consultant.py
import os
import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.main import app
from backend.app.db.session import Base, get_db
from backend.app.db.models import User, Company, SurveySession, SurveyResponse
from backend.app.core.auth import get_current_consultant

from sqlalchemy.pool import StaticPool

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine
)

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
    # Mock Consultant User
    mock_consultant = User(
        id=555,
        name="Mock Consultant",
        email="miguelgespino@hotmail.com",
        password_hash="fakehash",
        role="consultor",
        cedula_profesional="123456",
        creditos=50,
        company_id=None
    )
    session.add(mock_consultant)
    session.commit()

    def override_get_db():
        yield session

    def override_get_current_consultant():
        return mock_consultant

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_consultant] = override_get_current_consultant
    yield TestClient(app)
    del app.dependency_overrides[get_db]
    del app.dependency_overrides[get_current_consultant]

def test_consultant_flows(client, session):
    # 1. Fetch initial statistics
    response = client.get("/api/consultant/stats")
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_companies"] == 0
    assert stats["creditos_totales"] == 50
    assert stats["creditos_disponibles"] == 50

    # 2. Register a new company under this consultant
    company_data = {
        "name": "Consultant Client S.A.",
        "rfc": "CON123456ABC",
        "employee_count": 30,
        "sector": "Logistics"
    }
    response = client.post("/api/consultant/companies", json=company_data)
    assert response.status_code == 201
    created_company = response.json()
    assert created_company["name"] == "Consultant Client S.A."
    assert created_company["consultant_id"] == 555
    assert created_company["active_guide"] == "GUIA_II"

    # 3. Get consultant's companies list
    response = client.get("/api/consultant/companies")
    assert response.status_code == 200
    companies_list = response.json()
    assert len(companies_list) == 1
    assert companies_list[0]["name"] == "Consultant Client S.A."

    # 4. Fetch updated stats (should show total_companies=1, total_missing=30)
    response = client.get("/api/consultant/stats")
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_companies"] == 1
    assert stats["total_missing"] == 30

    # 5. Add a survey response to verify credit consumption
    survey_sess = SurveySession(
        company_id=created_company["id"],
        guide_type="GUIA_II",
        link_hash="clienthash",
        is_active=True,
    )
    session.add(survey_sess)
    session.commit()

    response_model = SurveyResponse(
        company_id=created_company["id"],
        survey_session_id=survey_sess.id,
        demographics={"age_range": "26-35", "gender": "Femenino", "department": "Ventas", "position": "Operativo"},
        answers={f"q{i}": "Siempre" for i in range(1, 47)},
        calculated_scores={}
    )
    session.add(response_model)
    session.commit()

    # Fetch stats again - creditos_disponibles should decrease by 1
    response = client.get("/api/consultant/stats")
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_responses"] == 1
    assert stats["total_missing"] == 29
    assert stats["creditos_disponibles"] == 49

    # 6. Update company
    update_data = {
        "name": "Consultant Client Updated",
        "employee_count": 40
    }
    response = client.put(f"/api/consultant/companies/{created_company['id']}", json=update_data)
    assert response.status_code == 200
    assert response.json()["name"] == "Consultant Client Updated"
    assert response.json()["employee_count"] == 40

    # 7. Delete company
    response = client.delete(f"/api/consultant/companies/{created_company['id']}")
    assert response.status_code == 200
    
    # Check stats again
    response = client.get("/api/consultant/stats")
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_companies"] == 0
