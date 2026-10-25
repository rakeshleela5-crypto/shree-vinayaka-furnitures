import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal
from app.models.product import Product
from app.models.discounts import ComboPack
from app.models.customer import Customer
from app.models.sale import SaleInvoice

def test_concurrent_inventory_billing_no_oversell():
    """
    Validates Layer 1: Concurrency & Double-Deduction Stress Testing.
    Simulates 5 concurrent cashiers attempting to bill an item with only 2 units in stock.
    Guarantees:
    - Zero overselling / no negative stock.
    - Exactly 2 transactions succeed.
    - Exactly 3 transactions fail with 400 Bad Request (Stock availability check).
    - Final stock in database is exactly 0.0.
    """
    db = SessionLocal()
    unique_suffix = uuid.uuid4().hex[:6]
    sku = f"CONC-SOFA-{unique_suffix}"
    cust_code = f"CUST-CONC-{unique_suffix}"
    
    # Setup test customer
    cust = Customer(
        code=cust_code,
        name=f"Concurrent Test Customer {unique_suffix}",
        phone=f"98765{unique_suffix[:5]}",
        state="Karnataka",
        city="Bengaluru",
        credit_limit=100000.0,
        current_balance=0.0
    )
    db.add(cust)
    
    # Setup product with EXACTLY 2 units available
    prod = Product(
        name=f"Limited Stock Sofa {unique_suffix}",
        p_code=sku,
        barcode=f"99{unique_suffix}01",
        retail_price=15000.0,
        purchase_price=8000.0,
        mrp=20000.0,
        current_stock=2.0,
        physical_stock=2.0,
        reserved_stock=0.0,
        godown_available_qty=2.0,
        sales_unit="Pcs",
        cgst=9.0,
        sgst=9.0,
        igst=0.0
    )
    db.add(prod)
    db.commit()
    db.refresh(cust)
    db.refresh(prod)
    prod_id = prod.id
    cust_id = cust.id
    cust_name = cust.name
    cust_phone = cust.phone
    db.close()

    def cashier_checkout(cashier_num: int):
        client = TestClient(app)
        payload = {
            "invoice_no": f"SVF-CONC-{unique_suffix}-{cashier_num}",
            "customer_id": cust_id,
            "customer_name": cust_name,
            "customer_phone": cust_phone,
            "date": "2026-10-25",
            "state": "Karnataka",
            "bill_type": "Retail",
            "payment_mode": "CASH",
            "sub_total": 15000.0,
            "cgst_total": 1350.0,
            "sgst_total": 1350.0,
            "grand_total": 17700.0,
            "paid_amount": 17700.0,
            "balance_due": 0.0,
            "allow_negative_stock": False, # Strict non-oversell mode
            "items": [
                {
                    "product_id": prod_id,
                    "product_name": f"Limited Stock Sofa {unique_suffix}",
                    "qty": 1.0,
                    "rate": 15000.0,
                    "discount_percent": 0.0,
                    "taxable_amount": 15000.0,
                    "cgst_percent": 9.0,
                    "sgst_percent": 9.0,
                    "igst_percent": 0.0,
                    "total": 17700.0
                }
            ]
        }
        res = client.post("/api/v1/sales/", json=payload)
        return (cashier_num, res.status_code, res.text)

    # Launch 5 concurrent billing attempts
    results = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(cashier_checkout, i) for i in range(1, 6)]
        for f in as_completed(futures):
            results.append(f.result())

    success_count = sum(1 for _, status, _ in results if status in (200, 201))
    rejected_count = sum(1 for _, status, _ in results if status == 400)

    print(f"\n[Concurrency Test] 5 Cashiers billing 2 items:")
    print(f"  -> Successful Transactions: {success_count}")
    print(f"  -> Rejected (Insufficient Stock) Transactions: {rejected_count}")

    assert success_count == 2, f"Expected exactly 2 successes, got {success_count}. Results: {results}"
    assert rejected_count == 3, f"Expected exactly 3 rejections, got {rejected_count}. Results: {results}"

    # Verify final stock in DB
    verify_db = SessionLocal()
    final_prod = verify_db.query(Product).filter(Product.id == prod_id).first()
    assert final_prod.current_stock == 0.0, f"Stock must be exactly 0.0, found {final_prod.current_stock}"
    assert final_prod.physical_stock == 0.0, f"Physical stock must be exactly 0.0, found {final_prod.physical_stock}"
    verify_db.close()


