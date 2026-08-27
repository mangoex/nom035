from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from backend.app.db.models import ActionPlan, Company, User
from backend.app.main import app, run_schema_migrations
from backend.app.core.auth import get_current_superadmin
from backend.app.db.session import get_db


def _create_legacy_schema(engine):
    """Create the release schema immediately before senior consultants."""
    statements = (
        "CREATE TABLE companies ("
        "id INTEGER PRIMARY KEY, name VARCHAR NOT NULL, rfc VARCHAR NOT NULL, "
        "employee_count INTEGER, sector VARCHAR, address VARCHAR, phone VARCHAR, "
        "main_activity VARCHAR, active_guide VARCHAR NOT NULL, logo_url VARCHAR, "
        "policy_text VARCHAR, policy_pdf_url VARCHAR, departments JSON, "
        "consultant_id INTEGER, created_at DATETIME)",
        "CREATE TABLE users ("
        "id INTEGER PRIMARY KEY, company_id INTEGER, role VARCHAR NOT NULL, "
        "name VARCHAR NOT NULL, email VARCHAR NOT NULL UNIQUE, password_hash VARCHAR NOT NULL, "
        "cedula_profesional VARCHAR, cedula_image_url VARCHAR, creditos INTEGER, "
        "logo_url VARCHAR, capacitaciones JSON, is_active BOOLEAN NOT NULL DEFAULT 1, "
        "billing_paid BOOLEAN NOT NULL DEFAULT 0, billing_due_date DATE, "
        "billing_amount INTEGER, billing_history JSON, created_at DATETIME)",
        "CREATE TABLE survey_sessions ("
        "id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL, guide_type VARCHAR NOT NULL, "
        "link_hash VARCHAR NOT NULL, is_active BOOLEAN, recopilador VARCHAR, creador VARCHAR, "
        "cedula_creador VARCHAR, fecha_fin DATE, clave_secreta VARCHAR, created_at DATETIME)",
        "CREATE TABLE survey_responses ("
        "id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL, survey_session_id INTEGER, "
        "demographics JSON NOT NULL, answers JSON NOT NULL, calculated_scores JSON NOT NULL, created_at DATETIME)",
        "CREATE TABLE action_plans ("
        "id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL, category_flagged VARCHAR, "
        "domain_flagged VARCHAR, intervention_level VARCHAR NOT NULL, status VARCHAR, "
        "description VARCHAR NOT NULL, due_date DATE, created_at DATETIME)",
    )
    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))
        connection.execute(text(
            "INSERT INTO users (id, role, name, email, password_hash, is_active, created_at) "
            "VALUES (1, 'consultor', 'Consultor existente', 'consultor@example.com', 'hash', 1, CURRENT_TIMESTAMP)"
        ))
        connection.execute(text(
            "INSERT INTO companies (id, name, rfc, employee_count, active_guide, consultant_id, created_at) "
            "VALUES (1, 'Empresa existente', 'AAA010101AAA', 10, 'GUIA_II', 1, CURRENT_TIMESTAMP)"
        ))
        connection.execute(text(
            "INSERT INTO action_plans (id, company_id, intervention_level, status, description, created_at) "
            "VALUES (1, 1, 'first_level', 'pending', 'Plan histórico', CURRENT_TIMESTAMP)"
        ))


def test_migrates_legacy_sqlite_before_loading_companies_and_consultants():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    _create_legacy_schema(engine)

    # Regression: this database predates is_senior and parent_consultant_id.
    assert not {"is_senior", "parent_consultant_id"} <= {
        column["name"] for column in inspect(engine).get_columns("users")
    }

    run_schema_migrations(engine)
    run_schema_migrations(engine)  # Startup migrations must be idempotent.

    user_columns = {column["name"] for column in inspect(engine).get_columns("users")}
    user_indexes = {index["name"] for index in inspect(engine).get_indexes("users")}
    action_plan_columns = {column["name"] for column in inspect(engine).get_columns("action_plans")}
    action_plan_indexes = {index["name"] for index in inspect(engine).get_indexes("action_plans")}
    survey_session_columns = {column["name"] for column in inspect(engine).get_columns("survey_sessions")}
    assert {"is_senior", "parent_consultant_id"} <= user_columns
    assert "impacted_dimensions" in action_plan_columns
    assert "survey_session_id" in action_plan_columns
    assert "ix_action_plans_survey_session_id" in action_plan_indexes
    assert {"action_plan_pin_hash", "action_plan_pin_version"} <= survey_session_columns
    assert "ix_users_parent_consultant_id" in user_indexes

    session = sessionmaker(bind=engine)()
    try:
        # These mapped reads are the SQL issued by the production list endpoints.
        assert session.query(Company).one().name == "Empresa existente"
        consultant = session.query(User).filter(User.role == "consultor").one()
        assert consultant.name == "Consultor existente"
        assert consultant.is_senior is False
        assert consultant.parent_consultant_id is None
        legacy_plan = session.query(ActionPlan).one()
        assert legacy_plan.description == "Plan histórico"
        assert legacy_plan.survey_session_id is None

        superadmin = User(
            name="Administrador",
            email="admin@example.com",
            password_hash="hash",
            role="superadmin",
        )
        session.add(superadmin)
        session.commit()

        def override_get_db():
            yield session

        def override_get_current_superadmin():
            return superadmin

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_superadmin] = override_get_current_superadmin
        try:
            client = TestClient(app)
            companies_response = client.get("/api/superadmin/companies")
            consultants_response = client.get("/api/superadmin/consultants")
            assert companies_response.status_code == 200
            assert consultants_response.status_code == 200
            assert companies_response.json()[0]["name"] == "Empresa existente"
            assert consultants_response.json()[0]["name"] == "Consultor existente"
        finally:
            app.dependency_overrides.clear()
    finally:
        session.close()
