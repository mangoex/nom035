# backend/tests/test_superadmin.py
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.main import app
from backend.app.db.session import Base, get_db
from backend.app.db.models import User, Company
from backend.app.core.auth import get_current_superadmin

from sqlalchemy.pool import StaticPool

# Use an in-memory SQLite database for testing with StaticPool to share connection
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
    # Mock Superadmin User
    mock_superadmin = User(
        id=999,
        name="Mock Superadmin",
        email="superadmin@test.com",
        password_hash="fakehash",
        role="superadmin",
        company_id=None
    )
    session.add(mock_superadmin)
    session.commit()

    def override_get_db():
        yield session

    def override_get_current_superadmin():
        return mock_superadmin

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_superadmin] = override_get_current_superadmin
    yield TestClient(app)
    del app.dependency_overrides[get_db]
    del app.dependency_overrides[get_current_superadmin]

def test_company_management_flow(client):
    # 1. Create a company
    company_data = {
        "name": "Super Company",
        "rfc": "SUP123456XYZ",
        "employee_count": 25,
        "sector": "Retail"
    }
    response = client.post("/api/superadmin/companies", json=company_data)
    assert response.status_code == 201
    created_company = response.json()
    assert created_company["name"] == "Super Company"
    assert created_company["active_guide"] == "GUIA_II" # 25 employees <= 50

    # 2. Get list of companies
    response = client.get("/api/superadmin/companies")
    assert response.status_code == 200
    companies_list = response.json()
    assert len(companies_list) == 1
    assert companies_list[0]["name"] == "Super Company"

    # 3. Update company (change employee count to 60 -> should update active_guide to GUIA_III)
    update_data = {
        "name": "Super Company Group",
        "employee_count": 60
    }
    response = client.put(f"/api/superadmin/companies/{created_company['id']}", json=update_data)
    assert response.status_code == 200
    updated_company = response.json()
    assert updated_company["name"] == "Super Company Group"
    assert updated_company["employee_count"] == 60
    assert updated_company["active_guide"] == "GUIA_III"

    # 4. Delete company
    response = client.delete(f"/api/superadmin/companies/{created_company['id']}")
    assert response.status_code == 200
    assert response.json()["message"] == "Empresa eliminada exitosamente."

    # Check company is gone
    response = client.get("/api/superadmin/companies")
    assert len(response.json()) == 0

def test_consultant_management_flow(client):
    # 1. Create a consultant
    consultant_data = {
        "name": "Lic. Juan Pérez",
        "email": "juan.perez@consultora.com",
        "password": "consultantpwd",
        "cedula_profesional": "12345678",
        "creditos": 100
    }
    response = client.post("/api/superadmin/consultants", json=consultant_data)
    assert response.status_code == 201
    created_consultant = response.json()
    assert created_consultant["name"] == "Lic. Juan Pérez"
    assert created_consultant["role"] == "consultor"
    assert created_consultant["cedula_profesional"] == "12345678"
    assert created_consultant["creditos"] == 100

    # 2. Get list of consultants
    response = client.get("/api/superadmin/consultants")
    assert response.status_code == 200
    consultants_list = response.json()
    assert len(consultants_list) == 1
    assert consultants_list[0]["name"] == "Lic. Juan Pérez"
    assert consultants_list[0]["role"] == "consultor"

    # 3. Update consultant credits and professional license
    update_data = {
        "name": "Mtro. Juan Pérez",
        "cedula_profesional": "87654321",
        "creditos": 150
    }
    response = client.put(f"/api/superadmin/consultants/{created_consultant['id']}", json=update_data)
    assert response.status_code == 200
    updated_consultant = response.json()
    assert updated_consultant["name"] == "Mtro. Juan Pérez"
    assert updated_consultant["cedula_profesional"] == "87654321"
    assert updated_consultant["creditos"] == 150
    assert updated_consultant["is_active"] is True

    # 4. Deactivate consultant access
    response = client.put(
        f"/api/superadmin/consultants/{created_consultant['id']}",
        json={"is_active": False}
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False

    # 5. Update consultant billing
    billing_data = {
        "billing_paid": True,
        "billing_due_date": "2026-08-31",
        "billing_amount": 2500,
        "billing_history": [
            {"date": "2026-07-01", "amount": 2500, "note": "Pago mensual"}
        ]
    }
    response = client.put(
        f"/api/superadmin/consultants/{created_consultant['id']}/billing",
        json=billing_data
    )
    assert response.status_code == 200
    billing_consultant = response.json()
    assert billing_consultant["billing_paid"] is True
    assert billing_consultant["billing_due_date"] == "2026-08-31"
    assert billing_consultant["billing_amount"] == 2500
    assert billing_consultant["billing_history"][0]["amount"] == 2500

    # 6. Delete consultant
    response = client.delete(f"/api/superadmin/consultants/{created_consultant['id']}")
    assert response.status_code == 200
    assert response.json()["message"] == "Consultor eliminado exitosamente."

    # Check consultant is gone
    response = client.get("/api/superadmin/consultants")
    assert len(response.json()) == 0