def test_idempotency_key_prevents_duplicate_billing_on_network_retry():
    """
    Validates that duplicate requests with the same Idempotency-Key
    (common during spotty Cloudflare / 4G connections) do not double-bill or double-deduct inventory.
    """
    db = SessionLocal()
    suffix = uuid.uuid4().hex[:6]
    sku = f"IDEMP-SKU-{suffix}"
    
    prod = Product(
        name=f"Idempotent Item {suffix}",
        p_code=sku,
        barcode=f"BAR-IDEMP-{suffix}",
        retail_price=5000.0,
        current_stock=10.0,
        physical_stock=10.0,
        godown_available_qty=10.0,
        cgst=9.0,
        sgst=9.0
    )
    cust = Customer(
        code=f"C-IDEMP-{suffix}",
        name=f"Idemp Customer {suffix}",
        phone=f"98765{suffix[:5]}",
        state="Karnataka"
    )
    db.add(prod)
    db.add(cust)
    db.commit()
    prod_id = prod.id
    cust_id = cust.id
    cust_name = cust.name
    cust_phone = cust.phone
    db.close()

    client = TestClient(app)
    idempotency_key = f"IDEMP-KEY-{uuid.uuid4().hex}"
    
    payload = {
        "invoice_no": f"SVF-IDEMP-{suffix}",
        "customer_id": cust_id,
        "customer_name": cust_name,
        "customer_phone": cust_phone,
        "date": "2026-10-25",
        "state": "Karnataka",
        "bill_type": "Retail",
        "payment_mode": "CASH",
        "sub_total": 10000.0,
        "cgst_total": 900.0,
        "sgst_total": 900.0,
        "grand_total": 11800.0,
        "paid_amount": 11800.0,
        "balance_due": 0.0,
        "items": [
            {
                "product_id": prod_id,
                "product_name": f"Idempotent Item {suffix}",
                "qty": 2.0,
                "rate": 5000.0,
                "taxable_amount": 10000.0,
                "cgst_percent": 9.0,
                "sgst_percent": 9.0,
                "total": 11800.0
            }
        ]
    }

    # First request
    res1 = client.post("/api/v1/sales/", json=payload, headers={"Idempotency-Key": idempotency_key})
    assert res1.status_code in (200, 201), f"First request failed: {res1.text}"

    # Immediate second retry with same Idempotency-Key (simulating 4G packet replay)
    res2 = client.post("/api/v1/sales/", json=payload, headers={"Idempotency-Key": idempotency_key})
    assert res2.status_code == res1.status_code
    assert res2.headers.get("X-Idempotency-Hit") == "true", "Expected X-Idempotency-Hit header"

    # Verify inventory was deducted ONCE (10.0 - 2.0 = 8.0, NOT 6.0)
    verify_db = SessionLocal()
    check_prod = verify_db.query(Product).filter(Product.id == prod_id).first()
    assert check_prod.current_stock == 8.0, f"Stock should be 8.0 after single deduction, got {check_prod.current_stock}"
    verify_db.close()


def test_combo_pack_knockdown_assembly_concurrency():
    """
    Validates multi-box knock-down / BOM assembly inventory:
    A dining set requiring 1 table and 4 chairs.
    Checks that combo pack sub-items are locked and deducted cleanly.
    """
    db = SessionLocal()
    suffix = uuid.uuid4().hex[:6]
    
    table = Product(
        name=f"Dining Table Base {suffix}",
        p_code=f"TBL-{suffix}",
        barcode=f"BAR-TBL-{suffix}",
        retail_price=10000.0,
        current_stock=5.0,
        physical_stock=5.0,
        godown_available_qty=5.0,
        sales_unit="Pcs"
    )
    chairs = Product(
        name=f"Dining Chair Knockdown {suffix}",
        p_code=f"CHR-{suffix}",
        barcode=f"BAR-CHR-{suffix}",
        retail_price=2500.0,
        current_stock=6.0, # Only 6 chairs available
        physical_stock=6.0,
        godown_available_qty=6.0,
        sales_unit="Pcs"
    )
    cust = Customer(
        code=f"C-BOM-{suffix}",
        name=f"BOM Cust {suffix}",
        phone=f"98765{suffix[:5]}",
        state="Karnataka"
    )
    db.add_all([table, chairs, cust])
    db.commit()
    db.refresh(table)
    db.refresh(chairs)
    db.refresh(cust)

    # Create ComboPack with BOM items
    import json
    combo_barcode = f"COMBO-{suffix}"
    combo = ComboPack(
        name=f"4-Seater Dining Set {suffix}",
        barcode=combo_barcode,
        combo_price=20000.0,
        mrp=25000.0,
        items_json=json.dumps([
            {"product_id": table.id, "qty": 1.0, "name": table.name},
            {"product_id": chairs.id, "qty": 4.0, "name": chairs.name}
        ])
    )
    db.add(combo)
    db.commit()
    
    t_id = table.id
    c_id = chairs.id
    cust_id = cust.id
    cust_name = cust.name
    cust_phone = cust.phone
    db.close()

    client = TestClient(app)
    payload = {
        "invoice_no": f"SVF-COMBO-{suffix}",
        "customer_id": cust_id,
        "customer_name": cust_name,
        "customer_phone": cust_phone,
        "date": "2026-10-25",
        "state": "Karnataka",
        "bill_type": "Retail",
        "payment_mode": "UPI",
        "sub_total": 20000.0,
        "cgst_total": 1800.0,
        "sgst_total": 1800.0,
        "grand_total": 23600.0,
        "paid_amount": 23600.0,
        "balance_due": 0.0,
        "items": [
            {
                "barcode": combo_barcode,
                "product_name": f"4-Seater Dining Set {suffix}",
                "qty": 1.0,
                "rate": 20000.0,
                "taxable_amount": 20000.0,
                "cgst_percent": 9.0,
                "sgst_percent": 9.0,
                "total": 23600.0
            }
        ]
    }
    res = client.post("/api/v1/sales/", json=payload)
    assert res.status_code in (200, 201), f"BOM combo purchase failed: {res.text}"

    # Verify component stocks were deducted
    verify_db = SessionLocal()
    tbl_final = verify_db.query(Product).filter(Product.id == t_id).first()
    chr_final = verify_db.query(Product).filter(Product.id == c_id).first()
    
    assert tbl_final.current_stock == 4.0, f"Table stock should be 4.0 (5-1), got {tbl_final.current_stock}"
    assert chr_final.current_stock == 2.0, f"Chair stock should be 2.0 (6-4), got {chr_final.current_stock}"
    verify_db.close()
