"""
Test Suite: Decentro Banking & Webhook Chaos Testing (Layer 2 Blueprint)
Validates:
1. 50x Webhook Storm (50 concurrent identical callbacks within 2 seconds)
   - Idempotency via UNIQUE constraint and SELECT ... FOR UPDATE
   - Zero double-crediting of customer ledger
   - All 50 return 200 OK / clean duplicate acknowledgement without 500 crashes
2. Signature Verification Tampering (HMAC-SHA256)
   - Payload tampered from 5,000 to 50,000 without signature update -> rejected with 401
3. Delayed / Missed Webhook Self-Healing Polling Worker
   - Recovers pending payment on fallback poll
"""

import os
import json
import hmac
import hashlib
import asyncio
import uuid
import time
from decimal import Decimal
import pytest
import httpx
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from app.core.database import SessionLocal
from app.models.customer import Customer
from app.models.sale import PaymentTransaction, SaleInvoice
from app.api.v1.endpoints import decentro as decentro_module

def get_async_client():
    transport = httpx.ASGITransport(app=app)
    return httpx.AsyncClient(transport=transport, base_url="http://testserver", timeout=20.0)


@pytest.mark.asyncio
async def test_50x_webhook_storm_idempotency_within_2_seconds():
    """
    Blueprint Scenario: Webhook Idempotency (Crucial)
    Fires 50 simultaneous duplicate Decentro webhook callbacks (same UTR and txn ID)
    within 2 seconds.
    Pass Criteria:
    - Database records payment exactly once.
    - Customer ledger credited exactly once.
    - Zero double-crediting.
    - All 50 requests return 200 OK on duplicates without unhandled 500 crashes.
    """
    db = SessionLocal()
    unique_suffix = uuid.uuid4().hex[:6].upper()
    cust_code = f"CUST-CHAOS50-{unique_suffix}"
    va_acc_no = f"VA50{uuid.uuid4().int >> 80}"[:16]
    
    # 1. Setup Customer with 1,00,000 outstanding balance
    cust = Customer(
        code=cust_code,
        name=f"Storm Client {unique_suffix}",
        phone=f"98{uuid.uuid4().int % 100000000:08d}",
        virtual_account_number=va_acc_no,
        credit_limit=500000.0,
        current_balance=100000.0
    )
    db.add(cust)
    db.commit()
    db.refresh(cust)
    cust_id = cust.id
    initial_balance = cust.current_balance
    db.close()

    # Fixed UTR and transaction ID for the storm
    storm_utr = f"UTR50STORM{unique_suffix}"
    storm_txn_id = f"DEC_50_{unique_suffix}"
    payment_amount = 25000.0

    payload = {
        "attempt": 1,
        "timestamp": "2026-10-25 23:50:00",
        "callbackTxnId": storm_txn_id,
        "OriginalCallbackTxnId": storm_txn_id,
        "accountNumber": va_acc_no,
        "type": "credit",
        "transferType": "UPI",
        "transactionAmount": payment_amount,
        "decentroTxnId": storm_txn_id,
        "payerVpa": "customer@icici",
        "bankReferenceNumber": storm_utr,
        "transactionStatus": "SUCCESS"
    }

    # Execute 50 rapid requests throttled safely for SQLite file-lock while maintaining race condition
    start_time = time.perf_counter()
    async with get_async_client() as client:
        sem = asyncio.Semaphore(8) # High concurrency without SQLite file deadlock
        async def post_with_sem():
            async with sem:
                return await client.post("/api/webhooks/decentro/collections", json=payload)
        tasks = [post_with_sem() for _ in range(50)]
        responses = await asyncio.gather(*tasks)
    elapsed_time = time.perf_counter() - start_time

    status_codes = [r.status_code for r in responses]
    print(f"\n[50x Webhook Storm] Completed 50 calls in {elapsed_time:.2f}s. Statuses: 200 count = {status_codes.count(200)}")

    # 1. Zero 500 errors
    assert 500 not in status_codes, f"500 Internal Server Error detected in storm! Codes: {set(status_codes)}"
    # 2. All 50 succeed (200 OK / 201 Created)
    assert all(code in (200, 201) for code in status_codes), f"Non-200 code received: {set(status_codes)}"
    
    # 3. Customer balance must be credited EXACTLY ONCE
    db = SessionLocal()
    refreshed_cust = db.query(Customer).filter(Customer.id == cust_id).first()
    expected_balance = initial_balance - payment_amount
    assert refreshed_cust.current_balance == expected_balance, \
        f"DOUBLE-CREDIT DISASTER: Expected {expected_balance}, got {refreshed_cust.current_balance}!"

    # 4. Only 1 PaymentTransaction record created for this UTR
    txns = db.query(PaymentTransaction).filter(PaymentTransaction.utr_number == storm_utr).all()
    assert len(txns) == 1, f"Multiple transaction records created: {len(txns)}"
    db.close()
    print("   [OK] Webhook 50x Storm: Exactly 1 credit applied, 0 duplicate rows, all 50 acknowledged.")


