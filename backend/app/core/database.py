import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# 1. Automatically normalize Railway DATABASE_URL:
# If starts with postgres://, replace with postgresql+psycopg2:// (or postgresql+psycopg://)
raw_db_url = os.getenv("DATABASE_URL") or settings.DATABASE_URL or "sqlite:///./furnitures.db"

if raw_db_url.startswith("postgres://"):
    try:
        import psycopg2  # type: ignore
        db_url = raw_db_url.replace("postgres://", "postgresql+psycopg2://", 1)
    except ImportError:
        db_url = raw_db_url.replace("postgres://", "postgresql+psycopg://", 1)
elif raw_db_url.startswith("postgresql://") and not raw_db_url.startswith("postgresql+"):
    try:
        import psycopg2  # type: ignore
        db_url = raw_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    except ImportError:
        db_url = raw_db_url.replace("postgresql://", "postgresql+psycopg://", 1)
else:
    db_url = raw_db_url

# 2. Configure engine with production connection pool tuning
if db_url.startswith("sqlite"):
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL connection pool tuning for Railway
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=1800,
        pool_size=10,
        max_overflow=20
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

