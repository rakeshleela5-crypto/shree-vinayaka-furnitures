"""
backend/app/api/v1/endpoints/audit.py
Financial Audit Trail Query Endpoints.
Feature #105:
Immutable Financial Audit Logs for stock adjustments, price overrides,
invoice cancellations, khata modifications, and manual UTR reconciliations.
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.audit import AuditLog

router = APIRouter()


@router.get("/logs", response_model=Dict[str, Any])
def list_financial_audit_logs(
    action: Optional[str] = Query(None, description="STOCK_ADJUSTMENT, PRICE_OVERRIDE, INVOICE_CANCEL, KHATA_MODIFICATION, MANUAL_UTR_RECONCILIATION"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    entity_id: Optional[str] = Query(None, description="Filter by entity ID"),
    actor_id: Optional[str] = Query(None, description="Filter by actor ID"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Query append-only financial audit trail records with strategic indexing.
    """
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action.upper())
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type.upper())
    if entity_id:
        query = query.filter(AuditLog.entity_id == str(entity_id))
    if actor_id:
        query = query.filter(AuditLog.actor_id == str(actor_id))

    total = query.count()
    items = query.order_by(AuditLog.id.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "items": [
            {
                "id": log.id,
                "actor_id": log.actor_id,
                "role": log.role,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "before_state": log.before_state,
                "after_state": log.after_state,
                "ip_address": log.ip_address,
                "request_id": log.request_id,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            for log in items
        ]
    }
