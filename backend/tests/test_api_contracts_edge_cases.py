import uuid
from decimal import Decimal, ROUND_HALF_UP
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal
from app.models.product import Product
from app.models.customer import Customer

def test_openapi_contract_schema_integrity():
    """
    Validates Layer 2: API Contract & OpenAPI Schema Compliance.
    Ensures that /openapi.json is fully formed, adheres to OpenAPI specification,
    and exposes all critical ERP domains without schema compilation errors.
    """
    client = TestClient(app)
    res = client.get("/openapi.json")
    assert res.status_code == 200, f"Failed to retrieve OpenAPI schema: {res.text}"
    schema = res.json()
    
    assert "openapi" in schema
    assert "paths" in schema
    paths = schema["paths"]
    
    # Verify core business paths are mapped in OpenAPI contract
    required_routes = [
        "/api/v1/sales/",
        "/api/v1/sales/next-invoice-no",
        "/api/v1/products/",
        "/api/v1/customers/",
        "/api/v1/inventory/stock-entries",
        "/api/v1/health",
        "/healthz"
    ]
    for r in required_routes:
        assert r in paths, f"Route {r} missing from OpenAPI specification"
    print(f"\n[OpenAPI Contract] Verified {len(paths)} routes in OpenAPI contract schema.")


def test_malformed_requests_return_422_not_500():
    """
    Validates edge case fuzzing:
    Malformed JSON payloads, missing mandatory fields, and invalid data types
    must return structured 422 Unprocessable Entity, NEVER unhandled 500 internal server errors.
    """
    client = TestClient(app)

    # 1. Missing required customer fields
    bad_cust = {"name": ""} # Missing phone and code
    res_cust = client.post("/api/v1/customers/", json=bad_cust)
    assert res_cust.status_code == 422, f"Expected 422 on incomplete customer, got {res_cust.status_code}"
    err_body = res_cust.json()
    assert "detail" in err_body
    print("   [OK] Incomplete customer payload rejected with 422 structured error.")

    # 2. Missing required sale items array
    bad_sale = {
        "invoice_no": "MALFORM-001",
        "customer_id": 1,
        "date": "2026-10-25"
        # items array missing completely
    }
    res_sale = client.post("/api/v1/sales/", json=bad_sale)
    assert res_sale.status_code == 422, f"Expected 422 on missing items array, got {res_sale.status_code}"
    print("   [OK] Missing items array rejected with 422.")

    # 3. Invalid data types (string passed for numeric rate)
    bad_types = {
        "invoice_no": "MALFORM-002",
        "customer_id": 1,
        "items": [
            {
                "product_id": 1,
                "qty": "NOT_A_NUMBER",
                "rate": "INVALID_PRICE"
            }
        ]
    }
    res_types = client.post("/api/v1/sales/", json=bad_types)
    assert res_types.status_code == 422, f"Expected 422 on type violation, got {res_types.status_code}"
    print("   [OK] Type violations rejected with 422 validation error.")


