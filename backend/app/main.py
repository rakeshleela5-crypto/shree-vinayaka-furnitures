from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text, func, case
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.api.v1.api import api_router
from app.seed import seed_database
from app.models.sale import SaleInvoice
from app.models.customer import Customer
from app.models.purchase import PurchaseInvoice
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
    import app.models  # Ensure all SQLAlchemy models are registered on Base.metadata
    
    # 1. Programmatic Alembic schema migration to HEAD (#23)
    try:
        from alembic.config import Config
        from alembic import command
        import os
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        alembic_ini_path = os.path.join(base_dir, "alembic.ini")
        if os.path.exists(alembic_ini_path):
            alembic_cfg = Config(alembic_ini_path)
            command.upgrade(alembic_cfg, "head")
            logger.info("Alembic schema migrations applied successfully to HEAD.")
    except Exception as e:
        logger.warning(f"Alembic auto-upgrade warning (falling back to auto_migration): {e}")

    # 2. Verify and safety-migrate schema columns & strategic indexes (#20, #23)
    from app.core.auto_migration import verify_and_migrate_schema
    verify_and_migrate_schema(engine, Base)
    
    # Auto-seed database if empty
    db = SessionLocal()
    try:
        seed_database(db)
        logger.info("Database seeding completed.")
        from app.services.feature_flag_service import seed_default_feature_flags
        seed_default_feature_flags(db)
        logger.info("Default feature flags verified.")
    except Exception as e:
        logger.error(f"Error during database seed: {e}")
    finally:
        db.close()

    # Start automated daily R2 database backup scheduler (#41, #97)
    from app.services.backup_cron import start_backup_scheduler, shutdown_backup_scheduler
    start_backup_scheduler()
        
    yield
    # Shutdown logic
    shutdown_backup_scheduler()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for Shree Vinayaka Furnitures powered by FastAPI & PostgreSQL on Railway",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Setup - Restricted strictly to verified Cloudflare Pages project subdomains and local dev (#42)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"https://([a-z0-9-]+\.)*srivinayakafurnitures\.pages\.dev|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from app.core.rate_limit import limiter

# SlowAPI Rate Limiting Setup (#2, #18, #19)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

from app.core.middleware import (
    RequestTracingAndAlertMiddleware,
    DatabaseIdempotencyMiddleware
)

# 1. Structured Logging, Slow Query Tracking (>500ms), and Incident Alerts (#92, #100, #103, #104, #109)
app.add_middleware(RequestTracingAndAlertMiddleware)

# 2. PostgreSQL / SQLite Persistent Idempotency Guard (#1)
app.add_middleware(DatabaseIdempotencyMiddleware)

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
def root_supplier_payment_alias(payload: SupplierPaymentRequest, request: Request, db: Session = Depends(get_db)):
    return record_supplier_payment_voucher(payload=payload, request=request, db=db)

@app.get("/api/ledger/balances", response_model=LiveLedgerBalancesResponse, tags=["Double-Entry Ledger"])
def root_ledger_balances_alias(db: Session = Depends(get_db)):
    return get_live_ledger_balances(db=db)

from fastapi import Request, Header, Query
from typing import Optional, Dict, Any
from app.api.v1.endpoints.products import get_catalog_delta_sync

@app.get("/api/v1/catalog/sync", tags=["Offline-First POS & Delta Sync"])
@app.get("/catalog/sync", tags=["Offline-First POS & Delta Sync"])
def root_catalog_sync_alias(
    since: Optional[str] = Query(None, description="ISO timestamp or epoch seconds to sync deltas since"),
    db: Session = Depends(get_db)
):
    return get_catalog_delta_sync(since=since, db=db)

from app.api.v1.endpoints.decentro import router as decentro_router, decentro_webhook_listener, get_collection_status
app.include_router(decentro_router, prefix="/api/decentro", tags=["Decentro Financial Engine"])

from app.api.v1.endpoints.decentro import (
    router as decentro_router,
    decentro_webhook_listener,
    get_collection_status,
    generate_dynamic_upi_qr,
    initiate_vendor_or_carpenter_payout,
    manual_reconcile_utr,
    list_dead_letter_webhooks,
    replay_dead_letter_webhook,
    DynamicQRRequest,
    PayoutInitiateRequest,
    UTRReconcileRequest
)
from app.api.v1.endpoints.sales import create_sale_invoice
from app.schemas.sale import SaleInvoiceCreate, SaleInvoiceResponse

app.include_router(decentro_router, prefix="/api/decentro", tags=["Decentro Financial Engine"])

