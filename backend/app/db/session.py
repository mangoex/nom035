# backend/app/db/session.py
import os
import posixpath
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./nom035.db")

# SQLite needs a specific argument for multithreading
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def _resolve_configured_path(path):
    if path.startswith("/"):
        return path
    return os.path.abspath(path)

def _join_path(path, *parts):
    if path.startswith("/"):
        return posixpath.join(path, *parts)
    return os.path.join(path, *parts)

# FastAPI Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_uploads_dir():
    # 1. Environment variable override
    env_uploads = os.getenv("UPLOADS_DIR")
    if env_uploads:
        return _resolve_configured_path(env_uploads)
        
    # 2. Dynamic check based on DATABASE_URL
    db_url = os.getenv("DATABASE_URL", DATABASE_URL)
    if db_url.startswith("sqlite:///"):
        # Remove sqlite:/// prefix
        db_path = db_url.replace("sqlite:///", "")
        # Resolve to absolute path
        abs_db_path = _resolve_configured_path(db_path)
        db_dir = os.path.dirname(abs_db_path)
        
        # If the db is located in a persistent path (contains '/data' or starts with '/app')
        # we put uploads in that same directory so it inherits the volume mount persistence
        if "/data" in db_dir or db_dir.startswith("/app"):
            return _join_path(db_dir, "uploads")
            
    # 3. Default fallback to backend/uploads
    # This file is at backend/app/db/session.py, so parent of parent of parent is backend/
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    return os.path.join(base_dir, "uploads")

