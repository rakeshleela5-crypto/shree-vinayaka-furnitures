import sys
import uuid
from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app

def test_decentro_engine():
    client = TestClient(app).__enter__()
    
    print("=" * 60)
    print("DECENTRO FINANCIAL ENGINE COMPREHENSIVE TEST SUITE")
    print("=" * 60)

    # 1. Test Decentro Config endpoint
    print("\n1. Testing Decentro Config & Readiness Diagnostic...")
    cfg_res = client.get("/api/decentro/config")
    assert cfg_res.status_code == 200, f"Config failed: {cfg_res.text}"
    cfg = cfg_res.json()
    print(f"   [OK] Decentro Config Status: {cfg['status']} (Base URL: {cfg['base_url']}, Store State: {cfg['store_state_code']})")

    # 2. Test GSTIN KYB Verification & Odisha (21) Tax Rule Engine
    print("\n2. Testing GSTIN KYB Verification & State Tax Rule Engine...")
    # Odisha GSTIN (State 21)
    odisha_gst_res = client.post("/api/decentro/kyb/gstin", json={"gstin": "21AABCS1429B1Z8"})
    assert odisha_gst_res.status_code == 200, f"Odisha GST verification failed: {odisha_gst_res.text}"
    odisha_data = odisha_gst_res.json()
    assert odisha_data["tax_regime"] == "INTRA_STATE_CGST_SGST", f"Expected INTRA_STATE_CGST_SGST, got: {odisha_data['tax_regime']}"
    assert odisha_data["cgst_rate"] == 9.0 and odisha_data["sgst_rate"] == 9.0 and odisha_data["igst_rate"] == 0.0
    print(f"   [OK] Odisha (21) GSTIN auto-routed to INTRA-STATE CGST 9% + SGST 9% (Regime: {odisha_data['tax_regime']})")

    # Interstate GSTIN (State 29 Karnataka)
    interstate_gst_res = client.post("/api/decentro/kyb/gstin", json={"gstin": "29AABCS1429B1Z8"})
    assert interstate_gst_res.status_code == 200, f"Interstate GST verification failed: {interstate_gst_res.text}"
    interstate_data = interstate_gst_res.json()
    assert interstate_data["tax_regime"] == "INTER_STATE_IGST", f"Expected INTER_STATE_IGST, got: {interstate_data['tax_regime']}"
    assert interstate_data["igst_rate"] == 18.0 and interstate_data["cgst_rate"] == 0.0
    print(f"   [OK] Interstate (29) GSTIN auto-routed to INTER-STATE IGST 18% (Regime: {interstate_data['tax_regime']})")

    # Invalid GSTIN format
    inv_gst_res = client.post("/api/decentro/kyb/gstin", json={"gstin": "INVALID123"})
    assert inv_gst_res.status_code == 422, "Invalid GSTIN format should fail with 422 validation error"
    print(f"   [OK] Invalid GSTIN format correctly rejected with HTTP 422 Unprocessable Entity")

    # 3. Setup Customer and Invoice for Decentro Collections
    print("\n3. Setting up Customer and Invoice for Dynamic QR & Virtual Account...")
    cust_code = f"CUST-DEC-{uuid.uuid4().hex[:6].upper()}"
    cust_phone = f"98{uuid.uuid4().int % 100000000:08d}"
    cust_res = client.post("/api/v1/customers/", json={
        "code": cust_code,
        "name": f"Maharana Furniture Traders ({cust_code[-4:]})",
        "phone": cust_phone,
        "state": "Odisha",
        "city": "Rayagada",
        "credit_limit": 200000.0,
        "current_balance": 0.0
    })
    assert cust_res.status_code in (200, 201), f"Customer setup failed: {cust_res.text}"
    cust = cust_res.json()
    cust_id = cust["id"]

    prods = client.get("/api/v1/products/").json()
    prod_id = prods[0]["id"]

    next_inv = client.get("/api/v1/sales/next-invoice-no").json()["next_invoice_no"]

    inv_res = client.post("/api/v1/sales/", json={
        "invoice_no": next_inv,
        "date": "2026-10-20",
        "customer_id": cust_id,
        "customer_name": cust["name"],
        "sub_total": 40000.0,
        "cgst_total": 3600.0,
        "sgst_total": 3600.0,
        "grand_total": 47200.0,
        "paid_amount": 0.0,
        "balance_due": 47200.0,
        "items": [
            {
                "product_id": prod_id,
                "product_name": "Premium Sheesham Dining Set",
                "qty": 1.0,
                "rate": 40000.0,
                "taxable_amount": 40000.0,
                "cgst_percent": 9.0,
                "sgst_percent": 9.0,
                "cgst_amount": 3600.0,
                "sgst_amount": 3600.0,
                "total": 47200.0
            }
        ]
    })
    assert inv_res.status_code in (200, 201), f"Invoice creation failed: {inv_res.text}"
    inv = inv_res.json()
    inv_id = inv["id"]
    print(f"   [OK] Customer ID {cust_id} and Invoice ID {inv_id} (Grand Total: Rs.{inv['grand_total']}, Balance: Rs.{inv['balance_due']}) created")

    # Create a Delivery Note linked to this invoice for COD testing
    dn_res = client.post("/api/v1/sales/delivery-notes", json={
        "delivery_note_no": f"DN-DEC-{inv_id}",
        "date": "2026-10-20",
        "customer_id": cust_id,
        "customer_name": cust["name"],
        "delivery_address": "Main Road, Rayagada, Odisha",
        "status": "Dispatched",
        "invoice_no": inv["invoice_no"],
        "grand_total": 47200.0,
        "items_json": "[]"
    })
    assert dn_res.status_code == 200, f"Delivery note creation failed: {dn_res.text}"
    dn = dn_res.json()
    dn_id = dn["id"]
    print(f"   [OK] Delivery Note ID {dn_id} created for Doorstep COD tracking")

    # 4. Test Dynamic UPI QR Generation
    print("\n4. Testing Dynamic UPI QR Generation for POS Split-Tender & Doorstep COD...")
    qr_payload = {
        "invoice_id": inv_id,
        "delivery_order_id": dn_id,
        "amount": 20000.0,
        "purpose_message": f"Settlement for Inv {inv['invoice_no']}",
        "expiry_minutes": 15
    }
    qr_res = client.post("/api/decentro/collections/upi-qr", json=qr_payload)
    assert qr_res.status_code == 200, f"Dynamic QR generation failed: {qr_res.text}"
    qr_data = qr_res.json()
    assert qr_data["status"] == "PENDING"
    assert qr_data["upi_uri"].startswith("upi://pay?")
    assert qr_data["reference_id"].startswith(f"SVF-QR-{inv_id}-")
    print(f"   [OK] Dynamic UPI QR Generated! Reference ID: {qr_data['reference_id']}, URI: {qr_data['upi_uri'][:40]}...")

    # 5. Test Virtual Account Creation for High-Value Orders & Khata
    print("\n5. Testing Dedicated Virtual Account Creation (YESB/ICIC)...")
    va_payload = {
        "customer_id": cust_id,
        "name": cust["name"],
        "pan": "ABCDE1234F",
        "mobile": "9876543299",
        "address": "Gandhi Nagar, Rayagada, Odisha",
        "city": "Rayagada",
        "state_code": 21,
        "pincode": 765001
    }
    va_res = client.post("/api/decentro/banking/virtual-account", json=va_payload)
    assert va_res.status_code == 200, f"Virtual account creation failed: {va_res.text}"
    va_data = va_res.json()
    assert va_data["status"] == "SUCCESS"
    assert va_data["virtual_account_number"] is not None
    assert va_data["ifsc"] is not None
    print(f"   [OK] Virtual Account Issued! Bank: {va_data['bank_name']}, Account No: {va_data['virtual_account_number']}, IFSC: {va_data['ifsc']}, UPI ID: {va_data['upi_id']}")

    # 6. Test Supplier / Transporter / Carpenter Payout with Double-Entry Journal
    print("\n6. Testing Vendor / Carpenter Payout Initiation with Balanced Double-Entry Journal...")
    supp = client.get("/api/v1/suppliers/").json()[0]
    payout_payload = {
        "payee_type": "SUPPLIER",
        "payee_id": supp["id"],
        "reference_bill_no": "BILL-TEAK-2026-99",
        "amount": 15000.0,
        "beneficiary_name": supp["name"],
        "beneficiary_account_number": "912010045678912",
        "beneficiary_ifsc": "UTIB0001234",
        "transfer_type": "IMPS",
        "verify_penny_drop_first": False
    }
    payout_res = client.post("/api/decentro/payouts/initiate", json=payout_payload)
    assert payout_res.status_code == 200, f"Payout initiation failed: {payout_res.text}"
    payout_data = payout_res.json()
    assert payout_data["status"] == "SUCCESS"
    assert payout_data["reference_id"].startswith("SVF-PAYOUT-SUP-")
    print(f"   [OK] Payout Initiated! Ref: {payout_data['reference_id']}, UTR: {payout_data['bank_reference_number']}, Amount: Rs.{payout_data['amount']}")

    # 7. Test Webhook Callbacks: Dynamic UPI QR Completion
    print("\n7. Testing Decentro Webhook: Dynamic UPI QR Payment Reconciled...")
    qr_webhook_payload = {
        "status": "SUCCESS",
        "decentroTxnId": qr_data["decentro_txn_id"],
        "referenceId": qr_data["reference_id"],
        "amount": 20000.0,
        "bankReferenceNumber": f"NPCI{uuid.uuid4().hex[:10].upper()}",
        "transactionStatus": "SUCCESS"
    }
    wh_qr_res = client.post("/api/decentro/webhooks/callbacks", json=qr_webhook_payload)
    assert wh_qr_res.status_code == 200, f"QR webhook failed: {wh_qr_res.text}"
    assert wh_qr_res.json()["status"] == "RECONCILED"

    # Verify invoice paid_amount increased & balance_due decreased
    updated_inv = client.get(f"/api/v1/sales/{inv_id}").json()
    assert updated_inv["paid_amount"] == 20000.0, f"Invoice paid amount not updated! Got: {updated_inv['paid_amount']}"
    assert updated_inv["balance_due"] == 27200.0, f"Invoice balance due not reduced! Got: {updated_inv['balance_due']}"
    print(f"   [OK] Invoice {inv['invoice_no']} auto-updated: Paid Rs.{updated_inv['paid_amount']}, Balance Due: Rs.{updated_inv['balance_due']}")

    # Verify COD gatekeeper unlocked on Delivery Note
    updated_dn = client.get(f"/api/v1/sales/delivery-notes/{dn_id}").json()
    assert updated_dn["cod_collected"] == 20000.0, "Doorstep COD was not recorded on Delivery Note!"
    print(f"   [OK] Delivery Note {dn['delivery_note_no']} COD Gatekeeper unlocked: COD Collected = Rs.{updated_dn['cod_collected']} (UTR: {updated_dn['cod_utr']})")

    # Test Webhook Idempotency: Duplicate callback should return ALREADY_PROCESSED
    wh_dup_res = client.post("/api/decentro/webhooks/callbacks", json=qr_webhook_payload)
    assert wh_dup_res.status_code == 200
    assert wh_dup_res.json()["status"] == "ALREADY_PROCESSED"
    print(f"   [OK] Idempotent Webhook Guard: Replay of duplicate transaction correctly returned 'ALREADY_PROCESSED'")

    # 8. Test Webhook Callbacks: Inward Virtual Account NEFT/RTGS Transfer
    print("\n8. Testing Decentro Webhook: Inward Virtual Account Transfer (FIFO Open Invoices & Khata Reduction)...")
    va_webhook_payload = {
        "status": "SUCCESS",
        "decentroTxnId": f"DEC-VA-INWARD-{uuid.uuid4().hex[:8].upper()}",
        "referenceId": f"NEFT-{uuid.uuid4().hex[:8].upper()}",
        "payeeAccountNumber": va_data["virtual_account_number"],
        "amount": 27200.0,
        "bankReferenceNumber": f"AXIS{uuid.uuid4().hex[:10].upper()}",
        "transactionStatus": "CREDIT"
    }
    wh_va_res = client.post("/api/decentro/webhooks/callbacks", json=va_webhook_payload)
    assert wh_va_res.status_code == 200, f"VA webhook failed: {wh_va_res.text}"
    assert wh_va_res.json()["status"] == "RECONCILED"

    # Verify invoice is now fully settled (balance_due == 0)
    fully_paid_inv = client.get(f"/api/v1/sales/{inv_id}").json()
    assert fully_paid_inv["balance_due"] == 0.0, f"Expected 0 balance, got: {fully_paid_inv['balance_due']}"
    assert fully_paid_inv["status"] == "Completed"
    print(f"   [OK] Invoice {inv['invoice_no']} fully settled via Virtual Account transfer! Balance Due: Rs.{fully_paid_inv['balance_due']}, Status: {fully_paid_inv['status']}")

    # 9. Test Decentro Transactions Audit List
    print("\n9. Testing Decentro Payment Transactions Audit Ledger...")
    txns_res = client.get("/api/decentro/transactions")
    assert txns_res.status_code == 200, f"Transactions fetch failed: {txns_res.text}"
    txns = txns_res.json()
    assert len(txns) >= 1
    settled_txn = next((t for t in txns if t["reference_id"] == qr_data["reference_id"]), None)
    assert settled_txn is not None, "Settled QR transaction not found in Decentro transactions ledger!"
    assert settled_txn["status"] == "SUCCESS"
    assert settled_txn["utr_number"] is not None
    print(f"   [OK] Decentro Transactions Ledger contains settled transaction: Ref {settled_txn['reference_id']}, Status: {settled_txn['status']}, UTR: {settled_txn['utr_number']}")

    # 10. Test Double-Entry Balanced Ledger Verification
    print("\n10. Testing Live Double-Entry Ledger Balance after Decentro Inward & Outward Transactions...")
    bal_res = client.get("/api/ledger/balances")
    assert bal_res.status_code == 200, f"Ledger balances failed: {bal_res.text}"
    bals = bal_res.json()
    diff = round(abs(bals["total_debit"] - bals["total_credit"]), 2)
    assert diff <= 0.05, f"Double-entry ledger is not balanced! Debit: {bals['total_debit']}, Credit: {bals['total_credit']}, Diff: {diff}"
    print(f"   [OK] Double-Entry Ledger Equality Verified! Total Debit: Rs.{bals['total_debit']:,.2f}, Total Credit: Rs.{bals['total_credit']:,.2f}, Diff: Rs.{diff}")

    print("\n" + "=" * 60)
    print("ALL 10 DECENTRO FINANCIAL ENGINE TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 60)


if __name__ == "__main__":
    test_decentro_engine()
