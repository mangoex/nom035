# backend/tests/test_senior_consultants.py
import pytest
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.main import app
from backend.app.db.session import Base, get_db
from backend.app.db.models import User, Company
from backend.app.core.auth import (
    get_current_superadmin,
    get_current_consultant,
    get_current_user,
    get_password_hash,
)
from sqlalchemy.pool import StaticPool

# In-memory SQLite DB for testing
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
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

@pytest.fixture(name="superadmin_client")
def superadmin_client_fixture(session):
    admin_user = User(
        id=1,
        name="Super Admin",
        email="admin@nom035.com",
        password_hash=get_password_hash("admin123"),
        role="superadmin",
        is_active=True,
    )
    session.add(admin_user)
    session.commit()

    def override_get_db():
        yield session

    def override_get_current_superadmin():
        return admin_user

    def override_get_current_user():
        return admin_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_superadmin] = override_get_current_superadmin
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture(name="senior_consultant_client")
def senior_consultant_client_fixture(session):
    senior_user = User(
        id=10,
        name="Senior Consultant",
        email="senior@consultores.com",
        password_hash=get_password_hash("pass123"),
        role="consultor",
        is_senior=True,
        creditos=1000,
        is_active=True,
    )
    session.add(senior_user)
    session.commit()

    def override_get_db():
        yield session

    def override_get_current_consultant():
        return senior_user

    def override_get_current_user():
        return senior_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_consultant] = override_get_current_consultant
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield TestClient(app), senior_user
    app.dependency_overrides.clear()

@pytest.fixture(name="standard_consultant_client")
def standard_consultant_client_fixture(session):
    std_user = User(
        id=20,
        name="Standard Consultant",
        email="standard@consultores.com",
        password_hash=get_password_hash("pass123"),
        role="consultor",
        is_senior=False,
        creditos=100,
        is_active=True,
    )
    session.add(std_user)
    session.commit()

    def override_get_db():
        yield session

    def override_get_current_consultant():
        return std_user

    def override_get_current_user():
        return std_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_consultant] = override_get_current_consultant
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield TestClient(app), std_user
    app.dependency_overrides.clear()

def test_superadmin_can_toggle_senior_status(superadmin_client, session):
    # 1. Create a consultant via superadmin
    consultant_payload = {
        "name": "Carlos Gomez",
        "email": "carlos@nom035.com",
        "password": "Password123!",
        "cedula_profesional": "12345678",
        "creditos": 500,
        "is_senior": False
    }
    create_res = superadmin_client.post("/api/superadmin/consultants", json=consultant_payload)
    assert create_res.status_code == 201
    created = create_res.json()
    consultant_id = created["id"]
    assert created["is_senior"] is False

    # 2. Toggle senior status to True
    toggle_res = superadmin_client.put(f"/api/superadmin/consultants/{consultant_id}/senior-status", json={"is_senior": True})
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_senior"] is True

    # Check DB
    db_user = session.query(User).filter(User.id == consultant_id).first()
    assert db_user.is_senior is True

    # 3. Toggle back to False
    toggle_res2 = superadmin_client.put(f"/api/superadmin/consultants/{consultant_id}/senior-status", json={"is_senior": False})
    assert toggle_res2.status_code == 200
    assert toggle_res2.json()["is_senior"] is False

def test_senior_consultant_can_create_sub_consultant_and_deduct_credits(senior_consultant_client, session):
    client, senior_user = senior_consultant_client
    initial_credits = senior_user.creditos # 1000

    sub_payload = {
        "name": "Junior Consultant",
        "email": "junior@consultores.com",
        "password": "JuniorPassword123!",
        "cedula_profesional": "87654321",
        "creditos": 200
    }
    res = client.post("/api/consultant/sub-consultants", json=sub_payload)
    assert res.status_code == 201
    sub_data = res.json()
    assert sub_data["name"] == "Junior Consultant"
    assert sub_data["email"] == "junior@consultores.com"
    assert sub_data["role"] == "consultor"
    assert sub_data["is_senior"] is False
    assert sub_data["parent_consultant_id"] == senior_user.id
    assert sub_data["creditos"] == 200

    # Verify Senior credits were deducted from pool
    session.refresh(senior_user)
    assert senior_user.creditos == initial_credits - 200

def test_senior_consultant_cannot_assign_more_credits_than_available(senior_consultant_client, session):
    client, senior_user = senior_consultant_client
    
    sub_payload = {
        "name": "Excessive Credits Consultant",
        "email": "excessive@consultores.com",
        "password": "JuniorPassword123!",
        "creditos": 5000 # More than 1000 available
    }
    res = client.post("/api/consultant/sub-consultants", json=sub_payload)
    assert res.status_code == 400
    assert "créditos" in res.json()["detail"].lower()

def test_non_senior_consultant_cannot_manage_sub_consultants(standard_consultant_client, session):
    client, std_user = standard_consultant_client

    # 1. Attempt to list sub-consultants
    list_res = client.get("/api/consultant/sub-consultants")
    assert list_res.status_code == 403

    # 2. Attempt to create sub-consultant
    sub_payload = {
        "name": "Forbidden Sub",
        "email": "forbidden@consultores.com",
        "password": "Password123!"
    }
    create_res = client.post("/api/consultant/sub-consultants", json=sub_payload)
    assert create_res.status_code == 403

def test_senior_consultant_crud_sub_consultants_isolation(session):
    # Setup two senior consultants
    sr1 = User(id=101, name="Sr 1", email="sr1@test.com", password_hash="h", role="consultor", is_senior=True, creditos=500)
    sr2 = User(id=102, name="Sr 2", email="sr2@test.com", password_hash="h", role="consultor", is_senior=True, creditos=500)
    sub1 = User(id=201, name="Sub 1", email="sub1@test.com", password_hash="h", role="consultor", is_senior=False, parent_consultant_id=101, creditos=50)
    sub2 = User(id=202, name="Sub 2", email="sub2@test.com", password_hash="h", role="consultor", is_senior=False, parent_consultant_id=102, creditos=50)
    session.add_all([sr1, sr2, sub1, sub2])
    session.commit()

    def override_get_db():
        yield session

    def override_get_current_consultant():
        return sr1

    def override_get_current_user():
        return sr1

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_consultant] = override_get_current_consultant
    app.dependency_overrides[get_current_user] = override_get_current_user

    client = TestClient(app)
    
    # Sr1 listing should only show sub1, not sub2
    list_res = client.get("/api/consultant/sub-consultants")
    assert list_res.status_code == 200
    subs = list_res.json()
    assert len(subs) == 1
    assert subs[0]["id"] == 201

    # Sr1 cannot edit sub2 (belongs to sr2)
    edit_res = client.put("/api/consultant/sub-consultants/202", json={"name": "Hacked Name"})
    assert edit_res.status_code == 404

    # Sr1 can edit sub1
    edit_res2 = client.put("/api/consultant/sub-consultants/201", json={"name": "Sub 1 Updated"})
    assert edit_res2.status_code == 200
    assert edit_res2.json()["name"] == "Sub 1 Updated"

    # Sr1 can delete sub1 (and remaining credits return to senior pool)
    del_res = client.delete("/api/consultant/sub-consultants/201")
    assert del_res.status_code == 200
    session.refresh(sr1)
    # Remaining 50 credits refunded to sr1: 500 + 50 = 550
    assert sr1.creditos == 550

    app.dependency_overrides.clear()
