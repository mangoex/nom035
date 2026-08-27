from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.api.endpoints.action_plan import get_action_plan_user
from backend.app.api.endpoints.consultant import get_current_consultant
from backend.app.core.auth import get_current_admin
from backend.app.db.models import ActionPlan, Company, SurveyResponse, SurveySession, User
from backend.app.db.session import Base, get_db
from backend.app.main import app


engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def data():
    Base.metadata.create_all(bind=engine)
    db = TestingSession()
    consultant = User(name="Consultor", email="consultor-pin@example.com", password_hash="hash", role="consultor")
    other_consultant = User(name="Ajeno", email="ajeno-pin@example.com", password_hash="hash", role="consultor")
    db.add_all([consultant, other_consultant]); db.flush()
    company = Company(name="Empresa PIN", rfc="PIN010101AAA", employee_count=10, active_guide="GUIA_II", consultant_id=consultant.id)
    db.add(company); db.flush()
    admin = User(name="Empresa", email="empresa-pin@example.com", password_hash="hash", role="company_admin", company_id=company.id)
    session = SurveySession(company_id=company.id, guide_type="GUIA_II", link_hash="pin-session", consultant_access_enabled=True)
    db.add_all([admin, session]); db.flush()
    db.add(SurveyResponse(company_id=company.id, survey_session_id=session.id, demographics={}, answers={}, calculated_scores={}))
    db.commit()
    try:
        yield db, consultant, other_consultant, company, admin, session
    finally:
        db.close(); Base.metadata.drop_all(bind=engine)


def test_company_needs_valid_pin_and_session_scoped_access(data):
    db, consultant, _, company, admin, survey_session = data
    def override_db(): yield db
    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_action_plan_user] = lambda: consultant
    app.dependency_overrides[get_current_consultant] = lambda: consultant
    try:
        consultant_client = TestClient(app)
        generated = consultant_client.post(f"/api/consultant/survey-sessions/{survey_session.id}/action-plan-pin")
        assert generated.status_code == 200
        pin = generated.json()["pin"]
        assert pin.isdigit() and len(pin) == 4
        assert "pin_hash" not in generated.json()
        assert generated.headers["cache-control"] == "no-store"

        app.dependency_overrides[get_action_plan_user] = lambda: admin
        company_client = TestClient(app)
        denied = company_client.get(f"/api/action_plan/tasks?survey_session_id={survey_session.id}")
        assert denied.status_code == 403
        missing_session = company_client.get("/api/action_plan/tasks")
        assert missing_session.status_code == 400
        wrong = company_client.post(f"/api/action_plan/access/verify", json={"survey_session_id": survey_session.id, "pin": "0000"})
        assert wrong.status_code == 403
        accepted = company_client.post(f"/api/action_plan/access/verify", json={"survey_session_id": survey_session.id, "pin": pin})
        assert accepted.status_code == 204
        created = company_client.post(f"/api/action_plan/tasks?survey_session_id={survey_session.id}", json={"intervention_level": "first_level", "description": "Tarea protegida"})
        assert created.status_code == 201
        assert created.json()["survey_session_id"] == survey_session.id
    finally:
        app.dependency_overrides.clear()


def test_company_results_are_available_without_an_action_plan_pin_grant(data):
    """Survey reporting stays independent from the PIN-protected action plan."""
    db, _, _, _, admin, survey_session = data

    def override_db():
        yield db

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_admin] = lambda: admin
    app.dependency_overrides[get_action_plan_user] = lambda: admin
    try:
        company_client = TestClient(app)

        assert company_client.get(
            f"/api/survey/stats?survey_session_id={survey_session.id}"
        ).status_code == 200
        assert company_client.get(
            f"/api/survey/responses?survey_session_id={survey_session.id}"
        ).status_code == 200
        # The same company still cannot read the scoped plan before PIN verification.
        assert company_client.get(
            f"/api/action_plan/tasks?survey_session_id={survey_session.id}"
        ).status_code == 403
    finally:
        app.dependency_overrides.clear()


def test_pin_lockout_and_regeneration_revoke_existing_access(data):
    db, consultant, _, _, admin, survey_session = data
    def override_db(): yield db
    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_consultant] = lambda: consultant
    app.dependency_overrides[get_action_plan_user] = lambda: consultant
    try:
        consultant_client = TestClient(app)
        first = consultant_client.post(f"/api/consultant/survey-sessions/{survey_session.id}/action-plan-pin").json()["pin"]
        wrong_pin = "9999" if first != "9999" else "0000"
        app.dependency_overrides[get_action_plan_user] = lambda: admin
        company_client = TestClient(app)
        for _ in range(5):
            assert company_client.post("/api/action_plan/access/verify", json={"survey_session_id": survey_session.id, "pin": wrong_pin}).status_code == 403
        locked = company_client.post("/api/action_plan/access/verify", json={"survey_session_id": survey_session.id, "pin": first})
        assert locked.status_code == 429
        assert int(locked.headers["retry-after"]) > 0
        survey_session.action_plan_pin_locked_until = None
        db.commit()
        assert company_client.post("/api/action_plan/access/verify", json={"survey_session_id": survey_session.id, "pin": first}).status_code == 204
        assert company_client.get(f"/api/action_plan/tasks?survey_session_id={survey_session.id}").status_code == 200
        app.dependency_overrides[get_current_consultant] = lambda: consultant
        consultant_client.post(f"/api/consultant/survey-sessions/{survey_session.id}/action-plan-pin")
        assert company_client.get(f"/api/action_plan/tasks?survey_session_id={survey_session.id}").status_code == 403
    finally:
        app.dependency_overrides.clear()


