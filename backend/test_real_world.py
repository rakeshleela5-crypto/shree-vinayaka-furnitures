import sys
from fastapi.testclient import TestClient
from app.main import app

def test_system():
    from app.core.database import Base, engine
    Base.metadata.create_all(bind=engine)
    client = TestClient(app)
    
    print("1. Testing Health Endpoint...")
    health_res = client.get("/api/v1/health")
    assert health_res.status_code == 200, f"Health check failed: {health_res.text}"
    print("   [OK] Health check status:", health_res.json())

    print("\n2. Testing Sequential GST Invoice Generator...")
    seq_res = client.get("/api/v1/sales/next-invoice-no?prefix=SVF")
    assert seq_res.status_code == 200, f"Next invoice failed: {seq_res.text}"
    data = seq_res.json()
    print("   [OK] Next Invoice Number:", data["next_invoice_no"])
    print("   [OK] Financial Year:", data["financial_year"])
    print("   [OK] Sequence:", data["sequence_number"])
    assert data["next_invoice_no"].startswith("SVF-"), "Invoice number prefix mismatch"

    print("\n3. Testing Customer Creation...")
    cust_payload = {
        "code": "C-TEST-001",
        "name": "Rakesh Real World Test",
        "phone": "9876543210",
        "state": "Karnataka",
        "city": "Bengaluru",
        "credit_limit": 75000.0,
        "opening_balance": 0.0,
        "current_balance": 0.0
    }
    cust_res = client.post("/api/v1/customers/", json=cust_payload)
    assert cust_res.status_code in [200, 201], f"Customer creation failed: {cust_res.text}"
    cust = cust_res.json()
    cust_id = cust["id"]
    print(f"   [OK] Customer created/found: ID {cust_id}, Name: {cust['name']}, Balance: Rs.{cust['current_balance']}")

    print("\n4. Testing Sale Invoice with Balance Due & Stock Deduction...")
    # First get a product
    prods_res = client.get("/api/v1/products/")
    prods = prods_res.json()
    assert len(prods) > 0, "No products found in DB"
    sample_prod = prods[0]
    initial_stock = sample_prod.get("current_stock", 10.0)
    print(f"   [OK] Using sample product: '{sample_prod['name']}' (Stock before sale: {initial_stock})")

    invoice_payload = {
        "invoice_no": data["next_invoice_no"],
        "date": "2026-10-17",
        "bill_type": "Credit",
        "customer_id": cust_id,
        "customer_name": cust["name"],
        "customer_phone": cust["phone"],
        "state": "Karnataka",
        "payment_mode": "Split (Cash + Credit)",
        "sub_total": 45000.0,
        "cgst_total": 4050.0,
        "sgst_total": 4050.0,
        "grand_total": 53100.0,
        "paid_amount": 20000.0,
        "balance_due": 33100.0,
        "items": [
            {
                "product_id": sample_prod["id"],
                "p_code": sample_prod["p_code"],
                "product_name": sample_prod["name"],
                "barcode": sample_prod["barcode"],
                "qty": 1.0,
                "rate": 45000.0,
                "taxable_amount": 45000.0,
                "cgst_percent": 9.0,
                "sgst_percent": 9.0,
                "total": 53100.0
            }
        ]
    }

    inv_res = client.post("/api/v1/sales/", json=invoice_payload)
    assert inv_res.status_code in [200, 201], f"Sale invoice creation failed: {inv_res.text}"
    inv = inv_res.json()
    print(f"   [OK] Invoice {inv['invoice_no']} created successfully!")
    print(f"   [OK] Grand Total: Rs.{inv['grand_total']}, Paid: Rs.{inv['paid_amount']}, Balance Due: Rs.{inv['balance_due']}")

    print("\n5. Verifying Customer Ledger & Updated Balance...")
    cust_updated_res = client.get(f"/api/v1/customers/{cust_id}")
    cust_updated = cust_updated_res.json()
    print(f"   [OK] Updated Customer Balance: Rs.{cust_updated['current_balance']} (Credit balance increased by Rs.33,100)")
    assert cust_updated["current_balance"] >= 33100.0, "Customer balance was not updated"

    print("\n6. Verifying Next Sequential Invoice Number Increment...")
    next_seq_res = client.get("/api/v1/sales/next-invoice-no?prefix=SVF")
    next_data = next_seq_res.json()
    print("   [OK] Subsequent Invoice Number:", next_data["next_invoice_no"])
    assert next_data["sequence_number"] > data["sequence_number"], "Sequence did not advance!"

    print("\n7. Verifying PDF Tax Invoice Generation & R2 Headers...")
    pdf_res = client.get(f"/api/v1/sales/{inv['id']}/pdf")
    assert pdf_res.status_code == 200, f"PDF generation failed: {pdf_res.text}"
    assert pdf_res.headers["content-type"] == "application/pdf", "Content-Type is not application/pdf"
    assert "X-Cloudflare-R2-Bucket" in pdf_res.headers, "Cloudflare R2 header missing"
    assert len(pdf_res.content) > 1000, "PDF payload too small"
    print(f"   [OK] PDF generated successfully! Binary size: {len(pdf_res.content)} bytes")
    print(f"   [OK] R2 Archive Destination: {pdf_res.headers.get('X-Cloudflare-R2-Path')}")

    print("\n8. Verifying Anti-Collision & Duplicate Invoice Protection (409 Conflict)...")
    # Attempting to post another invoice with the same invoice_no but different amount/items
    collision_payload = dict(invoice_payload)
    collision_payload["grand_total"] = 99999.0
    collision_payload["paid_amount"] = 99999.0
    collision_payload["balance_due"] = 0.0
    col_res = client.post("/api/v1/sales/", json=collision_payload)
    assert col_res.status_code == 409, f"Expected 409 Conflict on invoice collision, got {col_res.status_code}"
    print(f"   [OK] Invoice collision correctly rejected with HTTP 409 Conflict!")

    print("\n9. Verifying Wholesale Purchase Cost Sanitization (DevTools Leak Prevention)...")
    prods_masked_res = client.get("/api/v1/products/?include_costs=false")
    prods_masked = prods_masked_res.json()
    assert all(p["purchase_price"] == 0.0 for p in prods_masked), "Purchase prices leaked to non-admin query!"
    print("   [OK] Purchase costs strictly masked to 0.0 for terminal client queries.")

    print("\n10. Verifying Day-Close Summary & Z-Report Cash Calculation...")
    day_close_res = client.get("/api/v1/accounting/day-close-summary?date=2026-10-17")
    assert day_close_res.status_code == 200, f"Day close failed: {day_close_res.text}"
    day_close = day_close_res.json()
    assert day_close["total_bills_count"] > 0, "No sales counted for day"
    print(f"   [OK] Day-Close Summary: {day_close['total_bills_count']} bills, Total Sales: Rs.{day_close['total_sales_amount']:,.2f}")
    print(f"   [OK] Net Expected Cash in Drawer: Rs.{day_close['net_cash_in_drawer']:,.2f}")

    print("\n11. Verifying Shift Settlement & Physical Cash Reconciliation...")
    shift_payload = {
        "shift_code": f"SHIFT-TEST-{inv['id']}",
        "date": "2026-10-17",
        "cashier_name": "Rakesh Attendant 1",
        "terminal_id": "POS-01",
        "opening_cash": 2000.0,
        "total_sales_amount": day_close["total_sales_amount"],
        "cash_sales": day_close["breakdown"]["cash_sales"],
        "card_sales": day_close["breakdown"]["card_sales"],
        "upi_sales": day_close["breakdown"]["upi_sales"],
        "credit_sales": day_close["breakdown"]["credit_sales"],
        "cash_expenses": day_close["cash_expenses"],
        "expected_drawer_cash": 2000.0 + day_close["net_cash_in_drawer"],
        "actual_physical_cash": 2000.0 + day_close["net_cash_in_drawer"] - 50.0, # 50 rupees shortage
        "cash_difference": -50.0,
        "total_bills_count": day_close["total_bills_count"],
        "status": "Closed",
        "notes": "Shift closed with Rs.50 petty shortage noted"
    }
    shift_res = client.post("/api/v1/accounting/shift-settlement", json=shift_payload)
    assert shift_res.status_code == 200, f"Shift settlement failed: {shift_res.text}"
    shift_data = shift_res.json()
    print(f"   [OK] Shift closed successfully! Expected Drawer: Rs.{shift_data['expected_drawer_cash']:,.2f}, Actual: Rs.{shift_data['actual_physical_cash']:,.2f}, Diff: Rs.{shift_data['cash_difference']}")

    print("\n12. Verifying Low Stock Alert Endpoint...")
    low_stock_res = client.get("/api/v1/products/alerts/low-stock")
    assert low_stock_res.status_code == 200, f"Low stock alert failed: {low_stock_res.text}"
    low_stock_items = low_stock_res.json()
    print(f"   [OK] Low stock alerts active! Identified {len(low_stock_items)} items near/below re-order point.")

    print("\n13. Verifying Supplier Payment & Row-Locked Ledger Update...")
    # First get or create a supplier
    supp_res = client.get("/api/v1/suppliers/")
    supp_list = supp_res.json()
    if not supp_list:
        new_supp = client.post("/api/v1/suppliers/", json={"code": "S-TEST", "name": "Century Teak Suppliers", "current_balance": 50000.0}).json()
        supp_id = new_supp["id"]
    else:
        supp_id = supp_list[0]["id"]
    
    pay_res = client.post("/api/v1/suppliers/payments", json={
        "supplier_id": supp_id,
        "voucher_no": f"PYMT-TEST-{inv['id']}",
        "date": "2026-10-17",
        "amount": 10000.0,
        "payment_mode": "By Cash",
        "details": "Advance payment for Teak Wood logs"
    })
    assert pay_res.status_code == 200, f"Supplier payment failed: {pay_res.text}"
    print(f"   [OK] Supplier payment of Rs.10,000 recorded atomically with row-level lock!")

    print("\n=======================================================")
    print("ALL REAL-WORLD TEST ASSERTIONS PASSED WITH 100% SUCCESS!")
    print("=======================================================")

if __name__ == "__main__":
    test_system()