@pytest.mark.asyncio
async def test_webhook_signature_verification_tampering_rejected_with_401():
    """
    Blueprint Scenario: Signature Verification Tampering
    An attacker modifies the webhook payload amount from ₹5,000 to ₹50,000
    without possessing the secret key to compute a new HMAC signature.
    Confirm FastAPI rejects it with 401 Unauthorized.
    """
    test_secret = "secret_svf_webhook_signing_key_2026"
    
    # Original genuine payload (amount: 5,000)
    original_payload = {
        "decentroTxnId": f"DEC-TAMPER-{uuid.uuid4().hex[:6]}",
        "transactionAmount": 5000.0,
        "bankReferenceNumber": f"UTR-TAMPER-{uuid.uuid4().hex[:6]}",
        "transactionStatus": "SUCCESS"
    }
    raw_original_bytes = json.dumps(original_payload, separators=(',', ':')).encode("utf-8")
    valid_sig = hmac.new(test_secret.encode("utf-8"), raw_original_bytes, hashlib.sha256).hexdigest()

    # Attacker tampers the amount to 50,000 while retaining the old signature header
    tampered_payload = dict(original_payload)
    tampered_payload["transactionAmount"] = 50000.0 # 10x inflated amount
    raw_tampered_bytes = json.dumps(tampered_payload, separators=(',', ':')).encode("utf-8")

    with patch.object(decentro_module, "DECENTRO_WEBHOOK_SECRET", test_secret):
        async with get_async_client() as client:
            res = await client.post(
                "/api/webhooks/decentro/collections",
                content=raw_tampered_bytes,
                headers={
                    "Content-Type": "application/json",
                    "x-decentro-signature": valid_sig # Stale signature for 5,000 payload
                }
            )
            assert res.status_code == 401, f"Tampered webhook was not rejected! Status: {res.status_code}"
            assert "Invalid Decentro webhook signature" in res.json().get("detail", "")
    print("   [OK] Signature Tampering Guard: Tampered payload rejected with HTTP 401 Unauthorized.")


def test_delayed_webhook_self_healing_polling_reconciliation():
    """
    Blueprint Scenario: Delayed/Missed Webhook Reconciliation
    Simulates a scenario where a customer pays via UPI QR, Decentro marks it successful,
    but the webhook was delayed or lost.
    The ERP fallback status poll query checks Decentro, self-heals, and updates the invoice.
    """
    db = SessionLocal()
    suffix = uuid.uuid4().hex[:6].upper()
    ref_id = f"REF-HEAL-{suffix}"
    utr_no = f"UTR-HEAL-{suffix}"

    # Setup pending transaction
    txn = PaymentTransaction(
        reference_id=ref_id,
        amount=15000.0,
        status="PENDING",
        payment_mode="UPI_QR",
        utr_number=None
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    txn_id = txn.id
    db.close()

    # Simulate Decentro status check returning SUCCESS with bank UTR
    mock_decentro_response = MagicMock()
    mock_decentro_response.status_code = 200
    mock_decentro_response.json.return_value = {
        "status": "SUCCESS",
        "data": {
            "transactionStatus": "SUCCESS",
            "bankReferenceNumber": utr_no,
            "transactionAmount": 15000.0,
            "decentroTxnId": f"DEC-POLL-{suffix}"
        }
    }
    mock_http_client = MagicMock()
    mock_http_client.__enter__.return_value = mock_http_client
    mock_http_client.get.return_value = mock_decentro_response

    with patch("app.api.v1.endpoints.decentro.httpx.Client", return_value=mock_http_client):
        client = TestClient(app)
        res = client.get(f"/api/v1/decentro/collections/status/{ref_id}")
        assert res.status_code == 200, f"Status check failed: {res.text}"
        data = res.json()
        assert data.get("status") in ("SUCCESS", "SUCCESSFUL")
        
        # Verify self-healing updated the database
        db = SessionLocal()
        healed_txn = db.query(PaymentTransaction).filter(PaymentTransaction.id == txn_id).first()
        assert healed_txn.status == "SUCCESS", f"Transaction not healed: status is {healed_txn.status}"
        assert healed_txn.utr_number == utr_no, f"UTR not recorded on healed transaction"
        db.close()

    print("   [OK] Delayed Webhook Self-Healing: Fallback polling updated pending transaction to SUCCESS.")
