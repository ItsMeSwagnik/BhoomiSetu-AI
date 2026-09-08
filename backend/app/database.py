import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models import Base

db_url = settings.database_url or "sqlite:////tmp/bhoomisetu.db"

if db_url.startswith("sqlite"):
    # If in serverless (e.g. Vercel), ensure writable location
    if "///." in db_url or "///bhoomisetu" in db_url:
        try:
            test_path = Path("./.db_test")
            test_path.touch()
            test_path.unlink()
        except Exception:
            db_url = "sqlite:////tmp/bhoomisetu.db"

    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
    )
else:
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
    elif db_url.startswith("postgresql+psycopg2://"):
        db_url = db_url.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)

    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=300,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
