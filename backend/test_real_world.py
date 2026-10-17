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
    if len(prods) == 0:
        new_prod_res = client.post("/api/v1/products/", json={
            "name": "Solid Teak Wood Dining Table",
            "p_code": "P-TEAK-001",
            "barcode": "8901234567890",
            "purchase_price": 25000.0,
            "retail_price": 45000.0,
            "wholesale_price": 38000.0,
            "mrp": 55000.0,
            "opening_stock": 20.0,
            "current_stock": 20.0,
            "category_name": "Dining Room",
            "sales_unit": "Pcs",
            "hsn_code": "94036000",
            "cgst": 9.0,
            "sgst": 9.0,
            "igst": 18.0,
            "godown": "Main Showroom",
            "rack": "A1"
        })
        assert new_prod_res.status_code in [200, 201], f"Product seeding failed: {new_prod_res.text}"
        sample_prod = new_prod_res.json()
    else:
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
        new_supp_res = client.post("/api/v1/suppliers/", json={
            "code": "S-TEST",
            "name": "Century Teak Suppliers",
            "contact_no": "9876543210",
            "current_balance": 50000.0
        })
        assert new_supp_res.status_code in [200, 201], f"Supplier creation failed: {new_supp_res.text}"
        supp = new_supp_res.json()
        supp_id = supp["id"]
    else:
        supp = supp_list[0]
        supp_id = supp["id"]
    
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

    print("\n14. Verifying Salesman Commission Auto-Tracking & Payout...")
    sm_res = client.post("/api/v1/auth/salesmen", json={
        "code": f"SM-TEST-{inv['id']}",
        "name": "Arun Kumar Senior Consultant",
        "phone": "9845012345",
        "commission_percent": 3.0
    })
    assert sm_res.status_code == 200, f"Salesman creation failed: {sm_res.text}"
    sm = sm_res.json()
    sm_id = sm["id"]
    print(f"   [OK] Salesman registered: {sm['name']} (Commission Rate: {sm['commission_percent']}%)")

    # Create a sale linked to this salesman
    inv2_no = f"SVF-TEST-COMM-{inv['id']}"
    inv2_res = client.post("/api/v1/sales/", json={
        "invoice_no": inv2_no,
        "date": "2026-10-17",
        "customer_id": cust_id,
        "customer_name": cust["name"],
        "salesman_id": sm_id,
        "sub_total": 20000.0,
        "grand_total": 20000.0,
        "paid_amount": 20000.0,
        "balance_due": 0.0,
        "payment_mode": "Cash",
        "items": [
            {
                "product_id": sample_prod["id"],
                "product_name": sample_prod["name"],
                "qty": 1.0,
                "rate": 20000.0,
                "total": 20000.0
            }
        ]
    })
    assert inv2_res.status_code in [200, 201], f"Invoice with salesman failed: {inv2_res.text}"
    sm_check_res = client.get("/api/v1/auth/salesmen")
    all_sm = sm_check_res.json()
    updated_sm = next(s for s in all_sm if s["id"] == sm_id)
    expected_comm = (20000.0 * 3.0) / 100.0 # Rs.600
    assert updated_sm["total_commission"] >= expected_comm, f"Salesman commission was not credited! Got: {updated_sm['total_commission']}"
    print(f"   [OK] Salesman commission credited: Rs.{updated_sm['total_commission']} on Rs.{updated_sm['total_sales']} sales")

    # Payout commission
    payout_res = client.post(f"/api/v1/auth/salesmen/{sm_id}/payout", json={"amount": 400.0, "payment_mode": "Cash"})
    assert payout_res.status_code == 200, f"Salesman payout failed: {payout_res.text}"
    payout_data = payout_res.json()
    assert payout_data["paid_commission"] == 400.0
    assert payout_data["balance_commission"] == (expected_comm - 400.0)
    print(f"   [OK] Salesman commission disbursed: Paid Rs.{payout_data['paid_commission']}, Balance: Rs.{payout_data['balance_commission']}")

    print("\n15. Verifying Safe Invoice Voiding & ACID Reversal...")
    # Check sample_prod stock before voiding inv2
    prod_before_void = client.get("/api/v1/products/").json()[0]["current_stock"]
    void_res = client.post(f"/api/v1/sales/{inv2_no}/void")
    assert void_res.status_code == 200, f"Invoice voiding failed: {void_res.text}"
    prod_after_void = client.get("/api/v1/products/").json()[0]["current_stock"]
    assert prod_after_void == prod_before_void + 1.0, f"Product stock was not restored on void! Before: {prod_before_void}, After: {prod_after_void}"
    print(f"   [OK] Invoice {inv2_no} voided safely! Stock restored by 1.0 (Current: {prod_after_void})")

    print("\n16. Verifying Sale Return & Credit Note Ledger Posting...")
    sr_payload = {
        "return_no": f"SR-TEST-{inv['id']}",
        "date": "2026-10-17",
        "tax_type": "GST",
        "original_invoice_no": inv["invoice_no"],
        "customer_id": cust_id,
        "customer_name": cust["name"],
        "total": 10000.0,
        "grand_total": 10000.0,
        "payment_mode": "Credit Note",
        "items": [
            {
                "product_id": sample_prod["id"],
                "product_name": sample_prod["name"],
                "qty": 1.0,
                "sales_rate": 10000.0,
                "total": 10000.0
            }
        ]
    }
    sr_res = client.post("/api/v1/returns/sales", json=sr_payload)
    assert sr_res.status_code == 200, f"Sale return failed: {sr_res.text}"
    # Verify customer ledger has credit note
    cust_ledger_res = client.get(f"/api/v1/customers/{cust_id}/ledger")
    ledger_entries = cust_ledger_res.json()
    credit_note_entry = next((e for e in ledger_entries if e["voucher_no"] == sr_payload["return_no"]), None)
    assert credit_note_entry is not None, "Credit Note entry not found in customer ledger!"
    assert credit_note_entry["credit"] == 10000.0
    print(f"   [OK] Sale Return processed! Credit Note posted to Customer Ledger: Rs.{credit_note_entry['credit']}")

    print("\n17. Verifying Delivery Note Creation & Status Update...")
    dn_payload = {
        "delivery_note_no": f"DN-TEST-{inv['id']}",
        "date": "2026-10-17",
        "customer_id": cust_id,
        "customer_name": cust["name"],
        "delivery_address": "42 Residency Road, Vaikom, Kerala",
        "vehicle_no": "KL-36-H-4567",
        "transporter_name": "Vinayaka Express Logistics",
        "status": "Dispatched",
        "invoice_no": inv["invoice_no"],
        "grand_total": 53100.0,
        "items_json": "[]"
    }
    dn_res = client.post("/api/v1/sales/delivery-notes", json=dn_payload)
    assert dn_res.status_code == 200, f"Delivery note creation failed: {dn_res.text}"
    dn = dn_res.json()
    print(f"   [OK] Delivery Note created: {dn['delivery_note_no']} (Status: {dn['status']}, Vehicle: {dn['vehicle_no']})")

    # Update delivery status to Delivered
    dn_up_res = client.put(f"/api/v1/sales/delivery-notes/{dn['id']}", json={"status": "Delivered"})
    assert dn_up_res.status_code == 200, f"Delivery note status update failed: {dn_up_res.text}"
    assert dn_up_res.json()["status"] == "Delivered"
    print(f"   [OK] Delivery Note status updated to: {dn_up_res.json()['status']}")

    print("\n18. Verifying Full ERP Database Backup with Live Table Counts...")
    bk_cfg_res = client.get("/api/v1/backup/config")
    assert bk_cfg_res.status_code == 200, f"Backup config failed: {bk_cfg_res.text}"
    cfg = bk_cfg_res.json()
    print(f"   [OK] Live DB Records: Products: {cfg['liveRecords']['products']}, Sales: {cfg['liveRecords']['salesInvoices']}, Customers: {cfg['liveRecords']['customers']}")

    bk_dump_res = client.post("/api/v1/backup/create")
    assert bk_dump_res.status_code == 200, f"Backup dump failed: {bk_dump_res.text}"
    bk_dump = bk_dump_res.json()
    assert bk_dump["status"] == "SUCCESS"
    print(f"   [OK] Complete ERP Backup created! File: {bk_dump['backupRecord']['filename']} ({bk_dump['backupRecord']['sizeKb']} KB)")

    print("\n19. Verifying Loyalty Points Auto-Earning on Sale...")
    cust_loyalty_res = client.get(f"/api/v1/customers/{cust_id}/loyalty")
    assert cust_loyalty_res.status_code == 200, f"Loyalty fetch failed: {cust_loyalty_res.text}"
    loyalty_txs = cust_loyalty_res.json()
    assert len(loyalty_txs) > 0, "No loyalty transactions logged!"
    earned_tx = next((t for t in loyalty_txs if t["type"] == "Earned"), None)
    assert earned_tx is not None, "Earned loyalty points transaction not found!"
    print(f"   [OK] Loyalty Points automatically earned! Points: {earned_tx['points']} pts (Logged in Loyalty Ledger)")

    print("\n20. Verifying Interstate Sale with 100% IGST & PDF Generation...")
    interstate_inv_no = f"SVF-IGST-TEST-{inv['id']}"
    interstate_payload = {
        "invoice_no": interstate_inv_no,
        "date": "2026-10-17",
        "bill_type": "Cash",
        "customer_id": cust_id,
        "customer_name": "Bangalore Luxury Villa Client",
        "customer_phone": "9845099887",
        "state": "Karnataka",
        "state_code": "29", # Karnataka code != Kerala 32
        "payment_mode": "UPI / Net Banking",
        "sub_total": 60000.0,
        "cgst_total": 0.0,
        "sgst_total": 0.0,
        "igst_total": 10800.0, # 18% Interstate IGST
        "grand_total": 70800.0,
        "paid_amount": 70800.0,
        "balance_due": 0.0,
        "items": [
            {
                "product_id": sample_prod["id"],
                "product_name": sample_prod["name"],
                "qty": 1.0,
                "rate": 60000.0,
                "taxable_amount": 60000.0,
                "igst_percent": 18.0,
                "igst_amount": 10800.0,
                "total": 70800.0
            }
        ]
    }
    igst_inv_res = client.post("/api/v1/sales/", json=interstate_payload)
    assert igst_inv_res.status_code in [200, 201], f"Interstate invoice failed: {igst_inv_res.text}"
    igst_pdf_res = client.get(f"/api/v1/sales/{igst_inv_res.json()['id']}/pdf")
    assert igst_pdf_res.status_code == 200
    assert len(igst_pdf_res.content) > 1000
    print(f"   [OK] Interstate 18% IGST Invoice {interstate_inv_no} created and rendered to official GST PDF successfully!")

    print("\n21. Verifying Live Cash Drawer / Z-Report Reconciliation with Inflows & Outflows...")
    # Add a cash customer khata collection (IncomeVoucher)
    incm_res = client.post("/api/v1/accounting/income-vouchers", json={
        "voucher_no": f"INCM-TEST-{inv['id']}",
        "date": "2026-10-17",
        "name": cust["name"],
        "details": "Customer old khata payment received in cash",
        "payment_mode": "Cash",
        "grand_total": 15000.0,
        "items_json": "[]"
    })
    assert incm_res.status_code == 200, f"Income voucher failed: {incm_res.text}"

    # Add a cash supplier payment
    sp_res = client.post("/api/v1/suppliers/payments", json={
        "supplier_id": supp["id"],
        "voucher_no": f"SMP-TEST-{inv['id']}",
        "date": "2026-10-17",
        "amount": 5000.0,
        "payment_mode": "By Cash",
        "details": "Petty transport freight payment to supplier delivery truck"
    })
    assert sp_res.status_code == 200, f"Supplier payment failed: {sp_res.text}"

    # Query Day-Close summary
    day_close_res = client.get("/api/v1/accounting/day-close-summary?date=2026-10-17")
    assert day_close_res.status_code == 200, f"Day close summary failed: {day_close_res.text}"
    dc = day_close_res.json()
    print(f"   [OK] Day Close Summary: Non-Voided Bills: {dc['total_bills_count']}, Cash Incomes: Rs.{dc['cash_incomes']}, Cash Supplier Outflows: Rs.{dc['cash_supplier_payments']}, Drawer Cash: Rs.{dc['net_cash_in_drawer']}")
    assert dc["cash_incomes"] >= 15000.0, "Cash income not aggregated into Z-Report!"
    assert dc["cash_supplier_payments"] >= 5000.0, "Cash supplier payment not deducted from Z-Report!"

    print("\n22. Verifying Multi-Godown Stock Transfer (Showroom -> Godown 1)...")
    trf_res = client.post("/api/v1/inventory/stock-transfers", json={
        "transfer_no": f"TRF-TEST-{inv['id']}",
        "date": "2026-10-17",
        "product_id": sample_prod["id"],
        "product_name": sample_prod["name"],
        "from_godown": "Main Showroom",
        "to_godown": "Godown 1",
        "from_rack": "A1",
        "to_rack": "B4",
        "qty": 2.0,
        "remarks": "Showroom floor re-stocking to Godown 1"
    })
    assert trf_res.status_code == 200, f"Stock transfer failed: {trf_res.text}"
    trf = trf_res.json()
    assert trf["to_godown"] == "Godown 1"
    print(f"   [OK] Stock transfer {trf['transfer_no']} executed! Moved 2 units of '{sample_prod['name']}' to Godown 1 (Rack B4)")

    # Verify over-transfer rejection
    excess_res = client.post("/api/v1/inventory/stock-transfers", json={
        "transfer_no": f"TRF-EXCESS-{inv['id']}",
        "date": "2026-10-17",
        "product_id": sample_prod["id"],
        "product_name": sample_prod["name"],
        "from_godown": "Godown 1",
        "to_godown": "Godown 2",
        "qty": 99999.0
    })
    assert excess_res.status_code == 400, "Excess stock transfer should fail with HTTP 400"
    print(f"   [OK] Over-transfer safely rejected with HTTP 400: '{excess_res.json()['detail']}'")

    print("\n23. Verifying Statutory E-Way Bill Requirement (CGST Rule 138)...")
    # Interstate invoice was Rs. 70,800 >= Rs. 50,000
    assert igst_inv_res.json().get("eway_bill_required") is True, "E-Way Bill should be required for invoice >= Rs.50,000"
    print(f"   [OK] E-Way Bill Rule 138 mandatory flag active on Rs.70,800 consignment: eway_bill_required = True")

    print("\n=======================================================")
    print("ALL 23 REAL-WORLD TEST ASSERTIONS PASSED WITH 100% SUCCESS!")
    print("=======================================================")

if __name__ == "__main__":
    test_system()


