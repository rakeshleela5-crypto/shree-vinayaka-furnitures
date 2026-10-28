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