def test_gst_calculation_precision_intra_state_vs_inter_state():
    """
    Validates Indian GST rules & Decimal precision:
    - Intra-state (Karnataka): 18% GST splits into exactly 9% CGST + 9% SGST.
    - Inter-state (e.g. Tamil Nadu): 18% GST maps to IGST (18%), with CGST=0 and SGST=0.
    - Floating point odd paise (e.g., Rs. 3,333.33 taxable) tested for zero tax drift using ROUND_HALF_UP.
    """
    db = SessionLocal()
    suffix = uuid.uuid4().hex[:6]
    
    prod = Product(
        name=f"GST Test Sofa {suffix}",
        p_code=f"GST-{suffix}",
        barcode=f"BAR-GST-{suffix}",
        retail_price=3333.33,
        current_stock=10.0,
        physical_stock=10.0,
        godown_available_qty=10.0,
        hsn_code="9403",
        cgst=9.0,
        sgst=9.0,
        igst=18.0
    )
    cust_intra = Customer(
        code=f"C-INTRA-{suffix}",
        name=f"Karnataka Customer {suffix}",
        phone=f"98765{suffix[:5]}",
        state="Karnataka",
        state_code="29"
    )
    cust_inter = Customer(
        code=f"C-INTER-{suffix}",
        name=f"Tamil Nadu Customer {suffix}",
        phone=f"98766{suffix[:5]}",
        state="Tamil Nadu",
        state_code="33"
    )
    db.add_all([prod, cust_intra, cust_inter])
    db.commit()
    db.refresh(prod)
    db.refresh(cust_intra)
    db.refresh(cust_inter)
    p_id = prod.id
    c_intra_id = cust_intra.id
    c_inter_id = cust_inter.id
    db.close()

    client = TestClient(app)

    # 1. Test Intra-State Sale (Karnataka -> Karnataka)
    # Taxable = 3333.33
    # CGST (9%) = 3333.33 * 0.09 = 299.9997 -> Rounded to 300.00
    # SGST (9%) = 3333.33 * 0.09 = 299.9997 -> Rounded to 300.00
    # Expected Item Total = 3333.33 + 300.00 + 300.00 = 3933.33
    intra_payload = {
        "invoice_no": f"SVF-INTRA-{suffix}",
        "customer_id": c_intra_id,
        "customer_name": f"Karnataka Customer {suffix}",
        "customer_phone": f"98765{suffix[:5]}",
        "date": "2026-10-25",
        "state": "Karnataka",
        "bill_type": "Retail",
        "payment_mode": "CASH",
        "sub_total": 3333.33,
        "cgst_total": 300.00,
        "sgst_total": 300.00,
        "igst_total": 0.0,
        "grand_total": 3933.33,
        "paid_amount": 3933.33,
        "balance_due": 0.0,
        "items": [
            {
                "product_id": p_id,
                "product_name": f"GST Test Sofa {suffix}",
                "qty": 1.0,
                "rate": 3333.33,
                "taxable_amount": 3333.33,
                "cgst_percent": 9.0,
                "sgst_percent": 9.0,
                "igst_percent": 0.0,
                "total": 3933.33
            }
        ]
    }
    res_intra = client.post("/api/v1/sales/", json=intra_payload)
    assert res_intra.status_code in (200, 201), f"Intra-state invoice creation failed: {res_intra.text}"
    intra_data = res_intra.json()
    
    # Verify calculated tax amounts stored on invoice item
    created_items = intra_data.get("items", [])
    assert len(created_items) > 0
    saved_item = created_items[0]
    assert saved_item["cgst_amount"] == 300.00, f"Expected CGST 300.00, got {saved_item['cgst_amount']}"
    assert saved_item["sgst_amount"] == 300.00, f"Expected SGST 300.00, got {saved_item['sgst_amount']}"
    assert saved_item["igst_amount"] == 0.00
    print("   [OK] Intra-state 9% CGST + 9% SGST calculated with ROUND_HALF_UP precision.")

    # 2. Test Inter-State Sale (Karnataka -> Tamil Nadu)
    # Taxable = 3333.33
    # IGST (18%) = 3333.33 * 0.18 = 599.9994 -> Rounded to 600.00
    # Expected Item Total = 3333.33 + 600.00 = 3933.33
    inter_payload = {
        "invoice_no": f"SVF-INTER-{suffix}",
        "customer_id": c_inter_id,
        "customer_name": f"Tamil Nadu Customer {suffix}",
        "customer_phone": f"98766{suffix[:5]}",
        "date": "2026-10-25",
        "state": "Tamil Nadu",
        "bill_type": "B2B",
        "payment_mode": "BANK_TRANSFER",
        "sub_total": 3333.33,
        "cgst_total": 0.0,
        "sgst_total": 0.0,
        "igst_total": 600.00,
        "grand_total": 3933.33,
        "paid_amount": 3933.33,
        "balance_due": 0.0,
        "items": [
            {
                "product_id": p_id,
                "product_name": f"GST Test Sofa {suffix}",
                "qty": 1.0,
                "rate": 3333.33,
                "taxable_amount": 3333.33,
                "cgst_percent": 0.0,
                "sgst_percent": 0.0,
                "igst_percent": 18.0,
                "total": 3933.33
            }
        ]
    }
    res_inter = client.post("/api/v1/sales/", json=inter_payload)
    assert res_inter.status_code in (200, 201), f"Inter-state invoice creation failed: {res_inter.text}"
    inter_data = res_inter.json()
    inter_saved_item = inter_data["items"][0]
    assert inter_saved_item["cgst_amount"] == 0.00
    assert inter_saved_item["sgst_amount"] == 0.00
    assert inter_saved_item["igst_amount"] == 600.00, f"Expected IGST 600.00, got {inter_saved_item['igst_amount']}"
    print("   [OK] Inter-state 18% IGST calculated with exact precision.")
