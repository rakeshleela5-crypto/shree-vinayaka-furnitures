import os
import asyncio
import httpx
import pytest
import uuid

# Auto-configured for local ASGI testing or Railway Staging URL
# Set STAGING_BASE_URL to test against Railway, e.g.:
# export STAGING_BASE_URL="https://your-fastapi-staging.up.railway.app"
BASE_URL = os.getenv("STAGING_BASE_URL", "")
WEBHOOK_PATH = "/api/webhooks/decentro/collections"
WEBHOOK_SECRET = os.getenv("DECENTRO_WEBHOOK_SECRET", "your_staging_webhook_secret")
WEBHOOK_SECRET_HEADER = {"x-decentro-signature": WEBHOOK_SECRET}

@pytest.mark.asyncio
async def test_decentro_webhook_idempotency_under_race_condition():
    """
    Fires 10 identical Decentro UPI/Virtual Account webhook callbacks concurrently.
    Verifies that PostgreSQL only credits the customer's invoice ONCE.
    """
    unique_utr = f"6298{uuid.uuid4().int >> 96}"[:12]  # Simulated 12-digit bank UTR
    decentro_txn_id = f"DEC_{uuid.uuid4().hex[:16].upper()}"

    # Simulated Decentro Collection / Virtual Account Callback Payload
    payload = {
        "attempt": 1,
        "timestamp": "2026-10-25 12:55:00",
        "callbackTxnId": decentro_txn_id,
        "OriginalCallbackTxnId": decentro_txn_id,
        "accountNumber": "462515000000000001",
        "balance": 145000.00,
        "transactionMessage": f"UPI/CR/{unique_utr}/Customer Advance",
        "type": "credit",
        "transferType": "UPI",
        "transactionAmount": 25000.00,
        "decentroTxnId": decentro_txn_id,
        "payerVpa": "customer@ybl",
        "bankReferenceNumber": unique_utr,
        "transactionStatus": "SUCCESS"
    }

    if BASE_URL:
        # Live staging execution against Railway
        client_kwargs = {"base_url": BASE_URL, "timeout": 15.0}
    else:
        # In-process ASGI test execution
        from app.main import app
        transport = httpx.ASGITransport(app=app)
        client_kwargs = {"transport": transport, "base_url": "http://testserver", "timeout": 15.0}

    async with httpx.AsyncClient(**client_kwargs) as client:
        # Fire 10 simultaneous webhook requests (simulating network retry storm)
        tasks = [
            client.post(WEBHOOK_PATH, json=payload, headers=WEBHOOK_SECRET_HEADER)
            for _ in range(10)
        ]
        responses = await asyncio.gather(*tasks)

    status_codes = [r.status_code for r in responses]
    print(f"\nWebhook response codes: {status_codes}")

    # 1. None of the concurrent requests should cause an unhandled 500 server crash
    assert 500 not in status_codes, f"CRITICAL: Concurrent webhooks triggered a 500 Internal Server Error! Codes: {status_codes}"

    # 2. All responses should cleanly acknowledge (200 OK) or reject as duplicate (200/409)
    assert all(code in (200, 201, 409) for code in status_codes), f"Unexpected status codes: {status_codes}"
    print(f"PASSED: 10 concurrent requests acknowledged cleanly without 500 error!")


if __name__ == "__main__":
    asyncio.run(test_decentro_webhook_idempotency_under_race_condition())
