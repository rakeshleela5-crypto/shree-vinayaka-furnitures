"""
backend/app/services/audit_service.py
Immutable Financial Audit Service.
Feature #105:
Automatically logs every stock adjustment, price override, invoice cancellation,
deferred payment (khata) modification, and manual UTR reconciliation.
"""
import json
import logging
from typing import Optional, Dict, Any, Union
from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from app.core.datetime_utils import get_utc_now

logger = logging.getLogger(__name__)


def _serialize_state(state: Optional[Union[Dict[str, Any], str, list]]) -> Optional[str]:
    if state is None:
        return None
    if isinstance(state, str):
        return state
    try:
        return json.dumps(state, default=str)
    except Exception as e:
        logger.warning(f"Failed to serialize audit state: {e}")
        return str(state)


def log_financial_audit(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: Optional[Union[str, int]],
    before_state: Optional[Union[Dict[str, Any], str, list]] = None,
    after_state: Optional[Union[Dict[str, Any], str, list]] = None,
    actor_id: Optional[str] = None,
    role: Optional[str] = None,
    ip_address: Optional[str] = None,
    request_id: Optional[str] = None,
    auto_commit: bool = False
) -> AuditLog:
    """
    Appends an immutable financial audit entry into audit_logs.
    Valid actions:
      - STOCK_ADJUSTMENT
      - PRICE_OVERRIDE
      - INVOICE_CANCEL
      - KHATA_MODIFICATION
      - MANUAL_UTR_RECONCILIATION
    """
    audit_entry = AuditLog(
        actor_id=str(actor_id) if actor_id is not None else None,
        role=role or "SYSTEM",
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        before_state=_serialize_state(before_state),
        after_state=_serialize_state(after_state),
        ip_address=ip_address,
        request_id=request_id,
        created_at=get_utc_now()
    )
    db.add(audit_entry)
    if auto_commit:
        db.commit()
        db.refresh(audit_entry)
    else:
        db.flush()

    logger.info(
        f"[FINANCIAL AUDIT] Action={action} Entity={entity_type} ID={entity_id} "
        f"Actor={actor_id or 'System'} RequestID={request_id or 'N/A'}"
    )
    return audit_entry


def log_stock_adjustment(
    db: Session,
    product_id: int,
    before_stock: float,
    after_stock: float,
    reason: str,
    godown: Optional[str] = None,
    actor_id: Optional[str] = None,
    request_id: Optional[str] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    return log_financial_audit(
        db=db,
        action="STOCK_ADJUSTMENT",
        entity_type="PRODUCT_STOCK",
        entity_id=product_id,
        before_state={"stock": before_stock, "godown": godown},
        after_state={"stock": after_stock, "difference": round(after_stock - before_stock, 2), "reason": reason, "godown": godown},
        actor_id=actor_id,
        request_id=request_id,
        ip_address=ip_address
    )


def log_price_override(
    db: Session,
    product_id: int,
    field_name: str,
    before_price: float,
    after_price: float,
    reason: str = "Price Update",
    actor_id: Optional[str] = None,
    request_id: Optional[str] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    return log_financial_audit(
        db=db,
        action="PRICE_OVERRIDE",
        entity_type="PRODUCT_PRICE",
        entity_id=product_id,
        before_state={field_name: before_price},
        after_state={field_name: after_price, "reason": reason},
        actor_id=actor_id,
        request_id=request_id,
        ip_address=ip_address
    )


def log_invoice_cancellation(
    db: Session,
    invoice_id: int,
    invoice_no: str,
    grand_total: float,
    reason: str,
    customer_id: Optional[int] = None,
    actor_id: Optional[str] = None,
    request_id: Optional[str] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    return log_financial_audit(
        db=db,
        action="INVOICE_CANCEL",
        entity_type="SALE_INVOICE",
        entity_id=invoice_id,
        before_state={"invoice_no": invoice_no, "status": "Active", "grand_total": grand_total, "customer_id": customer_id},
        after_state={"invoice_no": invoice_no, "status": "Cancelled", "cancellation_reason": reason},
        actor_id=actor_id,
        request_id=request_id,
        ip_address=ip_address
    )


def log_khata_modification(
    db: Session,
    customer_id: int,
    customer_name: str,
    before_balance: float,
    after_balance: float,
    voucher_no: str,
    particulars: str,
    actor_id: Optional[str] = None,
    request_id: Optional[str] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    return log_financial_audit(
        db=db,
        action="KHATA_MODIFICATION",
        entity_type="CUSTOMER_KHATA",
        entity_id=customer_id,
        before_state={"customer_name": customer_name, "balance": before_balance},
        after_state={"customer_name": customer_name, "balance": after_balance, "delta": round(after_balance - before_balance, 2), "voucher_no": voucher_no, "particulars": particulars},
        actor_id=actor_id,
        request_id=request_id,
        ip_address=ip_address
    )


def log_manual_utr_reconciliation(
    db: Session,
    statement_entry_id: int,
    utr_number: str,
    party_type: str,
    party_name: str,
    amount: float,
    actor_id: Optional[str] = None,
    request_id: Optional[str] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    return log_financial_audit(
        db=db,
        action="MANUAL_UTR_RECONCILIATION",
        entity_type="BANK_STATEMENT_ENTRY",
        entity_id=statement_entry_id,
        before_state={"status": "Unreconciled", "amount": amount},
        after_state={"status": "Reconciled", "utr_number": utr_number, "party_type": party_type, "party_name": party_name, "amount": amount},
        actor_id=actor_id,
        request_id=request_id,
        ip_address=ip_address
    )
