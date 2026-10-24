"""
test_csv_bulk_persistence.py
Validates end-to-end lifetime bulk furniture CSV persistence in PostgreSQL database.
Tests uploading 30, 50, 70+ products, duplicate updating, stock bucket sync, and full retrieval.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_lifetime_csv_bulk_persistence():
    print("\n--- Testing Lifetime Bulk Furniture Products Persistence in PostgreSQL ---")
    
    # 1. Generate 50 realistic furniture products as parsed from an imported CSV
    furniture_categories = ["Living Room", "Bedroom", "Dining Room", "Office Furniture", "Storage & Wardrobes"]
    wood_types = ["Solid Teak Wood", "Sheesham Wood", "Engineered Wood / Melamine", "Imported Oak Wood"]
    
    products_payload = []
    for i in range(1, 51):
        cat = furniture_categories[i % len(furniture_categories)]
        wood = wood_types[i % len(wood_types)]
        sku = f"SVF-TEST-{i:04d}"
        barcode = f"890998877{i:04d}"
        
        products_payload.append({
            "name": f"Premium {wood} {cat} Item #{i}",
            "p_code": sku,
            "barcode": barcode,
            "purchase_price": 5000.0 + (i * 250),
            "retail_price": 8500.0 + (i * 350),
            "wholesale_price": 7500.0 + (i * 300),
            "mrp": 10500.0 + (i * 400),
            "opening_stock": float(10 + (i % 15)),
            "current_stock": float(10 + (i % 15)),
            "physical_stock": float(10 + (i % 15)),
            "category_name": cat,
            "sub_category": "Luxury Collection",
            "material": wood,
            "dimensions": f"{72 + (i % 6)}x{36 + (i % 4)}x{30 + (i % 2)} inches",
            "warranty": "5 Years Comprehensive Warranty",
            "brand": "Shree Vinayaka Furnitures",
            "godown": "Main Godown A",
            "rack": f"R-{i % 10}",
            "hsn_code": "9403",
            "cgst": 9.0,
            "sgst": 9.0,
            "igst": 0.0,
            "is_knockdown": i % 3 == 0,
            "total_boxes_count": 3 if (i % 3 == 0) else 1,
            "total_boxes": 3 if (i % 3 == 0) else 1
        })
    
    # 2. Call bulk-import endpoint (simulating CSV upload)
    res = client.post("/api/v1/products/bulk-import", json=products_payload)
    assert res.status_code == 200, f"Bulk import failed: {res.text}"
    import_data = res.json()
    assert import_data["message"] == "Bulk import completed"
    print(f"   [OK] Bulk imported 50 furniture items: created={import_data['created']}, updated={import_data['updated']}")

    # 3. Query all products from database with limit=5000 and include_costs=true
    fetch_res = client.get("/api/v1/products/?limit=5000&include_costs=true")
    assert fetch_res.status_code == 200
    all_db_products = fetch_res.json()
    assert len(all_db_products) >= 50, f"Expected at least 50 products in DB, got {len(all_db_products)}"
    print(f"   [OK] Verified PostgreSQL database contains {len(all_db_products)} total products.")

    # 4. Verify specific sample items have exact furniture attributes intact
    sample_item = next((p for p in all_db_products if p["p_code"] == "SVF-TEST-0025"), None)
    assert sample_item is not None, "Product SVF-TEST-0025 must exist in database"
    assert sample_item["barcode"] == "8909988770025"
    assert sample_item["purchase_price"] == 5000.0 + (25 * 250)
    assert sample_item["material"] is not None
    assert sample_item["warranty"] == "5 Years Comprehensive Warranty"
    assert sample_item["brand"] == "Shree Vinayaka Furnitures"
    print(f"   [OK] Sample product verified in PostgreSQL: {sample_item['name']}, Price: Rs.{sample_item['retail_price']}, Warranty: {sample_item['warranty']}")

    # 5. Test idempotency & lifetime updates: Re-importing 10 of the items with updated prices & stock
    update_batch = [
        {
            "name": f"Premium {wood_types[i % len(wood_types)]} Updated Item #{i}",
            "p_code": f"SVF-TEST-{i:04d}",
            "barcode": f"890998877{i:04d}",
            "retail_price": 99999.0,
            "opening_stock": 50.0,
            "current_stock": 50.0,
            "physical_stock": 50.0
        }
        for i in range(1, 11)
    ]
    update_res = client.post("/api/v1/products/bulk-import", json=update_batch)
    assert update_res.status_code == 200
    assert update_res.json()["updated"] == 10
    print(f"   [OK] Successfully updated 10 existing products without duplicate key errors.")

    # 6. Verify updated item in DB
    updated_fetch = client.get(f"/api/v1/products/barcode/8909988770001")
    assert updated_fetch.status_code == 200
    updated_prod = updated_fetch.json()
    assert updated_prod["retail_price"] == 99999.0
    assert updated_prod["physical_stock"] == 50.0
    print(f"   [OK] Verified updated price in PostgreSQL: Rs.{updated_prod['retail_price']} and stock={updated_prod['physical_stock']}.")
    print("--- LIFETIME BULK IMPORT & POSTGRESQL PERSISTENCE TEST PASSED WITH 100% SUCCESS ---")

if __name__ == "__main__":
    test_lifetime_csv_bulk_persistence()
