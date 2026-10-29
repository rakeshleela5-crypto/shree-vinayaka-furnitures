from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Any, Dict
import logging
import datetime
import os
import urllib.request
import json

router = APIRouter()
logger = logging.getLogger("svf.telemetry")

class DeadLetterPayload(BaseModel):
    terminalId: Optional[str] = "UNKNOWN"
    eventType: Optional[str] = "GENERIC"
    severity: Optional[str] = "ERROR"
    reference: Optional[str] = None
    reason: Optional[str] = "No reason specified"
    timestamp: Optional[str] = None
    url: Optional[str] = None
    userAgent: Optional[str] = None
    payload: Optional[Any] = None

@router.post("/dead-letter")
def record_dead_letter_alert(item: DeadLetterPayload):
    """
    Receives dead-letter events & runtime errors from showroom POS terminals.
    Dispatches instant notification to Telegram or Alert Webhook if configured.
    """
    logger.warning(
        f"[TELEMETRY DEAD-LETTER] Terminal: {item.terminalId} | "
        f"Event: {item.eventType} | Severity: {item.severity} | "
        f"Ref: {item.reference} | Reason: {item.reason}"
    )

    telegram_token = os.getenv("TELEGRAM_BOT_TOKEN")
    telegram_chat_id = os.getenv("TELEGRAM_CHAT_ID")
    webhook_url = os.getenv("ALERT_WEBHOOK_URL")
    
    delivered_tg = False
    delivered_hook = False

    formatted_msg = (
        f"🚨 *[SVF ERP TELEMETRY ALERT]*\n"
        f"*Severity:* `{item.severity}`\n"
        f"*Event:* `{item.eventType}`\n"
        f"*Terminal:* `{item.terminalId}`\n"
        f"*Ref:* `{item.reference or 'N/A'}`\n"
        f"*Reason:* {item.reason}\n"
        f"*Time:* `{item.timestamp or datetime.datetime.utcnow().isoformat()}`"
    )

    if telegram_token and telegram_chat_id:
        try:
            tg_url = f"https://api.telegram.org/bot{telegram_token}/sendMessage"
            req = urllib.request.Request(
                tg_url,
                data=json.dumps({
                    "chat_id": telegram_chat_id,
                    "text": formatted_msg,
                    "parse_mode": "Markdown"
                }).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                delivered_tg = resp.status == 200
        except Exception as e:
            logger.warning(f"Telegram dispatch failed: {e}")

    if webhook_url:
        try:
            req = urllib.request.Request(
                webhook_url,
                data=json.dumps({"text": formatted_msg, "item": item.dict()}).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                delivered_hook = resp.status == 200
        except Exception as e:
            logger.warning(f"Webhook dispatch failed: {e}")

    return {
        "status": "ok",
        "recorded": True,
        "delivered": {"telegram": delivered_tg, "webhook": delivered_hook},
        "timestamp": datetime.datetime.utcnow().isoformat()
    }


# ==========================================
# HARDWARE WEIGHING SCALE & TELEMETRY
# ==========================================
from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.company import MarketingCampaignLog

class ScaleEventPayload(BaseModel):
    terminal_id: Optional[str] = "SCALE-01"
    scale_brand: Optional[str] = "CAS/Essae"
    raw_weight: float
    unit: Optional[str] = "kg"
    tare: Optional[float] = 0.0
    net_weight: float
    is_stable: Optional[bool] = True
    product_id: Optional[int] = None
    sku: Optional[str] = None
    timestamp: Optional[str] = None

@router.post("/hardware/scale-event")
def record_scale_event(item: ScaleEventPayload, db: Session = Depends(get_db)):
    """
    Records hardware weighing scale serial/USB events into AuditLog for accountability.
    """
    try:
        log_entry = AuditLog(
            actor_id=item.terminal_id,
            role="HARDWARE_SCALE",
            action="SCALE_MEASUREMENT",
            entity_type="WEIGHING_SCALE",
            entity_id=str(item.product_id or item.sku or item.terminal_id),
            before_state=None,
            after_state=json.dumps({
                "terminal_id": item.terminal_id,
                "scale_brand": item.scale_brand,
                "raw_weight": item.raw_weight,
                "unit": item.unit,
                "tare": item.tare,
                "net_weight": item.net_weight,
                "is_stable": item.is_stable,
                "product_id": item.product_id,
                "sku": item.sku,
                "timestamp": item.timestamp or datetime.datetime.utcnow().isoformat()
            })
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return {
            "status": "SUCCESS",
            "log_id": log_entry.id,
            "net_weight": item.net_weight,
            "unit": item.unit,
            "is_stable": item.is_stable
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to record scale event: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to persist scale event: {str(e)}")


# ==========================================
# WHATSAPP PROMOTIONAL CAMPAIGNS PERSISTENCE
# ==========================================
class WhatsAppMessageItem(BaseModel):
    customer_id: Optional[int] = None
    customer_name: str
    phone: str
    message: str

class WhatsAppBulkCampaignPayload(BaseModel):
    campaign_name: str
    messages: list[WhatsAppMessageItem]
    channel: Optional[str] = "WHATSAPP"

@router.post("/whatsapp/send-bulk")
def log_bulk_whatsapp_campaign(payload: WhatsAppBulkCampaignPayload, db: Session = Depends(get_db)):
    """
    Persists outgoing WhatsApp promotional messages into MarketingCampaignLog.
    """
    try:
        created_records = []
        for msg in payload.messages:
            record = MarketingCampaignLog(
                campaign_name=payload.campaign_name,
                customer_id=msg.customer_id,
                customer_name=msg.customer_name,
                phone=msg.phone,
                channel=payload.channel or "WHATSAPP",
                message_content=msg.message,
                status="SENT"
            )
            db.add(record)
            created_records.append(record)
        
        db.commit()
        return {
            "status": "SUCCESS",
            "campaign_name": payload.campaign_name,
            "total_sent": len(created_records),
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to log bulk WhatsApp campaign: {e}")
        raise HTTPException(status_code=500, detail=f"Database write error: {str(e)}")


@router.get("/whatsapp/campaigns")
def get_whatsapp_campaigns(limit: int = 50, db: Session = Depends(get_db)):
    """
    Retrieves recent WhatsApp promotional marketing campaign logs.
    """
    logs = db.query(MarketingCampaignLog).order_by(MarketingCampaignLog.id.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "campaign_name": log.campaign_name,
            "customer_id": log.customer_id,
            "customer_name": log.customer_name,
            "phone": log.phone,
            "channel": log.channel,
            "message_content": log.message_content,
            "sent_at": log.sent_at.isoformat() if log.sent_at else None,
            "status": log.status
        }
        for log in logs
    ]

