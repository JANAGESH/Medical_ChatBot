"""
Aegis AI Clinical Platform - Database Configuration and Engine Provider.

This module initializes the SQLAlchemy database engine, creates the sessionmaker,
and provides the FastAPI dependencies for transactional request-scoped DB sessions.
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import settings

# Render/Supabase sometimes provide postgres:// instead of postgresql://
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# SQLite adjustments for multithreading
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Initialize engine
engine = create_engine(
    db_url,
    connect_args=connect_args
)

# Test primary connection at import time, fallback to SQLite if offline/paused
if not db_url.startswith("sqlite"):
    try:
        # Create a temp engine with a 3-second connection timeout to check status
        temp_engine = create_engine(
            db_url,
            connect_args={"connect_timeout": 3}
        )
        with temp_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Successfully verified connection to primary database.")
    except Exception as e:
        print(f"Warning: Database connection to primary failed ({e}). Falling back to local SQLite database.")
        db_url = "sqlite:///./medical.db"
        connect_args = {"check_same_thread": False}
        engine = create_engine(
            db_url,
            connect_args=connect_args
        )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

# FastAPI Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

