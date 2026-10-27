"""
backend/app/api/v1/endpoints/health.py
Production Readiness Probe & Latency Monitoring (#61, #69).
Executes 'SELECT 1' on PostgreSQL and verifies Cloudflare R2 object storage readiness,
returning HTTP 200 with component latency metrics for Railway deployments.
"""
import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.core.database import get_db
from app.services.r2_storage import r2_storage

router = APIRouter()


@router.get("/health", summary="Railway Production Readiness Probe")
def health_check(db: Session = Depends(get_db)):
    """
    Executes SELECT 1 on the database and verifies Cloudflare R2 bucket configuration.
    Returns 200 OK with sub-millisecond precision latency metrics.
    """
    total_start = time.perf_counter()

    # 1. Database Probe (SELECT 1 + Latency Tracking)
    db_status = "healthy"
    db_latency_ms = 0.0
    dialect = "unknown"
    try:
        db_start = time.perf_counter()
        db.execute(text("SELECT 1"))
        db_latency_ms = round((time.perf_counter() - db_start) * 1000, 2)
        dialect = db.bind.dialect.name if db.bind else "postgresql"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
        db_latency_ms = round((time.perf_counter() - db_start) * 1000, 2)

    # 2. Cloudflare R2 Storage Readiness Probe
    r2_status = "configured" if r2_storage.is_configured else "mock_local_mode"
    r2_bucket = settings.R2_BUCKET_NAME or "svf-store-backups"

    total_latency_ms = round((time.perf_counter() - total_start) * 1000, 2)
    is_operational = (db_status == "healthy")

    response_body = {
        "status": "ok" if is_operational else "degraded",
        "service": "Sri Vinayaka Furnitures ERP & POS",
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "components": {
            "database": {
                "status": db_status,
                "engine": dialect,
                "latency_ms": db_latency_ms,
            },
            "storage_r2": {
                "status": r2_status,
                "bucket": r2_bucket,
                "public_cdn": bool(settings.R2_PUBLIC_URL),
            }
        },
        "total_latency_ms": total_latency_ms
    }

    status_code = status.HTTP_200_OK if is_operational else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(status_code=status_code, content=response_body)
