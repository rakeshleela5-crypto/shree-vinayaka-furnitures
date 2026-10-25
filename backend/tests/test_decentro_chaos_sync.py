import os
import hmac
import hashlib
import asyncio
import uuid
from decimal import Decimal
import pytest
import httpx
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal
from app.models.customer import Customer
from app.models.sale import SaleInvoice, SaleInvoiceItem, PaymentTransaction, SaleInvoicePayment
from app.models.product import Product
from app.api.v1.endpoints import decentro as decentro_module

STAGING_BASE_URL = os.getenv("STAGING_BASE_URL", "").rstrip("/")

def get_async_client():
    if STAGING_BASE_URL:
        return httpx.AsyncClient(base_url=STAGING_BASE_URL, timeout=15.0)
    transport = httpx.ASGITransport(app=app)
    return httpx.AsyncClient(transport=transport, base_url="http://testserver", timeout=15.0)


@pytest.mark.asyncio
async def test_decentro_webhook_idempotency_under_race_condition():
    """
    Scenario 1: The 'Webhook Retry Storm' (Idempotency Check under Race Condition)
    Fires 10 identical Decentro UPI/Virtual Account webhook callbacks concurrently.
    Verifies that PostgreSQL/database only credits the customer's ledger ONCE,
    and returns 200 OK / 409 without any unhandled 500 server crashes.
    """
    db = SessionLocal()
    # Create test customer with a known Virtual Account number
    cust_code = f"CUST-CHAOS-{uuid.uuid4().hex[:6].upper()}"
    va_acc_no = f"4625{uuid.uuid4().int >> 80}"[:18]
    cust = Customer(
        code=cust_code,
        name=f"Chaos Test Client ({cust_code})",
        phone=f"98{uuid.uuid4().int % 100000000:08d}",
        state="Odisha",
        city="Rayagada",
        virtual_account_number=va_acc_no,
        credit_limit=500000.0,
        current_balance=250000.0
    )
    db.add(cust)
    db.commit()
    db.refresh(cust)
    customer_id = cust.id
    initial_balance = cust.current_balance
    db.close()

    unique_utr = f"6298{uuid.uuid4().int >> 96}"[:12]
    decentro_txn_id = f"DEC_{uuid.uuid4().hex[:16].upper()}"

    # Decentro Virtual Account Collection Callback Payload
    payload = {
        "attempt": 1,
        "timestamp": "2026-10-25 12:55:00",
        "callbackTxnId": decentro_txn_id,
        "OriginalCallbackTxnId": decentro_txn_id,
        "accountNumber": va_acc_no,
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

    async with get_async_client() as client:
        # Fire 10 simultaneous webhook requests at the exact same millisecond
        tasks = [
            client.post("/api/webhooks/decentro/collections", json=payload)
            for _ in range(10)
        ]
        responses = await asyncio.gather(*tasks)

    status_codes = [r.status_code for r in responses]
    print(f"\n[Webhook Retry Storm] Concurrent status codes: {status_codes}")

    # 1. Zero unhandled 500 server crashes under race conditions
    assert 500 not in status_codes, f"CRITICAL: Concurrent webhooks triggered 500 Internal Server Error! Codes: {status_codes}"

    # 2. All responses must cleanly acknowledge (200 OK) or reject as duplicate (200/409)
    assert all(code in (200, 201, 409) for code in status_codes), f"Unexpected status codes: {status_codes}"

    # 3. Verify exactly ONE credit occurred in database (not 10x)
    db = SessionLocal()
    refreshed_cust = db.query(Customer).filter(Customer.id == customer_id).first()
    expected_balance = initial_balance - 25000.0
    actual_balance = refreshed_cust.current_balance
    db.close()

    assert abs(actual_balance - expected_balance) < 0.01, (
        f"Double-crediting detected! Initial: Rs.{initial_balance}, "
        f"Expected after 1 credit: Rs.{expected_balance}, Actual: Rs.{actual_balance}"
    )
    print(f"[Webhook Retry Storm] PASSED: Balance correctly credited exactly once (Rs.{initial_balance} -> Rs.{actual_balance})")


@pytest.mark.asyncio
async def test_decentro_out_of_order_late_webhook_fallback_polling():
    """
    Scenario 2: Out-of-Order / Late Webhook Arrival & Fallback Polling
    When a customer pays via UPI QR, but Decentro webhook takes 45 seconds to reach Railway,
    the POS UI's 'Check Payment Status' button calls GET /api/collections/status/{reference_id}
    so the cashier is never stuck waiting.
    """
    db = SessionLocal()
    # Create invoice and pending payment transaction
    next_inv = f"SVF-POLL-{uuid.uuid4().hex[:6].upper()}"
    inv = SaleInvoice(
        invoice_no=next_inv,
        date="2026-10-25",
        customer_name="Walk-in UPI Customer",
        sub_total=12000.0,
        grand_total=14160.0,
        paid_amount=0.0,
        balance_due=14160.0,
        status="Pending"
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    ref_id = f"SVF-QR-POLL-{inv.id}"
    provider_id = f"DEC-POLL-{uuid.uuid4().hex[:8].upper()}"
    txn = PaymentTransaction(
        reference_id=ref_id,
        provider_txn_id=provider_id,
        invoice_id=inv.id,
        amount=14160.0,
        status="PENDING",
        payment_mode="DECENTRO_UPI_QR"
    )
    db.add(txn)
    db.commit()
    db.close()

    async with get_async_client() as client:
        # 1. Cashier checks status while still pending
        res_pending = await client.get(f"/api/collections/status/{ref_id}")
        assert res_pending.status_code == 200
        data_p = res_pending.json()
        assert data_p["status"] == "PENDING"
        assert data_p["balance_due"] == 14160.0

        # 2. Simulate webhook arrival settling payment
        utr_poll = f"7298{uuid.uuid4().int >> 96}"[:12]
        wh_payload = {
            "status": "SUCCESS",
            "decentroTxnId": provider_id,
            "referenceId": ref_id,
            "amount": 14160.0,
            "bankReferenceNumber": utr_poll,
            "transactionStatus": "SUCCESS"
        }
        res_wh = await client.post("/api/webhooks/decentro/collections", json=wh_payload)
        assert res_wh.status_code == 200

        # 3. Cashier fallback polling re-checks status -> immediately green!
        res_settled = await client.get(f"/api/collections/status/{ref_id}")
        assert res_settled.status_code == 200
        data_s = res_settled.json()
        assert data_s["status"] == "SUCCESS"
        assert data_s["utr_number"] == utr_poll
        assert data_s["invoice_payment_status"] == "Completed"
        assert data_s["balance_due"] == 0.0

    print(f"[Fallback Polling] PASSED: POS poller detected settlement: UTR {utr_poll}, Balance Due: Rs.{data_s['balance_due']}")


@pytest.mark.asyncio
async def test_decentro_partial_and_split_virtual_account_payments():
    """
    Scenario 3: Partial or Over-Payment via Virtual Account (NEFT/RTGS/IMPS)
    An interior/B2B client owes Rs.1,42,500 for a bedroom suite.
    Decentro sends two separate Virtual Account callbacks:
    Callback 1: Rs.1,00,000 (RTGS) -> Order transitions PENDING -> Partial
    Callback 2: Rs.42,500 (RTGS)   -> Order transitions Partial -> Completed
    """
    db = SessionLocal()
    b2b_code = f"B2B-{uuid.uuid4().hex[:6].upper()}"
    va_num = f"4625{uuid.uuid4().int >> 80}"[:18]
    cust = Customer(
        code=b2b_code,
        name=f"Royal Teak Interior Studio ({b2b_code})",
        phone=f"98{uuid.uuid4().int % 100000000:08d}",
        state="Odisha",
        city="Rayagada",
        virtual_account_number=va_num,
        credit_limit=500000.0,
        current_balance=142500.0
    )
    db.add(cust)
    db.commit()
    db.refresh(cust)
    customer_id = cust.id

    inv_b2b_no = f"SVF-B2B-{uuid.uuid4().hex[:6].upper()}"
    inv = SaleInvoice(
        invoice_no=inv_b2b_no,
        date="2026-10-25",
        customer_id=customer_id,
        customer_name=cust.name,
        sub_total=120762.71,
        grand_total=142500.00,
        paid_amount=0.0,
        balance_due=142500.00,
        status="Pending"
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    inv_id = inv.id
    db.close()

    async with get_async_client() as client:
        # Part 1: First RTGS transfer of Rs.1,00,000
        utr_1 = f"RTGS1_{uuid.uuid4().hex[:8].upper()}"
        payload_part_1 = {
            "status": "SUCCESS",
            "accountNumber": va_num,
            "transactionAmount": 100000.00,
            "bankReferenceNumber": utr_1,
            "decentroTxnId": f"DEC-RTGS-1-{uuid.uuid4().hex[:8].upper()}",
            "transactionStatus": "CREDIT"
        }
        res_1 = await client.post("/api/webhooks/decentro/collections", json=payload_part_1)
        assert res_1.status_code == 200

        db = SessionLocal()
        inv_after_1 = db.query(SaleInvoice).filter(SaleInvoice.id == inv_id).first()
        assert inv_after_1.status == "Partial", f"Expected Partial, got {inv_after_1.status}"
        assert abs(float(inv_after_1.paid_amount) - 100000.00) < 0.01
        assert abs(float(inv_after_1.balance_due) - 42500.00) < 0.01
        db.close()
        print(f"[Partial Payment 1] PASSED: Invoice transitioned to Partial (Paid: Rs.1,00,000, Due: Rs.42,500)")

        # Part 2: Second RTGS transfer of Rs.42,500 (completing the bill)
        utr_2 = f"RTGS2_{uuid.uuid4().hex[:8].upper()}"
        payload_part_2 = {
            "status": "SUCCESS",
            "accountNumber": va_num,
            "transactionAmount": 42500.00,
            "bankReferenceNumber": utr_2,
            "decentroTxnId": f"DEC-RTGS-2-{uuid.uuid4().hex[:8].upper()}",
            "transactionStatus": "CREDIT"
        }
        res_2 = await client.post("/api/webhooks/decentro/collections", json=payload_part_2)
        assert res_2.status_code == 200

        db = SessionLocal()
        inv_after_2 = db.query(SaleInvoice).filter(SaleInvoice.id == inv_id).first()
        assert inv_after_2.status == "Completed", f"Expected Completed, got {inv_after_2.status}"
        assert abs(float(inv_after_2.paid_amount) - 142500.00) < 0.01
        assert abs(float(inv_after_2.balance_due) - 0.00) < 0.01

        cust_after = db.query(Customer).filter(Customer.id == customer_id).first()
        assert abs(float(cust_after.current_balance) - 0.00) < 0.01
        db.close()
        print(f"[Partial Payment 2] PASSED: Invoice fully settled to Completed! Khata balance: Rs.{cust_after.current_balance}")



@pytest.mark.asyncio
async def test_decentro_unauthorized_webhook_spoofing_guard():
    """
    Scenario 4: Unauthorized Webhook Spoofing Guard
    Verifies that when DECENTRO_WEBHOOK_SECRET is active, any spoofed payload
    without valid x-decentro-signature is rejected with 401 Unauthorized.
    """
    secret = "staging_webhook_secret_svf_2026"
    orig_secret = decentro_module.DECENTRO_WEBHOOK_SECRET
    decentro_module.DECENTRO_WEBHOOK_SECRET = secret

    try:
        fake_payload = {
            "status": "SUCCESS",
            "amount": 50000.0,
            "bankReferenceNumber": "SPOOF_UTR_999",
            "decentroTxnId": "DEC_FAKE_TXN"
        }

        async with get_async_client() as client:
            # 1. Missing signature header -> 401 Unauthorized
            res_missing = await client.post("/api/webhooks/decentro/collections", json=fake_payload)
            assert res_missing.status_code == 401, f"Expected 401, got {res_missing.status_code}"

            # 2. Invalid/tampered signature header -> 401 Unauthorized
            res_invalid = await client.post(
                "/api/webhooks/decentro/collections",
                json=fake_payload,
                headers={"x-decentro-signature": "bogus_signature_hash"}
            )
            assert res_invalid.status_code == 401, f"Expected 401, got {res_invalid.status_code}"

            # 3. Valid secret token -> 200 OK
            res_valid_token = await client.post(
                "/api/webhooks/decentro/collections",
                json=fake_payload,
                headers={"x-decentro-signature": secret}
            )
            assert res_valid_token.status_code in (200, 201), f"Expected 200, got {res_valid_token.status_code}"

            # 4. Valid computed HMAC-SHA256 signature -> 200 OK (idempotent duplicate)
            raw_json = b'{"status": "SUCCESS", "amount": 50000.0, "bankReferenceNumber": "SPOOF_UTR_999", "decentroTxnId": "DEC_FAKE_TXN"}'
            valid_hmac = hmac.new(secret.encode("utf-8"), raw_json, hashlib.sha256).hexdigest()
            res_valid_hmac = await client.post(
                "/api/webhooks/decentro/collections",
                content=raw_json,
                headers={"x-decentro-signature": valid_hmac, "Content-Type": "application/json"}
            )
            assert res_valid_hmac.status_code in (200, 201), f"Expected 200, got {res_valid_hmac.status_code}"

        print("[Spoofing Guard] PASSED: 401 Unauthorized enforced against fake/tampered webhooks.")
    finally:
        decentro_module.DECENTRO_WEBHOOK_SECRET = orig_secret


def test_duplicate_utr_manual_entry_block():
    """
    Scenario 5: Duplicate UTR Manual Entry Block
    A cashier enters a sales invoice with a 12-digit UTR from a UPI payment.
    When staff later tries to manually enter the exact same UTR into a second invoice,
    the ERP immediately rejects it with HTTP 400 Bad Request to prevent reusing screenshots.
    """
    client = TestClient(app)
    db = SessionLocal()
    prod = db.query(Product).first()
    prod_id = prod.id
    db.close()

    shared_utr = f"UTR{uuid.uuid4().int >> 88}"[:12]

    inv1_no = client.get("/api/v1/sales/next-invoice-no").json()["next_invoice_no"]
    payload_1 = {
        "invoice_no": inv1_no,
        "date": "2026-10-25",
        "customer_name": "Customer One",
        "sub_total": 5000.0,
        "grand_total": 5900.0,
        "paid_amount": 5900.0,
        "balance_due": 0.0,
        "payment_mode": "UPI",
        "utr_number": shared_utr,
        "items": [
            {
                "product_id": prod_id,
                "product_name": "Coffee Table",
                "qty": 1.0,
                "rate": 5000.0,
                "taxable_amount": 5000.0,
                "cgst_percent": 9.0,
                "sgst_percent": 9.0,
                "cgst_amount": 450.0,
                "sgst_amount": 450.0,
                "total": 5900.0
            }
        ]
    }

    # Invoice 1 with UTR succeeds
    res1 = client.post("/api/v1/sales/", json=payload_1)
    assert res1.status_code in (200, 201), f"Invoice 1 failed: {res1.text}"
    print(f"\n[Duplicate UTR Block] Invoice 1 created successfully with UTR '{shared_utr}'")

    # Invoice 2 attempted with the EXACT SAME UTR
    inv2_no = client.get("/api/v1/sales/next-invoice-no").json()["next_invoice_no"]
    payload_2 = {
        "invoice_no": inv2_no,
        "date": "2026-10-25",
        "customer_name": "Customer Two (Fraud attempt)",
        "sub_total": 5000.0,
        "grand_total": 5900.0,
        "paid_amount": 5900.0,
        "balance_due": 0.0,
        "payment_mode": "UPI",
        "utr_number": shared_utr,
        "items": [
            {
                "product_id": prod_id,
                "product_name": "Coffee Table",
                "qty": 1.0,
                "rate": 5000.0,
                "taxable_amount": 5000.0,
                "cgst_percent": 9.0,
                "sgst_percent": 9.0,
                "cgst_amount": 450.0,
                "sgst_amount": 450.0,
                "total": 5900.0
            }
        ]
    }

    res2 = client.post("/api/v1/sales/", json=payload_2)
    assert res2.status_code == 400, f"Expected 400 Bad Request for duplicate UTR, got: {res2.status_code} ({res2.text})"
    err_msg = res2.json().get("detail", "")
    assert "Duplicate UTR Entry Blocked" in err_msg, f"Expected Duplicate UTR error detail, got: {err_msg}"
    print(f"[Duplicate UTR Block] PASSED: Reusing UTR '{shared_utr}' was blocked with HTTP 400 Bad Request.")
