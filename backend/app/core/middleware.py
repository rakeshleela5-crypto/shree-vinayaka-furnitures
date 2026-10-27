"""
backend/app/core/middleware.py
Production Middleware for Sri Vinayaka Furnitures ERP & POS.
Features #1, #92, #100, #103, #104, #105, #109:
1. Persistent Idempotency Middleware backed by PostgreSQL/SQLite idempotency_keys table.
2. Structured JSON Request Tracing, execution timing (duration_ms), and [SLOW_REQUEST] (>500ms) detection.
3. Automated incident alerts on unhandled 500 server errors.
"""
import time
import uuid
import json
import hashlib
import logging
from datetime import timezone, timedelta
from typing import Callable, Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.concurrency import iterate_in_threadpool
from fastapi.responses import JSONResponse

from app.core.database import SessionLocal
from app.core.datetime_utils import get_utc_now
from app.models.audit import IdempotencyKey
from app.services.alert_service import trigger_incident_alert

logger = logging.getLogger("svf.requests")

# Routes requiring mandatory X-Idempotency-Key (#1)
MANDATORY_IDEMPOTENCY_ROUTES = {
    "/api/v1/invoices",
    "/api/v1/sales/",
    "/api/v1/sales",
    "/api/v1/payments/decentro/upi-qr",
    "/api/decentro/collections/upi-qr",
    "/api/v1/payments/decentro/payout",
    "/api/decentro/payouts/initiate",
    "/api/v1/payments/reconcile-utr",
    "/api/v1/accounting/bank-sync/reconcile-entry",
}


