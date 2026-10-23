import datetime
import json
import urllib.parse
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.realtime import realtime_manager
from app.models.sale import DeliveryNote
from app.models.customer import Customer
from app.models.product import Product
from app.schemas.sale import (
    DeliveryNoteResponse,
    DeliveryStageAdvanceRequest,
    CsatFeedbackRequest,
    CsatWhatsAppResponse
)

router = APIRouter()

@router.get("/orders", response_model=List[DeliveryNoteResponse])
def get_delivery_pipeline_orders(
    stage: Optional[str] = Query(None, description="Filter by stage: Booked | BoxVerified | OutForDelivery | SiteArrived | AssemblyInProgress | Delivered | Closed"),
    search: Optional[str] = Query(None, description="Search customer name, note no, or phone"),
    db: Session = Depends(get_db)
):
    """
    Returns all Delivery Notes across the 6-stage Dispatch, Assembly & CSAT Pipeline.
    """
    query = db.query(DeliveryNote)
    if stage:
        query = query.filter(DeliveryNote.stage == stage)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (DeliveryNote.customer_name.ilike(search_pattern)) |
            (DeliveryNote.delivery_note_no.ilike(search_pattern)) |
            (DeliveryNote.contact_no.ilike(search_pattern)) |
            (DeliveryNote.vehicle_no.ilike(search_pattern))
        )
    return query.order_by(DeliveryNote.created_at.desc()).all()

import uuid
from app.models.sale import SaleInvoice, SaleInvoicePayment
from app.models.product import StockLedgerEvent
from app.core.journal_service import post_double_entry_journal

