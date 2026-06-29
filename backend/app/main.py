# backend/app/main.py
import os
import traceback
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.db.session import engine, Base
from backend.app.api.endpoints import auth, company, survey, action_plan, superadmin, consultant

from sqlalchemy import text

# Bootstrap database tables
Base.metadata.create_all(bind=engine)

# Auto-migrate production database (safe to run on startup)
try:
    with engine.begin() as conn:
        # Add assigned_to column if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE action_plans ADD COLUMN assigned_to VARCHAR"))
        except Exception:
            pass

        # Add logo_url column if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE companies ADD COLUMN logo_url VARCHAR"))
        except Exception:
            pass

        # Add consultant_id column if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE companies ADD COLUMN consultant_id INTEGER"))
        except Exception:
            pass

        # Add index for consultant_id if it doesn't exist
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_companies_consultant_id ON companies (consultant_id)"))
        except Exception:
            pass

        # Add cedula_profesional column if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN cedula_profesional VARCHAR"))
        except Exception:
            pass

        # Add creditos column if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN creditos INTEGER DEFAULT 0"))
        except Exception:
            pass

        # Add logo_url to users column if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN logo_url VARCHAR"))
        except Exception:
            pass

        # Add cedula_image_url to users column if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN cedula_image_url VARCHAR"))
        except Exception:
            pass


        # Add capacitaciones to users column if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN capacitaciones JSON"))
        except Exception:
            pass

        # Add address to companies column if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE companies ADD COLUMN address VARCHAR"))
        except Exception:
            pass

        # Add phone to companies column if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE companies ADD COLUMN phone VARCHAR"))
        except Exception:
            pass

        # Add main_activity to companies column if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE companies ADD COLUMN main_activity VARCHAR"))
        except Exception:
            pass

        # Add columns to survey_sessions if they don't exist
        try:
            conn.execute(text("ALTER TABLE survey_sessions ADD COLUMN recopilador VARCHAR"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE survey_sessions ADD COLUMN creador VARCHAR"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE survey_sessions ADD COLUMN cedula_creador VARCHAR"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE survey_sessions ADD COLUMN fecha_fin DATE"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE survey_sessions ADD COLUMN clave_secreta VARCHAR"))
        except Exception:
            pass

        # Create indexes if they don't exist (works for both SQLite and PostgreSQL)
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_company_id ON users (company_id)"))
        except Exception:
            pass
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_survey_sessions_company_id ON survey_sessions (company_id)"))
        except Exception:
            pass
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_survey_responses_company_id ON survey_responses (company_id)"))
        except Exception:
            pass
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_survey_responses_survey_session_id ON survey_responses (survey_session_id)"))
        except Exception:
            pass
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_action_plans_company_id ON action_plans (company_id)"))
        except Exception:
            pass
except Exception as e:
    print("Auto-migration skipped or failed:", e)

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
