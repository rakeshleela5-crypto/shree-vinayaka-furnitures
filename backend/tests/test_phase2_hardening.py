"""
backend/test_phase2_hardening.py
Automated Verification Suite for Phase 2: MODULE 1 & MODULE 8.
Features:
- Idempotency Keys (#1)
- Timeouts, Retries, Exponential Backoff & Circuit Breaker (#10, #11, #12, #13)
- HMAC Webhook Verification & Dead Letter Queue (#17, #35, #38, #39)
- Immutable Financial Audit Logs (#105)
- Structured Logging, Slow Query Tracking & Incident Alerts (#92, #100, #103, #104, #109)
"""
import sys
import os
import time
import uuid
import hmac
import hashlib
import json
import unittest

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.core.database import SessionLocal, engine, Base
from app.models.product import Product
from app.models.customer import Customer
from app.models.sale import SaleInvoice, PaymentTransaction
from app.models.audit import IdempotencyKey, DeadLetterWebhook, AuditLog
from app.services.decentro_circuit_breaker import decentro_circuit_breaker, DECENTRO_TIMEOUT
from app.services.alert_service import trigger_incident_alert
from app.api.v1.endpoints import decentro as decentro_mod


class Phase2HardeningTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)
        cls.db: Session = SessionLocal()

        # Seed test customer and product if not present
        cls.customer = cls.db.query(Customer).filter(Customer.id == 1).first()
        if not cls.customer:
            cls.customer = Customer(
                name="Test Cash Customer",
                phone="9876543210",
                current_balance=5000.0
            )
            cls.db.add(cls.customer)
            cls.db.commit()
            cls.db.refresh(cls.customer)

        cls.product = cls.db.query(Product).filter(Product.id == 1).first()
        if not cls.product:
            cls.product = Product(
                name="Test Wooden Wardrobe",
                p_code="PRD-PHASE2-TEST",
                barcode="BC-PHASE2-TEST",
                current_stock=25.0,
                physical_stock=25.0,
                godown_available_qty=25.0,
                retail_price=12000.0,
                mrp=14000.0,
                version=1
            )
            cls.db.add(cls.product)
            cls.db.commit()
            cls.db.refresh(cls.product)

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def setUp(self):
        decentro_circuit_breaker.force_reset()
        self.customer = self.db.query(Customer).filter(Customer.id == 1).first()
        if self.customer:
            self.customer.current_balance = 5000.0
            self.db.commit()
            self.db.refresh(self.customer)

    # -------------------------------------------------------------
    # TEST 1: Mandatory Idempotency Key Enforcement (#1)
    # -------------------------------------------------------------
    def test_01_idempotency_key_enforcement_and_reconciliation(self):
        print("\n--- Test 01: Mandatory Idempotency Key Enforcement (#1) ---")
        
        # 1. Attempt to call financial mutation WITHOUT X-Idempotency-Key -> 400 Bad Request
        qr_payload = {
            "invoice_id": 1,
            "amount": 500.0,
            "purpose_message": "Test Bill Payment"
        }
        resp = self.client.post("/api/v1/payments/decentro/upi-qr", json=qr_payload)
        self.assertEqual(resp.status_code, 400, "Financial mutation without X-Idempotency-Key must return 400 Bad Request")
        self.assertIn("X-Idempotency-Key", resp.json().get("detail", ""))

        # 2. Call WITH X-Idempotency-Key -> 200 OK, X-Idempotency-Hit: false
        test_key = f"IDEMP-TEST-{uuid.uuid4().hex[:12]}"
        headers = {"X-Idempotency-Key": test_key}
        resp1 = self.client.post("/api/v1/payments/decentro/upi-qr", json=qr_payload, headers=headers)
        self.assertEqual(resp1.status_code, 200)
        self.assertEqual(resp1.headers.get("X-Idempotency-Hit"), "false")
        data1 = resp1.json()

        # Verify key was persisted to idempotency_keys table
        key_record = self.db.query(IdempotencyKey).filter(IdempotencyKey.key == test_key).first()
        self.assertIsNotNone(key_record, "Idempotency key must be stored in database table")
        self.assertEqual(key_record.status, "COMPLETED")
        self.assertEqual(key_record.response_status, 200)

        # 3. Replay IDENTICAL request with same X-Idempotency-Key -> 200 OK, X-Idempotency-Hit: true
        resp2 = self.client.post("/api/v1/payments/decentro/upi-qr", json=qr_payload, headers=headers)
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2.headers.get("X-Idempotency-Hit"), "true")
        self.assertEqual(resp2.json()["reference_id"], data1["reference_id"])
        print(f"Verified Idempotency Guard: Cached response returned with X-Idempotency-Hit: true!")

    # -------------------------------------------------------------
    # TEST 2: In-Flight Idempotency Key Collision (409 Conflict) (#1)
    # -------------------------------------------------------------
    def test_02_idempotency_concurrent_in_progress_conflict(self):
        print("\n--- Test 02: In-Flight Idempotency Conflict (#1) ---")
        in_flight_key = f"IN-PROGRESS-{uuid.uuid4().hex[:12]}"

        # Seed an IN_PROGRESS idempotency key in DB
        from app.core.datetime_utils import get_utc_now
        from datetime import timedelta
        rec = IdempotencyKey(
            key=in_flight_key,
            endpoint="/api/v1/payments/decentro/upi-qr",
            request_hash="dummy_hash",
            status="IN_PROGRESS",
            created_at=get_utc_now(),
            expires_at=get_utc_now() + timedelta(hours=24)
        )
        self.db.add(rec)
        self.db.commit()

        # Concurrent request with same key should be rejected with 409 Conflict
        headers = {"X-Idempotency-Key": in_flight_key}
        payload = {"invoice_id": 1, "amount": 250.0}
        resp = self.client.post("/api/v1/payments/decentro/upi-qr", json=payload, headers=headers)
        self.assertEqual(resp.status_code, 409, "Concurrent request with in-progress key must return 409 Conflict")
        self.assertIn("in progress", resp.json().get("detail", "").lower())
        print("Verified: 409 Conflict returned when concurrent request uses active in-progress key!")

    # -------------------------------------------------------------
    # TEST 3: Circuit Breaker Tripping & Degraded Fallback Mode (#12, #13)
    # -------------------------------------------------------------
    def test_03_circuit_breaker_tripping_and_pos_fallback(self):
        print("\n--- Test 03: Circuit Breaker Tripping & Degraded Fallback Mode (#12, #13) ---")
        # 1. Initially circuit must be CLOSED
        self.assertEqual(decentro_circuit_breaker.state.value, "CLOSED")
        self.assertFalse(decentro_circuit_breaker.is_degraded())

        # 2. Simulate 5 consecutive 5xx failures within 60s
        for i in range(5):
            decentro_circuit_breaker.record_failure(f"Decentro 503 Gateway Error #{i+1}")

        # 3. Circuit should now be OPEN
        self.assertEqual(decentro_circuit_breaker.state.value, "OPEN")
        self.assertTrue(decentro_circuit_breaker.is_degraded())

        # 4. Outbound UPI QR request while circuit is OPEN must fast-fail into Static QR mode
        qr_payload = {"invoice_id": 1, "amount": 1000.0, "purpose_message": "POS Counter Fallback"}
        headers = {"X-Idempotency-Key": f"CB-TEST-{uuid.uuid4().hex[:8]}"}
        t0 = time.perf_counter()
        resp = self.client.post("/api/v1/payments/decentro/upi-qr", json=qr_payload, headers=headers)
        elapsed_ms = (time.perf_counter() - t0) * 1000

        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data.get("status"), "FALLBACK_STATIC_QR")
        self.assertTrue(data.get("decentro_degraded"), "Response must flag decentro_degraded: true")
        self.assertIn("upi://pay?pa=srivinayaka", data.get("upi_uri", ""))
        self.assertLess(elapsed_ms, 50, "Degraded circuit must respond in <50ms without hanging the cashier screen")

        # 5. Outbound payout request while circuit is OPEN must be blocked with 503
        payout_payload = {
            "payee_type": "SUPPLIER",
            "payee_id": 1,
            "reference_bill_no": "BILL-TEST-99",
            "amount": 5000.0,
            "beneficiary_name": "Supplier Timber Mart",
            "beneficiary_account_number": "1234567890",
            "beneficiary_ifsc": "SBIN0001234"
        }
        payout_headers = {
            "X-Idempotency-Key": f"PAYOUT-CB-{uuid.uuid4().hex[:8]}",
            "X-Admin-Secret": "development-secret-key-change-in-production"
        }
        resp_payout = self.client.post("/api/v1/payments/decentro/payout", json=payout_payload, headers=payout_headers)
        self.assertEqual(resp_payout.status_code, 503, "Payout during OPEN circuit must be rejected with 503")
        self.assertIn("degraded", resp_payout.json().get("detail", "").lower())

        # 6. Reset circuit breaker
        reset_resp = self.client.post("/api/decentro/circuit-breaker/reset")
        self.assertEqual(reset_resp.status_code, 200)
        self.assertEqual(decentro_circuit_breaker.state.value, "CLOSED")
        print("Verified: Circuit Breaker trips OPEN on 5 failures, enables instant Static QR POS fallback, and blocks payouts with 503!")

    # -------------------------------------------------------------
    # TEST 4: Outbound Timeouts Specification Verification (#10, #11)
    # -------------------------------------------------------------
    def test_04_explicit_outbound_timeouts_configured(self):
        print("\n--- Test 04: Explicit Outbound Timeouts Configuration (#10, #11) ---")
        self.assertEqual(DECENTRO_TIMEOUT.connect, 5.0, "Outbound connect timeout must be exactly 5.0s")
        self.assertEqual(DECENTRO_TIMEOUT.read, 10.0, "Outbound read timeout must be exactly 10.0s")
        print(f"Verified: DECENTRO_TIMEOUT configured with connect={DECENTRO_TIMEOUT.connect}s, read={DECENTRO_TIMEOUT.read}s")

    # -------------------------------------------------------------
    # TEST 5: HMAC-SHA256 Webhook Verification (#17, #35)
    # -------------------------------------------------------------
    def test_05_hmac_webhook_signature_verification(self):
        print("\n--- Test 05: HMAC-SHA256 Webhook Verification (#17, #35) ---")
        secret = "test_webhook_secret_svf_2026"
        decentro_mod.DECENTRO_WEBHOOK_SECRET = secret

        payload = {
            "eventType": "COLLECTION_REQUEST",
            "status": "SUCCESS",
            "transactionAmount": 1500.0,
            "bankReferenceNumber": f"UTR-{uuid.uuid4().hex[:10].upper()}",
            "referenceId": f"SVF-INV-1-{uuid.uuid4().hex[:6]}"
        }
        body_bytes = json.dumps(payload).encode("utf-8")

        # 1. Missing signature header -> 401 Unauthorized
        resp_missing = self.client.post("/api/v1/webhooks/decentro", content=body_bytes)
        self.assertEqual(resp_missing.status_code, 401, "Webhook without signature header must return 401")

        # 2. Invalid signature header -> 401 Unauthorized
        resp_bad_sig = self.client.post(
            "/api/v1/webhooks/decentro",
            content=body_bytes,
            headers={"x-decentro-signature": "invalid_hex_digest_12345"}
        )
        self.assertEqual(resp_bad_sig.status_code, 401, "Webhook with invalid signature must return 401")

        # 3. Valid HMAC-SHA256 signature -> 200 OK
        valid_sig = hmac.new(secret.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()
        resp_valid = self.client.post(
            "/api/v1/webhooks/decentro",
            content=body_bytes,
            headers={"x-decentro-signature": valid_sig}
        )
        self.assertEqual(resp_valid.status_code, 200)
        self.assertTrue(resp_valid.json().get("acknowledged"))
        print("Verified: HMAC-SHA256 signature strictly enforced; rejects forged callbacks with 401!")

    # -------------------------------------------------------------
    # TEST 6: Dead Letter Queue (DLQ) & Admin Replay (#38, #39)
    # -------------------------------------------------------------
    def test_06_dead_letter_queue_persistence_and_admin_replay(self):
        print("\n--- Test 06: Dead Letter Queue (DLQ) & Admin Replay (#38, #39) ---")
        secret = "test_webhook_secret_svf_2026"
        decentro_mod.DECENTRO_WEBHOOK_SECRET = secret

        # Simulate a webhook with invalid/malformed database state that causes internal processing error
        utr_err = f"UTR-FAIL-{uuid.uuid4().hex[:8].upper()}"
        corrupt_payload = {
            "status": "SUCCESS",
            "transactionAmount": "INVALID_FLOAT_STRING",  # Will cause failure during decimal/float processing
            "bankReferenceNumber": utr_err,
            "referenceId": "NON_EXISTENT_REF"
        }
        body_bytes = json.dumps(corrupt_payload).encode("utf-8")
        valid_sig = hmac.new(secret.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()

        # Send corrupt webhook
        resp = self.client.post(
            "/api/v1/webhooks/decentro",
            content=body_bytes,
            headers={"x-decentro-signature": valid_sig}
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data.get("status"), "SAVED_TO_DEAD_LETTER_QUEUE", "Unprocessable webhook must be captured in Dead Letter Queue")
        dlq_id = data.get("dead_letter_id")
        self.assertIsNotNone(dlq_id)

        # Query DLQ list endpoint
        dlq_list_resp = self.client.get("/api/v1/admin/webhooks/dead-letter")
        self.assertEqual(dlq_list_resp.status_code, 200)
        dlq_items = dlq_list_resp.json()
        matching = [item for item in dlq_items if item["id"] == dlq_id]
        self.assertTrue(len(matching) > 0, "Saved DLQ entry must appear in admin DLQ list")
        self.assertEqual(matching[0]["status"], "PENDING_REPLAY")

        # Manually fix payload in DB to simulate administrator reviewing and replaying
        dlq_row = self.db.query(DeadLetterWebhook).filter(DeadLetterWebhook.id == dlq_id).first()
        fixed_payload = dict(corrupt_payload)
        fixed_payload["transactionAmount"] = 2500.0
        dlq_row.payload = json.dumps(fixed_payload)
        self.db.commit()

        # Replay via Admin Replay Endpoint (#39)
        replay_resp = self.client.post(f"/api/v1/admin/webhooks/{dlq_id}/replay")
        self.assertEqual(replay_resp.status_code, 200)
        self.assertEqual(replay_resp.json().get("status"), "SUCCESS")

        self.db.refresh(dlq_row)
        self.assertEqual(dlq_row.status, "REPLAYED", "Replayed DLQ entry must be updated to REPLAYED status")
        print(f"Verified: Failed webhook #{dlq_id} captured in DLQ and successfully replayed by Admin endpoint!")

    # -------------------------------------------------------------
    # TEST 7: Manual Bank UTR Reconciliation Endpoint (#1, #105)
    # -------------------------------------------------------------
    def test_07_manual_utr_reconciliation(self):
        print("\n--- Test 07: Manual Bank UTR Reconciliation (#1, #105) ---")
        test_utr = f"UTR-MANUAL-{uuid.uuid4().hex[:8].upper()}"
        headers = {"X-Idempotency-Key": f"RECON-{uuid.uuid4().hex[:8]}"}
        payload = {
            "utr_number": test_utr,
            "customer_id": self.customer.id,
            "amount": 1000.0,
            "notes": "Cashier verified manual bank transfer"
        }

        prev_balance = float(self.customer.current_balance or 0.0)
        resp = self.client.post("/api/v1/payments/reconcile-utr", json=payload, headers=headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data.get("status"), "SUCCESS")
        self.assertEqual(data.get("utr_number"), test_utr)

        self.db.refresh(self.customer)
        self.assertEqual(self.customer.current_balance, prev_balance - 1000.0)

        # Verify audit log was recorded
        audit = self.db.query(AuditLog).filter(
            AuditLog.action == "MANUAL_UTR_RECONCILIATION",
            AuditLog.entity_id == str(self.customer.id)
        ).order_by(AuditLog.id.desc()).first()
        self.assertIsNotNone(audit, "Manual UTR reconciliation must create an immutable audit log entry")
        print(f"Verified: Manual UTR reconciliation adjusted customer balance and created audit log #{audit.id}!")

    # -------------------------------------------------------------
    # TEST 8: Immutable Financial Audit Trail for All Events (#105)
    # -------------------------------------------------------------
    def test_08_immutable_financial_audit_trail_events(self):
        print("\n--- Test 08: Immutable Financial Audit Trail Events (#105) ---")
        
        # 1. Stock Adjustment Audit Log
        adj_payload = {
            "adjustment_code": f"ADJ-{uuid.uuid4().hex[:6].upper()}",
            "date": "2026-10-27",
            "product_id": self.product.id,
            "product_name": self.product.name or "Test Product",
            "adjustment_type": "Plus",
            "qty": 5.0,
            "reason": "Physical verification surplus"
        }
        adj_resp = self.client.post("/api/v1/inventory/stock-adjustments", json=adj_payload)
        self.assertEqual(adj_resp.status_code, 200)

        stock_audit = self.db.query(AuditLog).filter(
            AuditLog.action == "STOCK_ADJUSTMENT",
            AuditLog.entity_id == str(self.product.id)
        ).order_by(AuditLog.id.desc()).first()
        self.assertIsNotNone(stock_audit, "Stock adjustment must create an immutable AuditLog entry")

        # 2. Price Override Audit Log
        price_payload = {
            "retail_price": 13500.0,
            "version": self.product.version
        }
        price_resp = self.client.put(f"/api/v1/products/{self.product.id}", json=price_payload)
        self.assertEqual(price_resp.status_code, 200)

        price_audit = self.db.query(AuditLog).filter(
            AuditLog.action == "PRICE_OVERRIDE",
            AuditLog.entity_id == str(self.product.id)
        ).order_by(AuditLog.id.desc()).first()
        self.assertIsNotNone(price_audit, "Price override must create an immutable AuditLog entry")
        after_state = json.loads(price_audit.after_state)
        self.assertEqual(after_state.get("retail_price"), 13500.0)

        # 3. Invoice Cancellation Audit Log
        # Create a test invoice first
        inv_payload = {
            "invoice_no": f"INV-AUDIT-{uuid.uuid4().hex[:6].upper()}",
            "customer_id": self.customer.id,
            "items": [
                {
                    "product_id": self.product.id,
                    "product_name": self.product.name,
                    "qty": 1.0,
                    "rate": 13500.0,
                    "taxable_amount": 13500.0,
                    "cgst_percent": 9.0,
                    "sgst_percent": 9.0,
                    "total": 15930.0
                }
            ],
            "grand_total": 15930.0,
            "balance_due": 15930.0,
            "paid_amount": 0.0,
            "payment_mode": "Credit Khata"
        }
        inv_headers = {"X-Idempotency-Key": f"INV-KEY-{uuid.uuid4().hex[:8]}"}
        inv_resp = self.client.post("/api/v1/invoices", json=inv_payload, headers=inv_headers)
        self.assertEqual(inv_resp.status_code, 200)
        inv_data = inv_resp.json()
        invoice_id = inv_data["id"]

        # Now cancel the invoice
        cancel_resp = self.client.post(f"/api/v1/sales/{invoice_id}/cancel?reason=Wrong+Item+Selected")
        self.assertEqual(cancel_resp.status_code, 200)

        cancel_audit = self.db.query(AuditLog).filter(
            AuditLog.action == "INVOICE_CANCEL",
            AuditLog.entity_id == str(invoice_id)
        ).first()
        self.assertIsNotNone(cancel_audit, "Invoice cancellation must create an immutable AuditLog entry")

        # 4. Customer Khata Modification Audit Log
        khata_payload = {
            "customer_id": self.customer.id,
            "amount": 500.0,
            "payment_mode": "Cash",
            "remarks": "Part settlement"
        }
        khata_resp = self.client.post("/api/ledger/customer-receipt", json=khata_payload)
        self.assertEqual(khata_resp.status_code, 200)

        khata_audit = self.db.query(AuditLog).filter(
            AuditLog.action == "KHATA_MODIFICATION",
            AuditLog.entity_id == str(self.customer.id)
        ).order_by(AuditLog.id.desc()).first()
        self.assertIsNotNone(khata_audit, "Customer Khata receipt must create an immutable AuditLog entry")

        # Query all audit logs via GET /api/v1/audit/logs
        audit_list_resp = self.client.get("/api/v1/audit/logs?limit=50")
        self.assertEqual(audit_list_resp.status_code, 200)
        logs = audit_list_resp.json()
        self.assertGreaterEqual(logs["total"], 4)
        print(f"Verified all financial audit log events: STOCK_ADJUSTMENT, PRICE_OVERRIDE, INVOICE_CANCEL, KHATA_MODIFICATION (Total: {logs['total']})!")

    # -------------------------------------------------------------
    # TEST 9: Request-ID & Structured Logging Execution Timing (#92, #100)
    # -------------------------------------------------------------
    def test_09_request_id_and_execution_time_headers(self):
        print("\n--- Test 09: Request-ID & Execution Timing Middleware (#92, #100) ---")
        custom_req_id = f"custom-req-{uuid.uuid4().hex[:8]}"
        resp = self.client.get("/api/v1/products/?limit=1", headers={"X-Request-ID": custom_req_id})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.headers.get("X-Request-ID"), custom_req_id)
        self.assertIsNotNone(resp.headers.get("X-Execution-Time-Ms"))
        duration = float(resp.headers.get("X-Execution-Time-Ms"))
        self.assertGreaterEqual(duration, 0.0)

        # Autogenerated request ID when none supplied
        resp_auto = self.client.get("/api/v1/products/?limit=1")
        self.assertTrue(resp_auto.headers.get("X-Request-ID").startswith("req-"))
        print(f"Verified: X-Request-ID and X-Execution-Time-Ms ({duration}ms) injected on every response!")

    # -------------------------------------------------------------
    # TEST 10: Real-Time Incident Alert Dispatcher (#104, #109)
    # -------------------------------------------------------------
    def test_10_incident_alert_dispatcher(self):
        print("\n--- Test 10: Real-Time Incident Alert Dispatcher (#104, #109) ---")
        # Trigger an alert and verify it runs smoothly without breaking the process
        try:
            trigger_incident_alert(
                title="Test Incident: Failed Payout Simulation",
                message="Supplier bank server returned invalid IFSC format.",
                severity="CRITICAL",
                details={"payout_id": 999, "beneficiary": "Timber Suppliers"},
                request_id="test-req-123"
            )
            print("Verified: trigger_incident_alert executed successfully with structured payload and logging!")
        except Exception as e:
            self.fail(f"Incident alert dispatcher failed: {e}")


if __name__ == "__main__":
    unittest.main()