# Direct aliases for specification routes (#1, #17, #35, #38, #39)
@app.post("/api/v1/invoices", response_model=SaleInvoiceResponse, tags=["Sales & POS Billing"])
@app.post("/api/invoices", response_model=SaleInvoiceResponse, tags=["Sales & POS Billing"])
def root_invoices_alias(payload: SaleInvoiceCreate, db: Session = Depends(get_db)):
    return create_sale_invoice(payload=payload, db=db)

@app.post("/api/v1/payments/decentro/upi-qr", tags=["Decentro Financial Engine"])
@app.post("/api/payments/decentro/upi-qr", tags=["Decentro Financial Engine"])
async def root_decentro_upi_qr_alias(payload: DynamicQRRequest, db: Session = Depends(get_db)):
    return await generate_dynamic_upi_qr(payload=payload, db=db)

@app.post("/api/v1/payments/decentro/payout", tags=["Decentro Financial Engine"])
@app.post("/api/payments/decentro/payout", tags=["Decentro Financial Engine"])
async def root_decentro_payout_alias(payload: PayoutInitiateRequest, request: Request, db: Session = Depends(get_db)):
    return await initiate_vendor_or_carpenter_payout(payload=payload, request=request, db=db)

@app.post("/api/v1/payments/reconcile-utr", tags=["Decentro Financial Engine"])
@app.post("/api/payments/reconcile-utr", tags=["Decentro Financial Engine"])
def root_reconcile_utr_alias(payload: UTRReconcileRequest, request: Request, db: Session = Depends(get_db)):
    return manual_reconcile_utr(payload=payload, request=request, db=db)

@app.post("/api/webhooks/decentro/collections", tags=["Decentro Financial Engine"])
@app.post("/api/webhooks/decentro", tags=["Decentro Financial Engine"])
@app.post("/api/v1/webhooks/decentro", tags=["Decentro Financial Engine"])
@limiter.limit("60/minute")
async def root_decentro_webhook_alias(
    request: Request,
    db: Session = Depends(get_db),
    x_decentro_signature: Optional[str] = Header(default=None),
):
    return await decentro_webhook_listener(request=request, db=db, x_decentro_signature=x_decentro_signature)

@app.get("/api/v1/admin/webhooks/dead-letter", tags=["Decentro Financial Engine"])
@app.get("/api/admin/webhooks/dead-letter", tags=["Decentro Financial Engine"])
def root_dead_letter_list_alias(status: Optional[str] = "PENDING_REPLAY", limit: int = 50, db: Session = Depends(get_db)):
    return list_dead_letter_webhooks(status=status, limit=limit, db=db)

@app.post("/api/v1/admin/webhooks/{id}/replay", tags=["Decentro Financial Engine"])
@app.post("/api/admin/webhooks/{id}/replay", tags=["Decentro Financial Engine"])
def root_dead_letter_replay_alias(id: int, db: Session = Depends(get_db)):
    return replay_dead_letter_webhook(id=id, db=db)

@app.get("/api/collections/status/{reference_id}", tags=["Decentro Financial Engine"])
@app.get("/api/v1/collections/status/{reference_id}", tags=["Decentro Financial Engine"])
def root_collection_status_alias(reference_id: str, db: Session = Depends(get_db)):
    return get_collection_status(reference_id=reference_id, db=db)

from app.api.v1.endpoints.health import health_check

@app.get("/health", tags=["Health"])
def root_health_probe(db: Session = Depends(get_db)):
    return health_check(db=db)

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
    """
    Daily sales, counter collections, and pending dues summary using native SQL aggregations (#21).
    Eliminates loading ORM instances into Python memory.
    """
    from datetime import datetime as dt
    today = dt.utcnow().strftime("%Y-%m-%d")
    
    agg = db.query(
        func.count(SaleInvoice.id).label("total_invoices"),
        func.coalesce(func.sum(SaleInvoice.grand_total), 0.0).label("total_sales"),
        func.coalesce(func.sum(SaleInvoice.paid_amount), 0.0).label("total_collected"),
        func.coalesce(func.sum(SaleInvoice.balance_due), 0.0).label("total_balance_due")
    ).filter(
        SaleInvoice.date == today,
        SaleInvoice.status != "Voided"
    ).first()
    
    return {
        "date": today,
        "total_invoices": int(agg.total_invoices or 0),
        "total_sales": float(agg.total_sales or 0.0),
        "total_collected": float(agg.total_collected or 0.0),
        "total_balance_due": float(agg.total_balance_due or 0.0),
        "system_status": "ONLINE",
        "currency": "INR"
    }