class RequestTracingAndAlertMiddleware(BaseHTTPMiddleware):
    """
    Assigns unique X-Request-ID to every request, logs execution duration,
    flags requests exceeding 500ms as SLOW_REQUEST, and dispatches incident alerts
    on unhandled 500 exceptions (#92, #100, #103, #104, #109).
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Extract or generate unique Request ID
        request_id = request.headers.get("X-Request-ID") or f"req-{uuid.uuid4().hex[:16]}"
        request.state.request_id = request_id

        start_time = time.perf_counter()
        client_ip = request.client.host if request.client else "unknown"

        try:
            response = await call_next(request)
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

            # Header injection
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Execution-Time-Ms"] = str(duration_ms)

            # Structured logging
            log_data = {
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "client_ip": client_ip,
            }

            # Flag slow queries / slow routes (>500ms) (#100, #103)
            if duration_ms > 500.0:
                response.headers["X-Slow-Request"] = "true"
                logger.warning(f"[SLOW_REQUEST] {json.dumps(log_data)}")
            else:
                logger.info(f"[REQUEST] {json.dumps(log_data)}")

            # Unhandled 500 incident alert (#104, #109)
            if response.status_code >= 500:
                trigger_incident_alert(
                    title=f"5xx Server Error on {request.method} {request.url.path}",
                    message=f"Request {request_id} returned status {response.status_code} in {duration_ms}ms.",
                    severity="CRITICAL",
                    details=log_data,
                    request_id=request_id
                )

            return response

        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            error_details = {
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "duration_ms": duration_ms,
                "client_ip": client_ip,
                "error": str(exc),
            }
            logger.exception(f"[UNHANDLED_EXCEPTION] {json.dumps(error_details)}")

            trigger_incident_alert(
                title=f"Unhandled Exception on {request.method} {request.url.path}",
                message=f"Exception caught in middleware: {str(exc)}",
                severity="CRITICAL",
                details=error_details,
                request_id=request_id
            )

            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal server error occurred. Incident has been dispatched to administrators.",
                    "request_id": request_id,
                },
                headers={
                    "X-Request-ID": request_id,
                    "X-Execution-Time-Ms": str(duration_ms)
                }
            )


class DatabaseIdempotencyMiddleware(BaseHTTPMiddleware):
    """
    Persisted PostgreSQL/SQLite Idempotency Guard (#1).
    - Requires X-Idempotency-Key on critical financial mutations.
    - Caches completed response bodies in the idempotency_keys table.
    - Guards against duplicate in-flight requests (409 Conflict).
    - Serves cached responses with X-Idempotency-Hit: true.
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path.rstrip("/")
        method = request.method.upper()

        idempotency_key = (
            request.headers.get("X-Idempotency-Key") or
            request.headers.get("Idempotency-Key")
        )

        # 1. Enforce requirement on critical financial mutations (#1)
        is_financial_mutation = (
            method == "POST" and any(
                path == r.rstrip("/")
                for r in MANDATORY_IDEMPOTENCY_ROUTES
            )
        )

        if is_financial_mutation and not idempotency_key:
            return JSONResponse(
                status_code=400,
                content={
                    "detail": "Missing required header: 'X-Idempotency-Key'. Financial mutations require an idempotency key to prevent duplicate charges or stock discrepancies.",
                    "endpoint": path
                }
            )

        # If no idempotency key on non-mandatory route, pass through normally
        if not idempotency_key or method not in ("POST", "PUT", "PATCH", "DELETE"):
            return await call_next(request)

        # Read and cache request body for deterministic hash verification
        body_bytes = await request.body()
        req_hash = hashlib.sha256(body_bytes).hexdigest()

        # Re-set body stream for downstream route handlers
        has_sent = False
        async def receive():
            nonlocal has_sent
            if not has_sent:
                has_sent = True
                return {"type": "http.request", "body": body_bytes, "more_body": False}
            return {"type": "http.request", "body": b"", "more_body": False}
        request._receive = receive

        now = get_utc_now()
        db = SessionLocal()
        try:
            # Check existing key in PostgreSQL / SQLite
            existing_key = db.query(IdempotencyKey).filter(IdempotencyKey.key == idempotency_key).first()

            if existing_key:
                exp = existing_key.expires_at
                if exp is not None and getattr(exp, "tzinfo", None) is None:
                    exp = exp.replace(tzinfo=timezone.utc)
                cat = existing_key.created_at
                if cat is not None and getattr(cat, "tzinfo", None) is None:
                    cat = cat.replace(tzinfo=timezone.utc)

                # If key has expired (>24 hours), delete and allow fresh execution
                if exp and exp < now:
                    db.delete(existing_key)
                    db.commit()
                elif existing_key.status == "COMPLETED" and existing_key.response_status:
                    # Return cached response idempotently (#1)
                    body_content = existing_key.response_body or ""
                    return Response(
                        content=body_content,
                        status_code=existing_key.response_status,
                        headers={
                            "Content-Type": "application/json",
                            "X-Idempotency-Hit": "true",
                            "X-Idempotency-Key": idempotency_key
                        },
                        media_type="application/json"
                    )
                elif existing_key.status == "IN_PROGRESS":
                    # Concurrent request collision: reject to prevent double processing (#1)
                    diff_secs = (now - cat).total_seconds() if cat else 0.0
                    if diff_secs < 60:
                        return JSONResponse(
                            status_code=409,
                            content={
                                "detail": "A transaction with this idempotency key is currently in progress. Please wait for the current request to complete.",
                                "idempotency_key": idempotency_key
                            }
                        )

            # Record in-flight transaction
            if not existing_key:
                in_progress_record = IdempotencyKey(
                    key=idempotency_key,
                    endpoint=path,
                    request_hash=req_hash,
                    status="IN_PROGRESS",
                    created_at=now,
                    expires_at=now + timedelta(hours=24)
                )
                db.add(in_progress_record)
                db.commit()
            else:
                existing_key.status = "IN_PROGRESS"
                existing_key.created_at = now
                existing_key.request_hash = req_hash
                db.commit()

        except Exception as e:
            logger.warning(f"[Idempotency DB Lookup Exception] {e}")
        finally:
            db.close()

        # Execute downstream endpoint
        response = await call_next(request)

        # Persist completed response if status is not server error
        if response.status_code < 500:
            try:
                response_body_chunks = [chunk async for chunk in response.body_iterator]
                response.body_iterator = iterate_in_threadpool(iter(response_body_chunks))
                full_body_bytes = b"".join(response_body_chunks)
                body_str = full_body_bytes.decode("utf-8", errors="replace")

                db_save = SessionLocal()
                try:
                    target_rec = db_save.query(IdempotencyKey).filter(IdempotencyKey.key == idempotency_key).first()
                    if target_rec:
                        target_rec.status = "COMPLETED"
                        target_rec.response_status = response.status_code
                        target_rec.response_body = body_str
                        db_save.commit()
                finally:
                    db_save.close()

                # Return fresh response with idempotency headers
                res_headers = dict(response.headers)
                res_headers["X-Idempotency-Key"] = idempotency_key
                res_headers["X-Idempotency-Hit"] = "false"
                return Response(
                    content=full_body_bytes,
                    status_code=response.status_code,
                    headers=res_headers,
                    media_type=response.media_type or "application/json"
                )
            except Exception as e:
                logger.error(f"[Idempotency DB Save Exception] {e}")

        return response
