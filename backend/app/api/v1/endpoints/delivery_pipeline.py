import datetime
import json
import urllib.parse
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.sale import DeliveryNote
from app.models.customer import Customer
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

@router.post("/{note_id}/advance-stage", response_model=DeliveryNoteResponse)
def advance_delivery_stage(
    note_id: int,
    payload: DeliveryStageAdvanceRequest,
    db: Session = Depends(get_db)
):
    """
    Advances a Delivery Note along the pipeline with driver, vehicle, and technician assignment.
    """
    note = db.query(DeliveryNote).filter(DeliveryNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Delivery note not found")

    note.stage = payload.stage
    if payload.driver_name is not None:
        note.driver_name = payload.driver_name
    if payload.driver_phone is not None:
        note.driver_phone = payload.driver_phone
    if payload.vehicle_no is not None:
        note.vehicle_no = payload.vehicle_no
    if payload.eway_bill_no is not None:
        note.eway_bill_no = payload.eway_bill_no
    if payload.technician_name is not None:
        note.technician_name = payload.technician_name
    if payload.technician_phone is not None:
        note.technician_phone = payload.technician_phone
    if payload.assembly_notes is not None:
        note.assembly_notes = payload.assembly_notes

    now = datetime.datetime.utcnow()
    if payload.stage == "OutForDelivery" and not note.dispatched_at:
        note.dispatched_at = now
        note.status = "Dispatched"
    elif payload.stage == "AssemblyInProgress" and not note.assembled_at:
        note.status = "In Assembly"
    elif payload.stage == "Delivered":
        if not note.assembled_at:
            note.assembled_at = now
        if not note.delivered_at:
            note.delivered_at = now
        note.status = "Delivered"

    db.commit()
    db.refresh(note)
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
