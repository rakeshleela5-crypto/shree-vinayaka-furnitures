from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from app.core.database import Base
from app.core.datetime_utils import get_utc_now


class IdempotencyKey(Base):
    """
    Persisted idempotency key record guarding financial transactions, POS invoices,
    and banking API calls across server restarts and concurrent worker instances.
    """
    __tablename__ = "idempotency_keys"

    key = Column(String(128), primary_key=True, index=True)
    endpoint = Column(String(255), nullable=False)
    request_hash = Column(String(128), nullable=False)
    response_status = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    status = Column(String(32), default="IN_PROGRESS", nullable=False, index=True)  # IN_PROGRESS, COMPLETED, FAILED
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)


class DeadLetterWebhook(Base):
    """
    Append-only dead-letter queue for webhooks that failed processing due to
    unexpected database state, missing entity links, or transient downstream locks.
    Exposes administrative replay capability without dropping webhook events.
    """
    __tablename__ = "dead_letter_webhooks"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    provider = Column(String(64), default="DECENTRO", nullable=False, index=True)
    event_type = Column(String(128), nullable=True)
    headers = Column(Text, nullable=True)
    payload = Column(Text, nullable=False)
    error_message = Column(Text, nullable=True)
    traceback = Column(Text, nullable=True)
    status = Column(String(32), default="PENDING_REPLAY", nullable=False, index=True)  # PENDING_REPLAY, REPLAYED, DISCARDED
    retry_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    last_attempt_at = Column(DateTime(timezone=True), nullable=True)


class AuditLog(Base):
    """
    Immutable financial audit trail recording every critical business event:
    stock adjustments, price overrides, invoice cancellations, customer khata modifications,
    and manual bank UTR reconciliations.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    actor_id = Column(String(64), nullable=True, index=True)
    role = Column(String(64), nullable=True)
    action = Column(String(64), nullable=False, index=True)
    # Actions: STOCK_ADJUSTMENT, PRICE_OVERRIDE, INVOICE_CANCEL, KHATA_MODIFICATION, MANUAL_UTR_RECONCILIATION
    entity_type = Column(String(64), nullable=False, index=True)
    entity_id = Column(String(64), nullable=True, index=True)
    before_state = Column(Text, nullable=True)
    after_state = Column(Text, nullable=True)
    ip_address = Column(String(64), nullable=True)
    request_id = Column(String(64), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False, index=True)