@app.get("/api/reports/deferred-payments", tags=["Reports & Dashboards"])
@app.get("/api/v1/reports/deferred-payments", tags=["Reports & Dashboards"])
def root_deferred_payments_report(db: Session = Depends(get_db)):
    """
    Pending Deferred Payments (Customer Khata) KPI using native PostgreSQL aggregation (#20, #21).
    Calculates outstanding customer credit without loading ORM objects into Python memory.
    """
    inv_agg = db.query(
        func.count(SaleInvoice.id).label("pending_invoice_count"),
        func.coalesce(func.sum(SaleInvoice.balance_due), 0.0).label("total_pending_balance"),
        func.coalesce(func.sum(case((SaleInvoice.balance_due > 0, SaleInvoice.balance_due), else_=0.0)), 0.0).label("overdue_amount")
    ).filter(
        SaleInvoice.balance_due > 0.01,
        SaleInvoice.status != "Voided"
    ).first()

    cust_agg = db.query(
        func.count(Customer.id).label("khata_customer_count"),
        func.coalesce(func.sum(case((Customer.current_balance > 0, Customer.current_balance), else_=0.0)), 0.0).label("total_receivables")
    ).first()

    return {
        "pending_invoices": int(inv_agg.pending_invoice_count or 0),
        "total_pending_balance": float(inv_agg.total_pending_balance or 0.0),
        "overdue_amount": float(inv_agg.overdue_amount or 0.0),
        "khata_customers": int(cust_agg.khata_customer_count or 0),
        "total_receivables": float(cust_agg.total_receivables or 0.0),
        "currency": "INR"
    }

@app.get("/api/reports/gst-summary", tags=["Reports & Dashboards"])
@app.get("/api/v1/reports/gst-summary", tags=["Reports & Dashboards"])
def root_gst_summary_report(db: Session = Depends(get_db)):
    """
    Native SQL GST Input/Output reconciliation summary (#20, #21).
    Computes CGST, SGST, IGST liability and Input Tax Credit (ITC) directly in PostgreSQL.
    """
    out_gst = db.query(
        func.coalesce(func.sum(SaleInvoice.sub_total), 0.0).label("taxable_sales"),
        func.coalesce(func.sum(SaleInvoice.cgst_total), 0.0).label("cgst_output"),
        func.coalesce(func.sum(SaleInvoice.sgst_total), 0.0).label("sgst_output"),
        func.coalesce(func.sum(SaleInvoice.igst_total), 0.0).label("igst_output"),
        func.coalesce(func.sum(SaleInvoice.cgst_total + SaleInvoice.sgst_total + SaleInvoice.igst_total), 0.0).label("total_output_tax")
    ).filter(SaleInvoice.status != "Voided").first()

    in_gst = db.query(
        func.coalesce(func.sum(PurchaseInvoice.sub_total), 0.0).label("taxable_purchases"),
        func.coalesce(func.sum(PurchaseInvoice.cgst), 0.0).label("cgst_input"),
        func.coalesce(func.sum(PurchaseInvoice.sgst), 0.0).label("sgst_input"),
        func.coalesce(func.sum(PurchaseInvoice.igst), 0.0).label("igst_input"),
        func.coalesce(func.sum(PurchaseInvoice.cgst + PurchaseInvoice.sgst + PurchaseInvoice.igst), 0.0).label("total_input_tax")
    ).first()

    total_out = float(out_gst.total_output_tax or 0.0)
    total_in = float(in_gst.total_input_tax or 0.0)
    net_liability = max(0.0, total_out - total_in)
    net_credit = max(0.0, total_in - total_out)

    return {
        "output_gst": {
            "taxable_sales": float(out_gst.taxable_sales or 0.0),
            "cgst": float(out_gst.cgst_output or 0.0),
            "sgst": float(out_gst.sgst_output or 0.0),
            "igst": float(out_gst.igst_output or 0.0),
            "total_output_tax": total_out
        },
        "input_gst_itc": {
            "taxable_purchases": float(in_gst.taxable_purchases or 0.0),
            "cgst": float(in_gst.cgst_input or 0.0),
            "sgst": float(in_gst.sgst_input or 0.0),
            "igst": float(in_gst.igst_input or 0.0),
            "total_input_tax": total_in
        },
        "net_tax_payable": net_liability,
        "net_itc_carried_forward": net_credit,
        "status": "BALANCED"
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

@app.websocket("/ws/pos/{terminal_id}")
@app.websocket(f"{settings.API_V1_STR}/ws/pos/{{terminal_id}}")
async def websocket_pos_terminal(websocket: WebSocket, terminal_id: str):
    """
    Dedicated POS cashier terminal WebSocket channel (#37, #54).
    Receives instant PAYMENT_SUCCESS push notifications when Decentro settles transactions.
    """
    await realtime_manager.connect(websocket, terminal_id=terminal_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"event": "pong", "terminal_id": terminal_id}))
    except WebSocketDisconnect:
        realtime_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"POS WebSocket terminal {terminal_id} disconnected: {e}")
        realtime_manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
