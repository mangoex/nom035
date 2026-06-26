# backend/tests/test_surveys.py
import os
import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.app.main import app
from backend.app.db.session import Base, get_db
from backend.app.db.models import User, Company, SurveySession, SurveyResponse
from backend.app.core.auth import get_current_admin

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
    # Mock Company
    company = Company(
        id=1,
        name="Test Company",
        rfc="TST123456ABC",
        employee_count=30,
        sector="Tech",
        active_guide="GUIA_II"
    )
    session.add(company)
    session.commit()

    # Mock Admin User
    mock_admin = User(
        id=1,
        name="Test Admin",
        email="admin@test.com",
        password_hash="fakehash",
        role="company_admin",
        company_id=1
    )
    session.add(mock_admin)
    session.commit()

    def override_get_db():
        yield session

    def override_get_current_admin():
        return mock_admin

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_admin] = override_get_current_admin
    yield TestClient(app)
    del app.dependency_overrides[get_db]
    del app.dependency_overrides[get_current_admin]

def test_survey_session_creation_and_listing(client):
    # 1. Create a survey session for GUIA_II
    session_data = {
        "guide_type": "GUIA_II",
        "recopilador": "Juan Recopilador",
        "creador": "Marta Creadora",
        "cedula_creador": "12345678",
        "fecha_fin": str(date.today() + timedelta(days=15))
    }
    response = client.post("/api/survey/session", json=session_data)
    assert response.status_code == 200
    created = response.json()
    assert created["guide_type"] == "GUIA_II"
    assert created["recopilador"] == "Juan Recopilador"
    assert created["creador"] == "Marta Creadora"
    assert created["cedula_creador"] == "12345678"
    assert created["response_count"] == 0

    # 2. Get list of sessions without filters
    response = client.get("/api/survey/sessions")
    assert response.status_code == 200
    sessions_list = response.json()
    assert len(sessions_list) == 1
    assert sessions_list[0]["recopilador"] == "Juan Recopilador"

    # 3. Create a GUIA_I session without clave_secreta (should fail)
    bad_guia_i = {
        "guide_type": "GUIA_I",
        "recopilador": "Juan Recopilador",
        "creador": "Marta Creadora",
        "cedula_creador": "12345678",
        "fecha_fin": str(date.today() + timedelta(days=15))
    }
    response = client.post("/api/survey/session", json=bad_guia_i)
    assert response.status_code == 400
    assert "clave secreta" in response.json()["detail"].lower()

    # 4. Create a GUIA_I session with clave_secreta (should succeed)
    good_guia_i = {
        "guide_type": "GUIA_I",
        "recopilador": "Juan Recopilador",
        "creador": "Marta Creadora",
        "cedula_creador": "12345678",
        "fecha_fin": str(date.today() + timedelta(days=15)),
        "clave_secreta": "mysecretkey"
    }
    response = client.post("/api/survey/session", json=good_guia_i)
    assert response.status_code == 200
    created_guia_i = response.json()
    assert created_guia_i["guide_type"] == "GUIA_I"
    assert created_guia_i["clave_secreta"] == "mysecretkey"

    # 5. List with date filters
    # Today filter (should return both using the UTC date of the created session)
    session_date_str = created_guia_i["created_at"].split("T")[0]
    response = client.get(f"/api/survey/sessions?start_date={session_date_str}&end_date={session_date_str}")
    assert response.status_code == 200
    assert len(response.json()) == 2

    # Query with a date in the past (should return zero)
    # Parse the date and subtract 1 day
    from datetime import datetime
    session_date = datetime.strptime(session_date_str, "%Y-%m-%d")
    past_date_str = str((session_date - timedelta(days=2)).date())
    response = client.get(f"/api/survey/sessions?start_date={past_date_str}&end_date={past_date_str}")
    assert len(response.json()) == 0

def test_survey_public_authentication_and_submit(client, session):
    # Setup a GUIA_I session with a secret key in DB
    survey_sess = SurveySession(
        company_id=1,
        guide_type="GUIA_I",
        link_hash="traumahash",
        is_active=True,
        recopilador="Juan",
        creador="Marta",
        cedula_creador="12345678",
        fecha_fin=date.today() + timedelta(days=15),
        clave_secreta="topsecret"
    )
    session.add(survey_sess)
    session.commit()

    # 1. Fetch public details - should succeed directly without requiring password
    response = client.get("/api/survey/public/traumahash")
    assert response.status_code == 200
    data = response.json()
    assert data["requires_clave"] is False
    assert data["company_name"] == "Test Company"
    assert data["guide_type"] == "GUIA_I"

    # 2. Submit survey response - should succeed directly
    response_payload = {
        "demographics": {
            "age_range": "26-35",
            "gender": "Masculino",
            "department": "Operaciones",
            "position": "Operativo"
        },
        "answers": {f"q{i}": "No" for i in range(1, 21)}
    }
    response = client.post("/api/survey/public/traumahash", json=response_payload)
    assert response.status_code == 201
    assert response.json()["message"] == "Encuesta registrada con éxito."

    # Verify response was saved and response_count of session is now 1
    session.refresh(survey_sess)
    assert survey_sess.response_count == 1

    # 3. Global stats query should NOT return results from this protected session
    response = client.get("/api/survey/stats")
    assert response.status_code == 200
    assert response.json()["total_responses"] == 0

    # 4. Global responses query should NOT return results from this protected session
    response = client.get("/api/survey/responses")
    assert response.status_code == 200
    assert len(response.json()["responses"]) == 0

    # 5. Session-specific stats query without clave or with WRONG clave should be 403 Forbidden
    response = client.get(f"/api/survey/stats?survey_session_id={survey_sess.id}")
    assert response.status_code == 403
    response = client.get(f"/api/survey/stats?survey_session_id={survey_sess.id}&clave=wrong")
    assert response.status_code == 403

    # 6. Session-specific stats query with CORRECT clave should be 200 OK
    response = client.get(f"/api/survey/stats?survey_session_id={survey_sess.id}&clave=topsecret")
    assert response.status_code == 200
    assert response.json()["total_responses"] == 1

    # 7. Session-specific responses query without clave or with WRONG clave should be 403 Forbidden
    response = client.get(f"/api/survey/responses?survey_session_id={survey_sess.id}")
    assert response.status_code == 403
    response = client.get(f"/api/survey/responses?survey_session_id={survey_sess.id}&clave=wrong")
    assert response.status_code == 403

    # 8. Session-specific responses query with CORRECT clave should be 200 OK
    response = client.get(f"/api/survey/responses?survey_session_id={survey_sess.id}&clave=topsecret")
    assert response.status_code == 200
    assert len(response.json()["responses"]) == 1

def test_get_uploads_dir(monkeypatch):
    from backend.app.db.session import get_uploads_dir
    
    # 1. Environment variable override
    monkeypatch.setenv("UPLOADS_DIR", "/tmp/custom_uploads")
    assert get_uploads_dir() == "/tmp/custom_uploads"
    monkeypatch.delenv("UPLOADS_DIR", raising=False)

    # 2. SQLite Database URL inside a container path (like /app/data)
    monkeypatch.setenv("DATABASE_URL", "sqlite:////app/data/nom035.db")
    monkeypatch.setattr("os.access", lambda path, mode: True)
    
    # Under test execution, get_uploads_dir should resolve database URL path
    # and put uploads inside the persistent /app/data/uploads folder.
    assert get_uploads_dir() == "/app/data/uploads"

