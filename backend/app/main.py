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
    # Startup: Ensure tables are created and missing columns are safely auto-migrated
    logger.info("Initializing database schema and running auto-migration...")
    from app.core.auto_migration import verify_and_migrate_schema
    verify_and_migrate_schema(engine, Base)
    
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

import time
from starlette.concurrency import iterate_in_threadpool
from starlette.responses import Response

_IDEMPOTENCY_CACHE = {}

@app.middleware("http")
async def idempotency_guard(request, call_next):
    idempotency_key = request.headers.get("X-Idempotency-Key")
    if idempotency_key and request.method in ("POST", "PUT", "PATCH", "DELETE"):
        now = time.time()
        # Clean up entries older than 5 minutes (300 seconds)
        expired_keys = [k for k, v in _IDEMPOTENCY_CACHE.items() if now - v["timestamp"] > 300]
        for k in expired_keys:
            _IDEMPOTENCY_CACHE.pop(k, None)

        cached = _IDEMPOTENCY_CACHE.get(idempotency_key)
        if cached:
            headers = dict(cached["headers"])
            headers["X-Idempotency-Hit"] = "true"
            return Response(
                content=cached["body"],
                status_code=cached["status_code"],
                headers=headers,
                media_type=cached.get("media_type", "application/json")
            )

        response = await call_next(request)
        if response.status_code < 500:
            response_body = [chunk async for chunk in response.body_iterator]
            response.body_iterator = iterate_in_threadpool(iter(response_body))
            full_body = b"".join(response_body)
            _IDEMPOTENCY_CACHE[idempotency_key] = {
                "timestamp": now,
                "status_code": response.status_code,
                "body": full_body,
                "headers": dict(response.headers),
                "media_type": response.media_type
            }
            return Response(
                content=full_body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type
            )
        return response

    return await call_next(request)

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