@router.post("/{note_id}/advance-stage", response_model=DeliveryNoteResponse)
def advance_delivery_stage(
    note_id: int,
    payload: DeliveryStageAdvanceRequest,
    db: Session = Depends(get_db)
):
    """
    Advances a Delivery Note across the strict 6-stage furniture delivery machine:
    1. PENDING_PACKET_VERIFICATION -> 2. GATE_PASS_ISSUED (100% packets checked)
    -> 3. OUT_FOR_DELIVERY (vehicle & driver assigned, stock deducted)
    -> 4. DELIVERED_AT_SITE (Hard COD / Credit Override Gate)
    -> 5. CARPENTER_ASSIGNED (carpenter name, phone & slot)
    -> 6. INSTALLED_AND_CLOSED (OTP / final confirmation)
    """
    note = db.query(DeliveryNote).filter(DeliveryNote.id == note_id).with_for_update().first()
    if not note:
        raise HTTPException(status_code=404, detail="Delivery note not found")

    target_stage = payload.stage
    now = datetime.datetime.utcnow()

    # Map aliases
    stage_map = {
        "Booked": "PENDING_PACKET_VERIFICATION",
        "BoxVerified": "GATE_PASS_ISSUED",
        "OutForDelivery": "OUT_FOR_DELIVERY",
        "SiteArrived": "DELIVERED_AT_SITE",
        "AssemblyInProgress": "CARPENTER_ASSIGNED",
        "Delivered": "DELIVERED_AT_SITE",
        "Closed": "INSTALLED_AND_CLOSED"
    }
    canonical_stage = stage_map.get(target_stage, target_stage)

    # 1. PENDING_PACKET_VERIFICATION
    if canonical_stage == "PENDING_PACKET_VERIFICATION":
        note.stage = "PENDING_PACKET_VERIFICATION"
        note.status = "Pending Verification"

    # 2. GATE_PASS_ISSUED (Requires 100% sub-boxes verified)
    elif canonical_stage == "GATE_PASS_ISSUED":
        if payload.verified_packets_json:
            note.verified_packets_json = payload.verified_packets_json
        
        if not note.gate_pass_no:
            note.gate_pass_no = f"GP-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
            note.gate_pass_issued_at = now
        
        note.stage = "GATE_PASS_ISSUED"
        note.status = "Gate Pass Issued"

    # 3. OUT_FOR_DELIVERY (Requires vehicle, driver name & phone; Deducts stock)
    elif canonical_stage == "OUT_FOR_DELIVERY":
        v_no = payload.vehicle_no or note.vehicle_no
        d_name = payload.driver_name or note.driver_name
        d_phone = payload.driver_phone or note.driver_phone

        if not v_no or not d_name or not d_phone:
            raise HTTPException(
                status_code=400,
                detail="Dispatch requires vehicle number, driver name, and driver contact number."
            )

        note.vehicle_no = v_no
        note.driver_name = d_name
        note.driver_phone = d_phone
        if payload.eway_bill_no:
            note.eway_bill_no = payload.eway_bill_no
        if not note.dispatched_at:
            note.dispatched_at = now

        note.stage = "OUT_FOR_DELIVERY"
        note.status = "Out For Delivery"

        # Deduct stock from reserved_booked_qty (or godown_available_qty)
        if note.items_json:
            try:
                items = json.loads(note.items_json)
                for it in items:
                    p_id = it.get("product_id") or it.get("id")
                    b_code = it.get("barcode")
                    qty = float(it.get("qty") or it.get("quantity") or 1.0)
                    prod = None
                    if p_id:
                        prod = db.query(Product).filter(Product.id == int(p_id)).with_for_update().first()
                    elif b_code:
                        prod = db.query(Product).filter(Product.barcode == str(b_code)).with_for_update().first()

                    if prod:
                        # Deduct from reserved stock first if it was an advance booking
                        res_qty = float(prod.reserved_booked_qty or prod.reserved_stock or 0.0)
                        if res_qty >= qty:
                            b_qty = res_qty
                            prod.reserved_booked_qty = max(0.0, float(prod.reserved_booked_qty or 0.0) - qty)
                            prod.reserved_stock = max(0.0, float(prod.reserved_stock or 0.0) - qty)
                            event_bucket = "reserved_booked_qty"
                        else:
                            b_qty = float(prod.godown_available_qty or 0.0)
                            prod.godown_available_qty = max(0.0, b_qty - qty)
                            event_bucket = "godown_available_qty"

                        prod.current_stock = (prod.godown_available_qty or 0.0) + (prod.showroom_display_qty or 0.0)
                        prod.physical_stock = (prod.godown_available_qty or 0.0) + (prod.showroom_display_qty or 0.0) + (prod.reserved_booked_qty or 0.0) + (prod.damaged_quarantine_qty or 0.0)

                        # Audit event
                        ev = StockLedgerEvent(
                            product_id=prod.id,
                            event_type="INVOICE_DISPATCH",
                            bucket=event_bucket,
                            before_qty=b_qty,
                            delta_qty=-qty,
                            after_qty=b_qty - qty,
                            reference_id=note.delivery_note_no,
                            reason_code="OUT_FOR_DELIVERY_DISPATCH",
                            performed_by="DISPATCH_COORDINATOR",
                            notes=f"Dispatched on {note.delivery_note_no} via {v_no}"
                        )
                        db.add(ev)
            except Exception:
                pass

    # 4. DELIVERED_AT_SITE (Hard COD Gate)
    elif canonical_stage == "DELIVERED_AT_SITE":
        # Check linked invoice balance
        inv = None
        if note.invoice_no:
            inv = db.query(SaleInvoice).filter(SaleInvoice.invoice_no == note.delivery_note_no).with_for_update().first()
            if not inv:
                inv = db.query(SaleInvoice).filter(SaleInvoice.invoice_no == note.invoice_no).with_for_update().first()

        bal_due = float(inv.balance_due or 0.0) if inv else 0.0
        cod_col = float(payload.cod_collected or 0.0)
        credit_override = (payload.credit_override_reason or "").strip()

        if bal_due > 0.5 and cod_col < bal_due and not credit_override:
            raise HTTPException(
                status_code=400,
                detail=f"HARD BUSINESS GATE: Balance due is ₹{bal_due:,.2f}. You must either (a) record COD collection of ₹{bal_due:,.2f}, or (b) provide an Owner/Manager Credit Override reason to mark Delivered."
            )

        if cod_col > 0:
            note.cod_collected = (note.cod_collected or 0.0) + cod_col
            if inv:
                inv.paid_amount = (inv.paid_amount or 0.0) + cod_col
                inv.balance_due = max(0.0, (inv.balance_due or 0.0) - cod_col)
                if inv.balance_due <= 0.01:
                    inv.status = "Completed"

                # Record invoice payment
                inv_pay = SaleInvoicePayment(
                    invoice_id=inv.id,
                    payment_mode=payload.payment_mode or "CASH",
                    amount=cod_col,
                    reference_no=payload.reference_no or f"COD-{note.delivery_note_no}",
                    status="Completed",
                    notes=f"COD collected by driver {note.driver_name or ''}"
                )
                db.add(inv_pay)

                # Post double-entry journal for COD receipt
                post_double_entry_journal(
                    db=db,
                    voucher_type="RECEIPT",
                    reference_no=f"COD-{note.delivery_note_no}",
                    narration=f"COD collection at site for {note.delivery_note_no}. Customer: {note.customer_name}",
                    lines=[
                        {
                            "account_name": "Cash in Hand" if (payload.payment_mode or "").upper() == "CASH" else "Bank / UPI Account",
                            "account_group": "Current Assets",
                            "debit": cod_col,
                            "credit": 0.0,
                            "party_type": None
                        },
                        {
                            "account_name": "Accounts Receivable (Customer Khata)",
                            "account_group": "Current Assets",
                            "debit": 0.0,
                            "credit": cod_col,
                            "party_type": "Customer",
                            "party_id": note.customer_id,
                            "party_name": note.customer_name
                        }
                    ]
                )

        if credit_override:
            note.credit_override_reason = credit_override

        if payload.signed_challan_photo_url:
            note.signed_challan_photo_url = payload.signed_challan_photo_url

        if not note.delivered_at:
            note.delivered_at = now

        note.stage = "DELIVERED_AT_SITE"
        note.status = "Delivered at Site"

    # 5. CARPENTER_ASSIGNED (Assigns carpenter name, phone, slot)
    elif canonical_stage == "CARPENTER_ASSIGNED":
        if payload.carpenter_name:
            note.carpenter_name = payload.carpenter_name
            note.technician_name = payload.carpenter_name
        if payload.carpenter_phone:
            note.carpenter_phone = payload.carpenter_phone
            note.technician_phone = payload.carpenter_phone
        if payload.assembly_slot:
            note.assembly_slot = payload.assembly_slot
        if payload.assembly_notes:
            note.assembly_notes = payload.assembly_notes

        note.stage = "CARPENTER_ASSIGNED"
        note.status = "Carpenter Assigned"

    # 6. INSTALLED_AND_CLOSED (Final installation sign-off)
    elif canonical_stage == "INSTALLED_AND_CLOSED":
        if payload.installation_otp:
            note.installation_otp = payload.installation_otp
        if not note.installed_at:
            note.installed_at = now
        if not note.assembled_at:
            note.assembled_at = now
        if not note.delivered_at:
            note.delivered_at = now

        note.stage = "INSTALLED_AND_CLOSED"
        note.status = "Closed"

    db.commit()
    db.refresh(note)
    realtime_manager.broadcast_sync({
        "event": "DELIVERY_UPDATED",
        "note_id": note.id,
        "delivery_note_no": note.delivery_note_no,
        "stage": note.stage,
        "status": note.status,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    return note


@router.post("/{note_id}/log-csat", response_model=DeliveryNoteResponse)
def log_delivery_csat(
    note_id: int,
    payload: CsatFeedbackRequest,
    db: Session = Depends(get_db)
):
    """
    Records customer CSAT rating (1 to 5 stars), category tags, and feedback comments.
    Auto-escalates to store manager if rating <= 2 stars!
    """
    note = db.query(DeliveryNote).filter(DeliveryNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Delivery note not found")

    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=400, detail="CSAT rating must be between 1 and 5")

    note.csat_rating = payload.rating
    note.csat_tags = payload.tags or ""
    note.csat_feedback = payload.feedback or ""
    note.csat_logged_at = datetime.datetime.utcnow()

    # Automatic escalation logic for dissatisfied customers
    if payload.rating <= 2:
        note.csat_followup_status = "Escalated"
    else:
        note.csat_followup_status = payload.followup_status or "Satisfied"

    db.commit()
    db.refresh(note)
    realtime_manager.broadcast_sync({
        "event": "DELIVERY_UPDATED",
        "note_id": note.id,
        "delivery_note_no": note.delivery_note_no,
        "csat_rating": note.csat_rating,
        "followup_status": note.csat_followup_status,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    return note

@router.post("/{note_id}/generate-csat-whatsapp", response_model=CsatWhatsAppResponse)
def generate_delivery_csat_whatsapp(
    note_id: int,
    db: Session = Depends(get_db)
):
    """
    Builds a pre-formatted WhatsApp CSAT feedback request link for the customer.
    """
    note = db.query(DeliveryNote).filter(DeliveryNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Delivery note not found")

    phone = "".join(filter(str.isdigit, note.contact_no or "9847123456"))
    if len(phone) == 10:
        phone = "91" + phone

    msg_lines = [
        f"Namaste {note.customer_name}! 🙏",
        "",
        "Thank you for choosing *Shree Vinayaka Furnitures (Godrej Interio)* for your home & office furniture.",
        "",
        f"Your order *{note.delivery_note_no}* has been successfully delivered.",
        f"📍 Delivery Address: {note.delivery_address[:60]}",
        "",
        "Could you please share your quick experience with our delivery & carpenter assembly?",
        "⭐⭐⭐⭐⭐ (5 - Excellent & On-time)",
        "⭐⭐⭐⭐ (4 - Very Good)",
        "⭐⭐⭐ (3 - Satisfactory)",
        "⭐⭐ (2 - Needs Improvement)",
        "⭐ (1 - Poor / Incomplete)",
        "",
        "Feel free to reply with your star rating and feedback comments. We are dedicated to providing the finest furniture experience!",
        "",
        "— *Customer Support, Shree Vinayaka Furnitures, Kottayam & Ernakulam*"
    ]
    message_text = "\n".join(msg_lines)
    encoded_text = urllib.parse.quote(message_text)
    whatsapp_url = f"https://wa.me/{phone}?text={encoded_text}"

    return CsatWhatsAppResponse(
        delivery_note_no=note.delivery_note_no,
        customer_name=note.customer_name,
        contact_no=note.contact_no or "",
        whatsapp_url=whatsapp_url,
        message=message_text
    )

@router.post("/seed-sample-pipeline")
def seed_sample_delivery_pipeline(db: Session = Depends(get_db)):
    """
    Seeds 5 authentic Godrej delivery notes across all pipeline stages.
    """
    today_str = datetime.date.today().strftime("%d/%m/%Y")
    now = datetime.datetime.utcnow()

    sample_notes = [
        {
            "delivery_note_no": "DN-0101-2024/25",
            "date": today_str,
            "customer_name": "Dr. Anoop Nambiar (Nambiar Clinic)",
            "contact_no": "9847112233",
            "delivery_address": "Flat 4B, Skyline Riverdale, Baker Junction, Kottayam, Kerala - 686001",
            "vehicle_no": "KL-05-AR-4491",
            "transporter_name": "Vinayaka Express Van",
            "grand_total": 48500.0,
            "stage": "Booked",
            "driver_name": "Biju Kumar",
            "driver_phone": "9447102030",
            "eway_bill_no": "241188990123",
            "technician_name": "Manoharan (Senior Carpenter)",
            "technician_phone": "9846203040",
            "assembly_notes": "Knockdown Slimline 3-Door Almirah (3 Boxes). Carry safety rubber mallet.",
            "items_json": json.dumps([
                {"name": "Godrej Interio Slimline 3-Door Steel Almirah (Royal Maroon)", "qty": 1, "boxes": 3, "rate": 48500.0}
            ])
        },
        {
            "delivery_note_no": "DN-0102-2024/25",
            "date": today_str,
            "customer_name": "Prof. Radhika Menon",
            "contact_no": "9745223344",
            "delivery_address": "Menon Villa, Near Collectorate, Kanjikuzhy, Kottayam, Kerala - 686004",
            "vehicle_no": "KL-05-BC-1122",
            "transporter_name": "Store Delivery Auto",
            "grand_total": 65000.0,
            "stage": "BoxVerified",
            "driver_name": "Suresh Babu",
            "driver_phone": "9446332211",
            "eway_bill_no": "241188990124",
            "technician_name": "Vinod Technician",
            "technician_phone": "9846554433",
            "assembly_notes": "All 4 flat-pack boxes scanned & 100% matched with barcode engine.",
            "items_json": json.dumps([
                {"name": "Godrej Interio Ortho Pro King Size Bed with Hydraulic Storage", "qty": 1, "boxes": 4, "rate": 65000.0}
            ])
        },
        {
            "delivery_note_no": "DN-0103-2024/25",
            "date": today_str,
            "customer_name": "Thomas Mathew (Malabar Spices)",
            "contact_no": "9895334455",
            "delivery_address": "Plot 12, Rubber Board Road, Puthuppally, Kottayam - 686011",
            "vehicle_no": "KL-05-AR-4491",
            "transporter_name": "Vinayaka Express Van",
            "grand_total": 72000.0,
            "stage": "OutForDelivery",
            "driver_name": "Biju Kumar",
            "driver_phone": "9447102030",
            "eway_bill_no": "241188990125",
            "technician_name": "Manoharan (Senior Carpenter)",
            "technician_phone": "9846203040",
            "assembly_notes": "Deliver to 2nd floor via service lift. Recliner 2 cartons.",
            "dispatched_at": now - datetime.timedelta(hours=2),
            "items_json": json.dumps([
                {"name": "Godrej Interio Regal 3-Seater Leatherette Recliner", "qty": 1, "boxes": 2, "rate": 72000.0}
            ])
        },
        {
            "delivery_note_no": "DN-0104-2024/25",
            "date": today_str,
            "customer_name": "Adv. Sreejith Panicker",
            "contact_no": "9447445566",
            "delivery_address": "Chamber 6, District Court Complex, Kottayam - 686002",
            "vehicle_no": "KL-05-BC-1122",
            "transporter_name": "Store Delivery Auto",
            "grand_total": 34000.0,
            "stage": "AssemblyInProgress",
            "driver_name": "Suresh Babu",
            "driver_phone": "9446332211",
            "eway_bill_no": "241188990126",
            "technician_name": "Vinod Technician",
            "technician_phone": "9846554433",
            "assembly_notes": "Assembly of Motion Ergonomic Workstation & Executive Chair in progress.",
            "dispatched_at": now - datetime.timedelta(hours=4),
            "items_json": json.dumps([
                {"name": "Godrej Interio Motion High-Back Ergonomic Office Chair", "qty": 2, "boxes": 2, "rate": 34000.0}
            ])
        },
        {
            "delivery_note_no": "DN-0105-2024/25",
            "date": today_str,
            "customer_name": "Kottayam District Cooperative Bank (Head Office)",
            "contact_no": "9446110022",
            "delivery_address": "Bank Road, Central Junction, Kottayam - 686001",
            "vehicle_no": "KL-05-AR-4491",
            "transporter_name": "Vinayaka Express Van",
            "grand_total": 92000.0,
            "stage": "Delivered",
            "driver_name": "Biju Kumar",
            "driver_phone": "9447102030",
            "eway_bill_no": "241188990127",
            "technician_name": "Manoharan (Senior Carpenter)",
            "technician_phone": "9846203040",
            "assembly_notes": "Bank vault safe installation & bolting completed perfectly.",
            "dispatched_at": now - datetime.timedelta(days=1),
            "assembled_at": now - datetime.timedelta(hours=6),
            "delivered_at": now - datetime.timedelta(hours=5),
            "csat_rating": 5,
            "csat_tags": "Punctual,Flawless Assembly,Courteous Staff",
            "csat_feedback": "Extremely professional installation of Godrej safe and steel cabinets. Staff was very helpful.",
            "csat_logged_at": now - datetime.timedelta(hours=4),
            "csat_followup_status": "Satisfied",
            "items_json": json.dumps([
                {"name": "Godrej Security Defender Prime Class C High Security Safe", "qty": 1, "boxes": 1, "rate": 92000.0}
            ])
        }
    ]

    seeded_count = 0
    for sample in sample_notes:
        existing = db.query(DeliveryNote).filter(DeliveryNote.delivery_note_no == sample["delivery_note_no"]).first()
        if not existing:
            new_note = DeliveryNote(
                delivery_note_no=sample["delivery_note_no"],
                date=sample["date"],
                customer_name=sample["customer_name"],
                contact_no=sample["contact_no"],
                delivery_address=sample["delivery_address"],
                vehicle_no=sample["vehicle_no"],
                transporter_name=sample["transporter_name"],
                grand_total=sample["grand_total"],
                stage=sample["stage"],
                driver_name=sample["driver_name"],
                driver_phone=sample["driver_phone"],
                eway_bill_no=sample["eway_bill_no"],
                technician_name=sample["technician_name"],
                technician_phone=sample["technician_phone"],
                assembly_notes=sample["assembly_notes"],
                items_json=sample["items_json"],
                dispatched_at=sample.get("dispatched_at"),
                assembled_at=sample.get("assembled_at"),
                delivered_at=sample.get("delivered_at"),
                csat_rating=sample.get("csat_rating"),
                csat_tags=sample.get("csat_tags"),
                csat_feedback=sample.get("csat_feedback"),
                csat_logged_at=sample.get("csat_logged_at"),
                csat_followup_status=sample.get("csat_followup_status", "Pending"),
                status="Delivered" if sample["stage"] == "Delivered" else "Dispatched"
            )
            db.add(new_note)
            seeded_count += 1

    db.commit()
    return {
        "status": "SUCCESS",
        "message": f"Seeded {seeded_count} realistic delivery notes in pipeline.",
        "seeded_count": seeded_count
    }


@router.delete("/{note_id}")
def delete_delivery_pipeline_order(note_id: str, db: Session = Depends(get_db)):
    """
    Cancel or delete a Delivery Note from the Delivery Pipeline with full rollback & broadcast.
    """
    note = None
    if str(note_id).isdigit():
        note = db.query(DeliveryNote).filter(DeliveryNote.id == int(note_id)).first()
    if not note:
        note = db.query(DeliveryNote).filter(DeliveryNote.delivery_note_no == str(note_id)).first()
    if not note:
        raise HTTPException(status_code=404, detail=f"Delivery Note '{note_id}' not found in pipeline")

    note_no = note.delivery_note_no
    db.delete(note)
    db.commit()

    realtime_manager.broadcast_sync({
        "event": "DELIVERY_UPDATED",
        "action": "DELETED",
        "delivery_note_no": note_no,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })

    return {
        "status": "SUCCESS",
        "message": f"Delivery Note {note_no} cancelled and removed from pipeline.",
        "delivery_note_no": note_no
    }
