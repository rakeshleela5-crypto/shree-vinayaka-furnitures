import sys
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.product import Product
from app.models.accounting import JournalEntry, JournalLine
from app.models.workshop import WorkshopJobCard

client = TestClient(app)

def test_phase3_features():
    print("Testing Phase 3 Features...")
    
    # 1. Test Workshop Job Card Lifecycle
    print("\n1. Testing Workshop Job Card Lifecycle...")
    job_card_payload = {
        "customer_name": "Ramesh Kumar Sharma",
        "customer_phone": "9876543210",
        "product_name": "Custom 3-Seater Chesterfield Velvet Sofa",
        "category": "Sofa",
        "dimensions": "84L x 36D x 32H inches",
        "wood_type": "Teak Wood",
        "fabric_code": "Royal Blue Velvet #V99",
        "foam_density": "40 High Resilient Foam",
        "priority": "HIGH",
        "estimated_cost": 45000.0,
        "quoted_price": 68000.0,
        "advance_paid": 25000.0,
        "notes": "Brass studs on armrest, walnut matte polish on exposed wooden legs."
    }
    
    resp = client.post("/api/v1/workshop/job-cards", json=job_card_payload)
    assert resp.status_code == 200, f"Create job card failed: {resp.text}"
    job_card = resp.json()
    job_id = job_card["id"]
    job_no = job_card["job_card_no"]
    assert job_no.startswith("JC-"), f"Unexpected job card number: {job_no}"
    assert job_card["stage"] == "DESIGN_LOCKED"
    print(f"   [OK] Created Workshop Job Card: {job_no} (Stage: {job_card['stage']})")
    
    # Advance through stages
    stages = ["WOOD_FRAME", "WEBBING_FOAM", "FABRIC_UPHOLSTERY", "QC_VERIFIED", "READY_FOR_DISPATCH"]
    for next_stage in stages:
        patch_resp = client.patch(
            f"/api/v1/workshop/job-cards/{job_id}/stage",
            json={"stage": next_stage, "notes": f"Moved to {next_stage}", "technician_name": "WORKSHOP_MASTER"}
        )
        assert patch_resp.status_code == 200, f"Stage advance to {next_stage} failed: {patch_resp.text}"
        updated_card = patch_resp.json()
        assert updated_card["stage"] == next_stage
        print(f"   [OK] Advanced stage to: {next_stage}")
        
    # Get all job cards
    get_resp = client.get("/api/v1/workshop/job-cards")
    assert get_resp.status_code == 200
    all_cards = get_resp.json()
    assert any(c["id"] == job_id for c in all_cards), "Job card not found in list"
    print(f"   [OK] Retrieved list of {len(all_cards)} Workshop Job Cards")
    
    # 2. Test Quarantine Write-Off with Section 17(5)(h) ITC Reversal
    print("\n2. Testing Damaged Stock Quarantine Write-Off & Sec 17(5)(h) ITC Reversal...")
    
    # Get a product to test
    db = SessionLocal()
    try:
        product = db.query(Product).filter(Product.is_active == True).first()
        if not product:
            print("   [SKIP] No active product found for quarantine write-off")
            return
            
        prod_id = product.id
        prod_name = product.name
        # Ensure we have some stock in damaged_quarantine_qty or godown
        product.damaged_quarantine_qty = (product.damaged_quarantine_qty or 0.0) + 5.0
        product.current_stock = (product.current_stock or 0.0) + 5.0
        db.commit()
        db.refresh(product)
        initial_quarantine = product.damaged_quarantine_qty
        initial_stock = product.current_stock
        purchase_cost = product.purchase_price or 1000.0
        gst_rate = product.gst_rate or 18.0
    finally:
        db.close()
        
    scrap_qty = 2.0
    write_off_payload = {
        "product_id": prod_id,
        "qty": scrap_qty,
        "source_bucket": "damaged_quarantine_qty",
        "reason": "Transit damage - unrepairable frame crack during interstate transport",
        "performed_by": "AUDIT_MANAGER"
    }
    
    wo_resp = client.post("/api/v1/inventory/quarantine-write-off", json=write_off_payload)
    assert wo_resp.status_code == 200, f"Quarantine write-off failed: {wo_resp.text}"
    wo_data = wo_resp.json()
    assert wo_data["status"] == "SUCCESS"
    assert wo_data["product_id"] == prod_id
    assert wo_data["written_off_qty"] == scrap_qty
    
    expected_asset_value = round(scrap_qty * purchase_cost, 2)
    expected_total_tax = round(expected_asset_value * (gst_rate / 100.0), 2)
    expected_cgst_itc = round(expected_total_tax / 2.0, 2)
    expected_sgst_itc = round(expected_total_tax - expected_cgst_itc, 2)
    expected_total_loss = round(expected_asset_value + expected_total_tax, 2)
    
    assert wo_data["cost_asset_written_off"] == expected_asset_value
    assert wo_data["cgst_itc_reversal"] == expected_cgst_itc
    assert wo_data["sgst_itc_reversal"] == expected_sgst_itc
    assert wo_data["total_pnl_loss"] == expected_total_loss
    assert wo_data["journal_entry_number"].startswith("JV-")
    
    print(f"   [OK] Scrapped {scrap_qty} units of '{prod_name}'")
    print(f"   [OK] Asset Value Written Off: Rs.{wo_data['cost_asset_written_off']}")
    print(f"   [OK] Sec 17(5)(h) ITC CGST Reversed: Rs.{wo_data['cgst_itc_reversal']}")
    print(f"   [OK] Sec 17(5)(h) ITC SGST Reversed: Rs.{wo_data['sgst_itc_reversal']}")
    print(f"   [OK] Total Loss on Damaged Goods: Rs.{wo_data['total_pnl_loss']}")
    print(f"   [OK] Journal Voucher Generated: {wo_data['journal_entry_number']}")
    
    # Verify stock reduction in database
    db = SessionLocal()
    try:
        updated_prod = db.query(Product).filter(Product.id == prod_id).first()
        assert updated_prod.damaged_quarantine_qty == initial_quarantine - scrap_qty
        print("   [OK] Stock balance decremented correctly in database!")
        
        # Verify double-entry journal balance
        jv = db.query(JournalEntry).filter(JournalEntry.entry_number == wo_data["journal_entry_number"]).first()
        assert jv is not None, "Journal voucher not found in DB"
        lines = db.query(JournalLine).filter(JournalLine.journal_entry_id == jv.id).all()
        total_dr = sum(l.debit for l in lines)
        total_cr = sum(l.credit for l in lines)
        assert abs(total_dr - total_cr) < 0.01, f"Journal entry unbalanced: Dr {total_dr} != Cr {total_cr}"
        print(f"   [OK] Double-entry balance verified: Total Dr Rs.{total_dr:.2f} == Total Cr Rs.{total_cr:.2f}")
    finally:
        db.close()
        
    print("\n=======================================================")
    print("ALL PHASE 3 WORKSHOP & QUARANTINE ASSERTIONS PASSED 100%!")
    print("=======================================================")

if __name__ == "__main__":
    test_phase3_features()
