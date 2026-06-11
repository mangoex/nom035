# backend/app/main.py
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.app.db.session import engine, Base
from backend.app.api.endpoints import auth, company, survey, action_plan

# Bootstrap database tables
Base.metadata.create_all(bind=engine)

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

# Serve frontend build in production (single-container mode)
backend_root = os.path.dirname(os.path.dirname(__file__))  # points to /app/backend
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
