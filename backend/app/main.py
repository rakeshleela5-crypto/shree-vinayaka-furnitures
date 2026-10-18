from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.api.v1.api import api_router
from app.seed import seed_database
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables are created in PostgreSQL / SQLite
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    
    # Auto-migrate new columns for products and bank_statement_entries tables if needed
    with engine.connect() as conn:
        cols_to_add = [
            ("is_knockdown", "BOOLEAN DEFAULT FALSE"),
            ("total_boxes_count", "INTEGER DEFAULT 1"),
            ("assembly_required", "BOOLEAN DEFAULT FALSE"),
            ("assembly_lead_time_mins", "INTEGER DEFAULT 0"),
        ]
        for col_name, col_type in cols_to_add:
            try:
                conn.execute(text(f"ALTER TABLE products ADD COLUMN {col_name} {col_type}"))
                conn.commit()
            except Exception:
                pass

        bank_cols = [
            ("balance", "FLOAT DEFAULT 0.0"),
            ("utr_number", "VARCHAR(100)"),
            ("status", "VARCHAR(50) DEFAULT 'Unreconciled'"),
            ("reconciled_party_type", "VARCHAR(50)"),
            ("reconciled_party_id", "INTEGER"),
            ("reconciled_party_name", "VARCHAR(200)"),
            ("reconciled_ref_no", "VARCHAR(100)"),
            ("reconciled_at", "TIMESTAMP"),
        ]
        for col_name, col_type in bank_cols:
            try:
                conn.execute(text(f"ALTER TABLE bank_statement_entries ADD COLUMN {col_name} {col_type}"))
                conn.commit()
            except Exception:
                pass
    
    # Auto-seed database if empty
    db = SessionLocal()
    try:
        seed_database(db)
        logger.info("Database seeding completed.")
    except Exception as e:
        logger.error(f"Error during database seed: {e}")
    finally:
        db.close()
        
    yield
    # Shutdown logic if any

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for Shree Vinayaka Furnitures powered by FastAPI & PostgreSQL on Railway",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Setup - Supports Cloudflare Pages and local Vite dev servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"https://.*\.pages\.dev",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Welcome to Shree Vinayaka Furnitures API",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
