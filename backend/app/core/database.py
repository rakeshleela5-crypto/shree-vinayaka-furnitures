import os
import logging
from typing import AsyncGenerator, Any
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger(__name__)

try:
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
    HAS_ASYNC_SQLA = True
except (ImportError, Exception) as sqla_err:
    HAS_ASYNC_SQLA = False
    create_async_engine = None
    async_sessionmaker = None
    AsyncSession = Any
    logger.warning(f"SQLAlchemy asyncio support not available (greenlet may be missing): {sqla_err}")

from app.core.config import settings

# 1. Automatically normalize Railway DATABASE_URL for sync engine
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

# Synchronous Engine (Production Pool Tuning for Railway PostgreSQL)
if db_url.startswith("sqlite"):
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=1800,
        pool_size=10,
        max_overflow=20,
        pool_timeout=30
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 2. Asynchronous Engine & Connection Pooling (#4, #80)
# Configure create_async_engine with pool_size=10, max_overflow=20, pool_timeout=30,
# pool_recycle=1800, and pool_pre_ping=True to prevent Railway PostgreSQL idle drops.
async_engine = None
AsyncSessionLocal = None

if HAS_ASYNC_SQLA and create_async_engine is not None and async_sessionmaker is not None:
    try:
        async_db_url = settings.get_async_database_url
        if async_db_url.startswith("sqlite"):
            async_engine = create_async_engine(
                async_db_url,
                pool_size=10,
                max_overflow=20,
                pool_timeout=30,
                pool_recycle=1800,
                pool_pre_ping=True,
                connect_args={"check_same_thread": False}
            )
        else:
            async_engine = create_async_engine(
                async_db_url,
                pool_size=10,
                max_overflow=20,
                pool_timeout=30,
                pool_recycle=1800,
                pool_pre_ping=True
            )

        # Strict request-scoped session isolation via async_sessionmaker(expire_on_commit=False)
        AsyncSessionLocal = async_sessionmaker(
            bind=async_engine,
            expire_on_commit=False,
            class_=AsyncSession
        )
    except Exception as async_err:
        logger.warning(f"Failed to initialize async SQLAlchemy engine: {async_err}")
        async_engine = None
        AsyncSessionLocal = None

async def get_async_db() -> AsyncGenerator[Any, None]:
    """Request-scoped AsyncSession dependency providing isolated database transactions."""
    if AsyncSessionLocal is None:
        raise RuntimeError(
            "Asynchronous database session is not available. "
            "Ensure 'greenlet' and the async database driver ('asyncpg' for Postgres or 'aiosqlite' for SQLite) are installed."
        )
    async with AsyncSessionLocal() as session:
        yield session