def test_pin_grant_and_tasks_cannot_cross_sessions_or_users(data):
    db, consultant, _, company, admin, first_session = data
    second_session = SurveySession(
        company_id=company.id,
        guide_type="GUIA_II",
        link_hash="pin-session-two",
        consultant_access_enabled=True,
    )
    second_admin = User(
        name="Empresa 2",
        email="empresa-pin-2@example.com",
        password_hash="hash",
        role="company_admin",
        company_id=company.id,
    )
    db.add_all([second_session, second_admin]); db.flush()
    db.add(SurveyResponse(
        company_id=company.id,
        survey_session_id=second_session.id,
        demographics={}, answers={}, calculated_scores={},
    ))
    db.commit()

    def override_db(): yield db
    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_consultant] = lambda: consultant
    app.dependency_overrides[get_action_plan_user] = lambda: consultant
    try:
        consultant_client = TestClient(app)
        first_pin = consultant_client.post(
            f"/api/consultant/survey-sessions/{first_session.id}/action-plan-pin"
        ).json()["pin"]
        second_pin = consultant_client.post(
            f"/api/consultant/survey-sessions/{second_session.id}/action-plan-pin"
        ).json()["pin"]

        app.dependency_overrides[get_action_plan_user] = lambda: admin
        company_client = TestClient(app)
        assert company_client.post("/api/action_plan/access/verify", json={
            "survey_session_id": first_session.id, "pin": first_pin,
        }).status_code == 204
        created = company_client.post(
            f"/api/action_plan/tasks?survey_session_id={first_session.id}",
            json={"intervention_level": "first_level", "description": "Sólo sesión uno"},
        )
        assert created.status_code == 201
        assert company_client.get(
            f"/api/action_plan/tasks?survey_session_id={second_session.id}"
        ).status_code == 403

        app.dependency_overrides[get_action_plan_user] = lambda: second_admin
        assert company_client.get(
            f"/api/action_plan/tasks?survey_session_id={first_session.id}"
        ).status_code == 403

        app.dependency_overrides[get_action_plan_user] = lambda: admin
        assert company_client.post("/api/action_plan/access/verify", json={
            "survey_session_id": second_session.id, "pin": second_pin,
        }).status_code == 204
        assert company_client.get(
            f"/api/action_plan/tasks?survey_session_id={second_session.id}"
        ).json() == []
        assert db.query(ActionPlan).filter_by(survey_session_id=first_session.id).count() == 1
        assert db.query(ActionPlan).filter_by(survey_session_id=second_session.id).count() == 0
    finally:
        app.dependency_overrides.clear()


def test_privileged_roles_still_enforce_consultant_ownership(data):
    db, consultant, other_consultant, _, _, survey_session = data
    superadmin = User(
        name="General", email="general-pin@example.com", password_hash="hash", role="superadmin"
    )
    db.add(superadmin); db.commit()

    def override_db(): yield db
    app.dependency_overrides[get_db] = override_db
    try:
        client = TestClient(app)
        app.dependency_overrides[get_action_plan_user] = lambda: consultant
        assert client.get(
            f"/api/action_plan/tasks?survey_session_id={survey_session.id}"
        ).status_code == 200
        app.dependency_overrides[get_action_plan_user] = lambda: other_consultant
        assert client.get(
            f"/api/action_plan/tasks?survey_session_id={survey_session.id}"
        ).status_code == 403
        app.dependency_overrides[get_action_plan_user] = lambda: superadmin
        assert client.get(
            f"/api/action_plan/tasks?survey_session_id={survey_session.id}"
        ).status_code == 200
    finally:
        app.dependency_overrides.clear()


def test_consultant_cannot_generate_pin_for_foreign_company(data):
    db, consultant, other_consultant, company, _, survey_session = data
    unauthorized_session = SurveySession(
        company_id=company.id,
        guide_type="GUIA_II",
        link_hash="pin-session-not-authorized",
        consultant_access_enabled=False,
    )
    db.add(unauthorized_session); db.flush()
    db.add(SurveyResponse(
        company_id=company.id,
        survey_session_id=unauthorized_session.id,
        demographics={}, answers={}, calculated_scores={},
    ))
    db.commit()
    def override_db(): yield db
    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_consultant] = lambda: other_consultant
    try:
        client = TestClient(app)
        response = client.post(f"/api/consultant/survey-sessions/{survey_session.id}/action-plan-pin")
        assert response.status_code == 404
        app.dependency_overrides[get_current_consultant] = lambda: consultant
        unauthorized = client.post(
            f"/api/consultant/survey-sessions/{unauthorized_session.id}/action-plan-pin"
        )
        assert unauthorized.status_code == 404
    finally:
        app.dependency_overrides.clear()
