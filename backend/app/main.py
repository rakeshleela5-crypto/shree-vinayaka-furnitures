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

# Real-Time Production Monitoring (Sentry Integration)
if settings.SENTRY_DSN:
    try:
        import sentry_sdk
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.ENVIRONMENT,
            traces_sample_rate=1.0 if settings.ENVIRONMENT == "production" else 0.1,
            send_default_pii=False,
        )
        logger.info("Real-time production monitoring initialized via Sentry.")
    except Exception as e:
        logger.warning(f"Failed to initialize Sentry: {e}")

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

# CORS Setup - Restricted strictly to verified Cloudflare Pages project subdomains and local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"https://(srivinayakafurnitures|shree-vinayaka-furnitures)(-[a-z0-9]+)?\.pages\.dev",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def security_headers_middleware(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

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
    idempotency_key = request.headers.get("Idempotency-Key") or request.headers.get("X-Idempotency-Key")
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

# Mount API v1 and /api prefix for dual-route edge compatibility
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(api_router, prefix="/api")

# Explicit aliases for direct pipeline paths requested in specs
from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.endpoints.purchases import create_standalone_grn
from app.api.v1.endpoints.accounting import record_customer_khata_receipt, record_supplier_payment_voucher, get_live_ledger_balances
from app.schemas.purchase import GoodsReceiptNoteCreate, GoodsReceiptNoteResponse
from app.schemas.accounting import CustomerKhataReceiptRequest, CustomerKhataReceiptResponse, SupplierPaymentRequest, SupplierPaymentResponse, LiveLedgerBalancesResponse

@app.post("/api/grn", response_model=GoodsReceiptNoteResponse, tags=["GRN & Stock Entry"])
def root_grn_alias(payload: GoodsReceiptNoteCreate, db: Session = Depends(get_db)):
    return create_standalone_grn(payload=payload, db=db)

@app.post("/api/ledger/customer-receipt", response_model=CustomerKhataReceiptResponse, tags=["Customer Khata"])
def root_customer_receipt_alias(payload: CustomerKhataReceiptRequest, db: Session = Depends(get_db)):
    return record_customer_khata_receipt(payload=payload, db=db)

@app.post("/api/ledger/supplier-payment", response_model=SupplierPaymentResponse, tags=["Supplier Ledger"])
def root_supplier_payment_alias(payload: SupplierPaymentRequest, db: Session = Depends(get_db)):
    return record_supplier_payment_voucher(payload=payload, db=db)

@app.get("/api/ledger/balances", response_model=LiveLedgerBalancesResponse, tags=["Double-Entry Ledger"])
def root_ledger_balances_alias(db: Session = Depends(get_db)):
    return get_live_ledger_balances(db=db)

from fastapi import Request, Header, Query
from typing import Optional, Dict, Any
from app.api.v1.endpoints.decentro import router as decentro_router, decentro_webhook_listener, get_collection_status
app.include_router(decentro_router, prefix="/api/decentro", tags=["Decentro Financial Engine"])

@app.post("/api/webhooks/decentro/collections", tags=["Decentro Financial Engine"])
@app.post("/api/webhooks/decentro", tags=["Decentro Financial Engine"])
async def root_decentro_webhook_alias(
    request: Request,
    db: Session = Depends(get_db),
    x_decentro_signature: Optional[str] = Header(default=None),
):
    return await decentro_webhook_listener(request=request, db=db, x_decentro_signature=x_decentro_signature)

@app.get("/api/collections/status/{reference_id}", tags=["Decentro Financial Engine"])
def root_collection_status_alias(reference_id: str, db: Session = Depends(get_db)):
    return get_collection_status(reference_id=reference_id, db=db)

# -------------------------------------------------------------
# HIGH-THROUGHPUT SHOWROOM ERP LOAD TESTING ENDPOINTS (LOCUST)
# -------------------------------------------------------------
from app.models.sale import SaleInvoice
from app.models.product import Product

@app.get("/api/inventory/search", tags=["Inventory & Catalog"])
@app.get("/api/v1/inventory/search", tags=["Inventory & Catalog"])
def root_inventory_search(q: Optional[str] = Query(None), limit: int = 50, db: Session = Depends(get_db)):
    """High-frequency SKU / barcode / product name search for POS scanners and Locust load testing."""
    query = db.query(Product).filter(Product.is_active == True)
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            (Product.name.ilike(term)) |
            (Product.barcode.ilike(term)) |
            (Product.p_code.ilike(term))
        )
    products = query.limit(limit).all()
    return [
        {
            "id": p.id,
            "sku": p.p_code or f"SKU-{p.id}",
            "name": p.name,
            "barcode": p.barcode,
            "current_stock": float(p.current_stock or 0.0),
            "mrp": float(getattr(p, 'mrp', 0.0) or 0.0),
            "rate": float(getattr(p, 'retail_price', 0.0) or getattr(p, 'mrp', 0.0) or 0.0)
        }
        for p in products
    ]

@app.get("/api/reports/daily-summary", tags=["Reports & Dashboards"])
@app.get("/api/v1/reports/daily-summary", tags=["Reports & Dashboards"])
def root_daily_summary_report(db: Session = Depends(get_db)):
    """Daily sales, counter collections, and pending dues summary for dashboard and Locust tests."""
    from datetime import datetime as dt
    today = dt.utcnow().strftime("%Y-%m-%d")
    invoices_today = db.query(SaleInvoice).filter(SaleInvoice.date == today).all()
    
    total_sales = sum(float(i.grand_total or 0.0) for i in invoices_today)
    total_paid = sum(float(i.paid_amount or 0.0) for i in invoices_today)
    total_due = sum(float(i.balance_due or 0.0) for i in invoices_today)
    
    return {
        "date": today,
        "total_invoices": len(invoices_today),
        "total_sales": total_sales,
        "total_collected": total_paid,
        "total_balance_due": total_due,
        "system_status": "ONLINE",
        "currency": "INR"
    }

@app.post("/api/billing/validate-invoice", tags=["POS Billing"])
@app.post("/api/v1/billing/validate-invoice", tags=["POS Billing"])
def root_billing_validate_invoice(payload: dict, db: Session = Depends(get_db)):
    """Pre-flight invoice validation endpoint for POS terminals and Locust stress tests."""
    customer_name = payload.get("customer_name", "Walk-in Customer")
    items = payload.get("items", [])
    utr = payload.get("utr_reference") or payload.get("utr_number")
    
    if utr and str(utr).strip().upper() not in ("NA", "NONE", "CASH", "0", ""):
        clean_utr = str(utr).strip()
        existing = db.query(SaleInvoice).filter(SaleInvoice.utr_number == clean_utr).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Duplicate UTR: {clean_utr} has already been credited.")

    sub_total = sum(float(i.get("price", 0.0) or i.get("rate", 0.0)) * float(i.get("qty", 1.0)) for i in items)
    tax = round(sub_total * 0.18, 2)
    grand_total = sub_total + tax
    
    return {
        "valid": True,
        "customer_name": customer_name,
        "items_count": len(items),
        "sub_total": sub_total,
        "tax": tax,
        "grand_total": grand_total,
        "status": "VALIDATED"
    }

@app.get("/healthz")
def healthz():
    """Railway readiness & liveness probe executing SELECT 1"""
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "ok", "service": "Shree Vinayaka Furnitures API", "database": "healthy"}
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "unhealthy", "error": str(e)})

@app.get("/")
def root():
    return {
        "message": "Welcome to Shree Vinayaka Furnitures API",
        "docs": "/docs",
        "health": "/healthz",
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
