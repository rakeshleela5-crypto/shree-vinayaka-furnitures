"""
backend/app/services/alert_service.py
Real-time Incident Alert Dispatcher.
Features #92, #100, #103, #104, #109:
Triggers instant alert notifications on unhandled 500 exceptions,
failed Decentro payouts, or circuit breaker trips.
"""
import os
import logging
import asyncio
from typing import Optional, Dict, Any
import httpx
from app.core.datetime_utils import get_utc_now, to_ist_datetime

logger = logging.getLogger(__name__)

ALERT_WEBHOOK_URL = os.getenv("ALERT_WEBHOOK_URL", "")


async def _send_webhook_notification(payload: Dict[str, Any]):
    """Non-blocking outbound alert dispatch to monitoring channel (Slack / Discord / Ops Webhook)."""
    if not ALERT_WEBHOOK_URL:
        return
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            await client.post(ALERT_WEBHOOK_URL, json=payload)
    except Exception as ex:
        logger.warning(f"[ALERT DISPATCH FAILED] Could not send external alert: {ex}")


def trigger_incident_alert(
    title: str,
    message: str,
    severity: str = "CRITICAL",
    details: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None
):
    """
    Synchronous/async-safe incident alert dispatcher.
    Logs structured error and triggers instant notification.
    """
    utc_now = get_utc_now()
    ist_time_str = to_ist_datetime(utc_now).strftime("%d-%m-%Y %I:%M:%S %p IST")

    alert_payload = {
        "title": f"🚨 [SVF ERP ALERT - {severity.upper()}] {title}",
        "message": message,
        "severity": severity.upper(),
        "timestamp_ist": ist_time_str,
        "request_id": request_id or "N/A",
        "details": details or {}
    }

    logger.error(
        f"[INCIDENT ALERT] Severity={severity} Title={title} "
        f"RequestID={request_id} Details={details}"
    )

    if ALERT_WEBHOOK_URL:
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(_send_webhook_notification(alert_payload))
            else:
                asyncio.run(_send_webhook_notification(alert_payload))
        except Exception as e:
            logger.debug(f"Alert event loop dispatch notice: {e}")
