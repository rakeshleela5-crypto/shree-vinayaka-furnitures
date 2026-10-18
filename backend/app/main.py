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
            ("reserved_stock", "FLOAT DEFAULT 0.0"),
            ("transit_stock", "FLOAT DEFAULT 0.0"),
            ("reorder_quantity", "FLOAT DEFAULT 5.0"),
            ("lead_time_days", "INTEGER DEFAULT 7"),
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

        delivery_cols = [
            ("state", "VARCHAR(100) DEFAULT 'Kerala'"),
            ("stage", "VARCHAR(50) DEFAULT 'Booked'"),
            ("driver_name", "VARCHAR(100)"),
            ("driver_phone", "VARCHAR(50)"),
            ("eway_bill_no", "VARCHAR(100)"),
            ("technician_name", "VARCHAR(100)"),
            ("technician_phone", "VARCHAR(50)"),
            ("assembly_notes", "TEXT"),
            ("dispatched_at", "TIMESTAMP"),
            ("assembled_at", "TIMESTAMP"),
            ("delivered_at", "TIMESTAMP"),
            ("csat_rating", "INTEGER"),
            ("csat_tags", "VARCHAR(255)"),
            ("csat_feedback", "TEXT"),
            ("csat_logged_at", "TIMESTAMP"),
            ("csat_followup_status", "VARCHAR(50) DEFAULT 'Pending'"),
        ]
        for col_name, col_type in delivery_cols:
            try:
                conn.execute(text(f"ALTER TABLE delivery_notes ADD COLUMN {col_name} {col_type}"))
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

from fastapi.responses import JSONResponse
import os
MIN_CLIENT_VERSION = os.getenv("MIN_CLIENT_VERSION", "2026.1.0")

@app.middleware("http")
async def client_version_guard(request, call_next):
    # Guard against outdated PWA service worker bundles triggering 422 schemas
    client_version = request.headers.get("X-Client-Version")
    if client_version and MIN_CLIENT_VERSION:
        if client_version < MIN_CLIENT_VERSION:
            return JSONResponse(
                status_code=426,
                content={
                    "detail": "Showroom terminal bundle outdated. Reloading latest Cloudflare Pages build.",
                    "required_version": MIN_CLIENT_VERSION,
                    "client_version": client_version
                }
            )
    response = await call_next(request)
    return response

# Mount API v1
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Welcome to Shree Vinayaka Furnitures API",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "ws": "/ws/store-events"
    }

from fastapi import WebSocket, WebSocketDisconnect
import json
from app.services.realtime import realtime_manager

@app.websocket("/ws/store-events")
@app.websocket(f"{settings.API_V1_STR}/ws/store-events")
async def websocket_store_events(websocket: WebSocket):
    await realtime_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"event": "pong"}))
    except WebSocketDisconnect:
        realtime_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client disconnected with exception: {e}")
        realtime_manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
