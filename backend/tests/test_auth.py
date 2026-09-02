# backend/tests/test_auth.py
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.main import app
from backend.app.db.session import Base, get_db
from backend.app.db.models import User, Company  # Ensure models are loaded to register tables

# Use a temporary file-based SQLite database for testing to avoid connection isolation issues
DB_FILE = "./test_temp.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_FILE}"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
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
        # Clean up database file
        if os.path.exists(DB_FILE):
            try:
                os.remove(DB_FILE)
            except Exception:
                pass

@pytest.fixture(name="client")
def client_fixture(session):
    def override_get_db():
        try:
            yield session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    del app.dependency_overrides[get_db]

def test_register_and_login_flow(client):
    # Register a new user
    register_data = {
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "securepassword",
        "company_name": "Test Company",
        "employee_count": 10,
        "rfc": "TES123456ABC",
        "sector": "Tecnologia"
    }
    
    response = client.post("/api/auth/register", json=register_data)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "testuser@example.com"
    assert "id" in data
    
    # Assert that the HTTP-Only cookie was set correctly
    assert "access_token" in response.cookies
    
    # Try to login
    login_data = {
        "email": "testuser@example.com",
        "password": "securepassword"
    }
    response_login = client.post("/api/auth/login", json=login_data)
    assert response_login.status_code == 200
    data_login = response_login.json()
    assert data_login["user"]["email"] == "testuser@example.com"
    assert "access_token" in response_login.cookies

def test_forgot_password_flow(client, session):
    # 1. Register a user
    register_data = {
        "name": "Recovery User",
        "email": "recovery@example.com",
        "password": "old_password_123",
        "company_name": "Recovery Corp",
        "employee_count": 25,
        "rfc": "REC123456XYZ",
        "sector": "Servicios"
    }
    reg_res = client.post("/api/auth/register", json=register_data)
    assert reg_res.status_code == 201
    
    # 2. Request forgot-password
    forgot_res = client.post("/api/auth/forgot-password", json={"email": "recovery@example.com"})
    assert forgot_res.status_code == 200
    assert "message" in forgot_res.json()

    # 3. Verify old password no longer works
    login_old = client.post("/api/auth/login", json={
        "email": "recovery@example.com",
        "password": "old_password_123"
    })
    assert login_old.status_code == 400

    # 4. Request forgot-password for non-existent user (should succeed gracefully without error)
    non_existent_res = client.post("/api/auth/forgot-password", json={"email": "notfound@example.com"})
    assert non_existent_res.status_code == 200

    # 5. Request with invalid email format returns 422
    invalid_email_res = client.post("/api/auth/forgot-password", json={"email": "not-an-email"})
    assert invalid_email_res.status_code == 422

