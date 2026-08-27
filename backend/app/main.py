# backend/app/main.py
import os
import traceback
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.db.session import engine, Base
from backend.app.api.endpoints import auth, company, survey, action_plan, superadmin, consultant

from sqlalchemy import inspect, text


# Additive schema changes for databases created by earlier releases.  These are
# deliberately checked before executing DDL: PostgreSQL marks a transaction as
# failed after a duplicate-column error, so catching that error would prevent
# every migration that follows from running.
SCHEMA_COLUMNS = {
    "action_plans": {
        "assigned_to": "VARCHAR",
        "impacted_dimensions": "JSON",
    },
    "companies": {
        "logo_url": "VARCHAR",
        "policy_text": "VARCHAR",
        "policy_pdf_url": "VARCHAR",
        "consultant_id": "INTEGER",
        "address": "VARCHAR",
        "phone": "VARCHAR",
        "main_activity": "VARCHAR",
        "departments": "JSON",
    },
    "users": {
        "cedula_profesional": "VARCHAR",
        "creditos": "INTEGER DEFAULT 0",
        "logo_url": "VARCHAR",
        "cedula_image_url": "VARCHAR",
        "is_active": "BOOLEAN DEFAULT TRUE NOT NULL",
        "is_senior": "BOOLEAN DEFAULT FALSE NOT NULL",
        "parent_consultant_id": "INTEGER",
        "billing_paid": "BOOLEAN DEFAULT FALSE NOT NULL",
        "billing_due_date": "DATE",
        "billing_amount": "INTEGER DEFAULT 0",
        "billing_history": "JSON",
        "capacitaciones": "JSON",
    },
    "survey_sessions": {
        "recopilador": "VARCHAR",
        "creador": "VARCHAR",
        "cedula_creador": "VARCHAR",
        "fecha_fin": "DATE",
        "clave_secreta": "VARCHAR",
        "consultant_access_enabled": "BOOLEAN DEFAULT FALSE NOT NULL",
    },
}

SCHEMA_INDEXES = {
    "companies": {"ix_companies_consultant_id": "consultant_id"},
    "users": {
        "ix_users_company_id": "company_id",
        "ix_users_parent_consultant_id": "parent_consultant_id",
    },
    "survey_sessions": {"ix_survey_sessions_company_id": "company_id"},
    "survey_responses": {
        "ix_survey_responses_company_id": "company_id",
        "ix_survey_responses_survey_session_id": "survey_session_id",
    },
    "action_plans": {"ix_action_plans_company_id": "company_id"},
}


def run_schema_migrations(database_engine):
    """Apply outstanding additive migrations atomically on SQLite or PostgreSQL."""
    with database_engine.begin() as conn:
        inspector = inspect(conn)
        for table, columns in SCHEMA_COLUMNS.items():
            existing_columns = {column["name"] for column in inspector.get_columns(table)}
            for column, definition in columns.items():
                if column not in existing_columns:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {definition}"))
                    existing_columns.add(column)

        # Refresh inspection after ALTER TABLE statements before creating indexes.
        inspector = inspect(conn)
        for table, indexes in SCHEMA_INDEXES.items():
            existing_indexes = {index["name"] for index in inspector.get_indexes(table)}
            columns = {column["name"] for column in inspector.get_columns(table)}
            for index, column in indexes.items():
                if index not in existing_indexes and column in columns:
                    conn.execute(text(f"CREATE INDEX {index} ON {table} ({column})"))

# Bootstrap database tables
Base.metadata.create_all(bind=engine)

# Auto-migrate production database before any ORM query loads the new fields.
run_schema_migrations(engine)

# Auto-create superadmin if none exists
try:
    from backend.app.db.session import SessionLocal
    from backend.app.db.models import User
    from backend.app.core.auth import get_password_hash
    
    db = SessionLocal()
    superadmin_user = db.query(User).filter(User.role == "superadmin").first()
    if not superadmin_user:
        hashed_password = get_password_hash("admin123")
        admin_user = User(
            name="Administrador del Sistema",
            email="admin@nom035.com",
            password_hash=hashed_password,
            role="superadmin",
            company_id=None
        )
        db.add(admin_user)
        db.commit()
        print("Default superadmin user initialized: admin@nom035.com / admin123")
    db.close()
except Exception as e:
    print("Failed to auto-create default superadmin:", e)

app = FastAPI(
    title="Sistema de Gestión NOM-035 API",
    description="Backend en Python para el procesamiento psicométrico y cumplimiento de la NOM-035-STPS-2018",
    version="1.0.0"
)



# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(company.router, prefix="/api/company", tags=["Company"])
app.include_router(survey.router, prefix="/api/survey", tags=["Survey"])
app.include_router(action_plan.router, prefix="/api/action_plan", tags=["Action Plan"])
app.include_router(superadmin.router, prefix="/api/superadmin", tags=["Superadmin"])
app.include_router(consultant.router, prefix="/api/consultant", tags=["Consultant"])

backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # points to backend
from backend.app.db.session import get_uploads_dir
uploads_dir = get_uploads_dir()
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

frontend_dist = os.path.join(backend_root, "frontend", "dist")

if os.path.exists(frontend_dist):
    # Mount assets folder
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
        
    # Catch-all for SPA
    @app.get("/{catchall:path}")
    def serve_spa(catchall: str):
        if catchall.startswith("api/") or catchall.startswith("docs") or catchall.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="Ruta de API no encontrada.")
        
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Archivo frontend no encontrado.")
else:
    # Development fallback root route
    @app.get("/")
    def read_root():
        return {
            "status": "online",
            "message": "Bienvenido al Sistema de Gestión de la NOM-035 API (Modo de desarrollo)",
            "documentation": "/docs"
        }
