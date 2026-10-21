import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.services.realtime import realtime_manager
from app.models.workshop import WorkshopJobCard
from app.models.sale import SaleInvoice
from app.schemas.workshop import (
    WorkshopJobCardCreate,
    WorkshopJobCardResponse,
    WorkshopJobCardStageUpdate
)

router = APIRouter()

VALID_STAGES = [
    "DESIGN_LOCKED",
    "WOOD_FRAME",
    "WEBBING_FOAM",
    "FABRIC_UPHOLSTERY",
    "QC_VERIFIED",
    "READY_FOR_DISPATCH"
]

def generate_next_job_card_no(db: Session) -> str:
    now = datetime.datetime.utcnow()
    # Compute Indian Financial Year e.g. 2026-2027 -> 2627
    fy_start = now.year if now.month >= 4 else now.year - 1
    fy_code = f"{str(fy_start)[-2:]}{str(fy_start + 1)[-2:]}"
    
    prefix = f"JC-{fy_code}-"
    last_card = db.query(WorkshopJobCard).filter(
        WorkshopJobCard.job_card_no.like(f"{prefix}%")
    ).order_by(WorkshopJobCard.id.desc()).first()

    if last_card and last_card.job_card_no:
        try:
            seq_part = int(last_card.job_card_no.replace(prefix, ""))
            new_seq = seq_part + 1
        except ValueError:
            new_seq = 1
    else:
        new_seq = 1

    return f"{prefix}{new_seq:04d}"


@router.get("/job-cards", response_model=List[WorkshopJobCardResponse])
def get_workshop_job_cards(
    stage: Optional[str] = Query(None, description="Filter by production stage"),
    invoice_no: Optional[str] = Query(None, description="Filter by invoice reference"),
    db: Session = Depends(get_db)
):
    """
    List all made-to-order Workshop Production Job Cards ordered by most recent.
    """
    query = db.query(WorkshopJobCard)
    if stage:
        query = query.filter(WorkshopJobCard.stage == stage)
    if invoice_no:
        query = query.filter(WorkshopJobCard.invoice_no == invoice_no)
    return query.order_by(WorkshopJobCard.id.desc()).all()


@router.post("/job-cards", response_model=WorkshopJobCardResponse)
def create_workshop_job_card(
    payload: WorkshopJobCardCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new Workshop Production Job Card for custom made-to-order furniture.
    Automatically links to Sale Invoice if provided, marking is_custom_mto = True.
    """
    jc_no = generate_next_job_card_no(db)
    date_str = payload.date or datetime.datetime.utcnow().strftime("%Y-%m-%d")

    job_card = WorkshopJobCard(
        job_card_no=jc_no,
        date=date_str,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        product_name=payload.product_name,
        invoice_no=payload.invoice_no,
        sale_invoice_id=payload.sale_invoice_id,
        customer_id=payload.customer_id,
        frame_wood=payload.frame_wood,
        cushioning=payload.cushioning,
        upholstery_code=payload.upholstery_code,
        dimensions_orientation=payload.dimensions_orientation,
        target_completion_date=payload.target_completion_date,
        delivery_promise_date=payload.delivery_promise_date,
        stage="DESIGN_LOCKED",
        technician_name=payload.technician_name,
        notes=payload.notes,
        estimated_cost=payload.estimated_cost,
        advance_paid=payload.advance_paid
    )
    db.add(job_card)
    db.flush()

    # Link to SaleInvoice if matching ID or invoice number is provided
    inv = None
    if payload.sale_invoice_id:
        inv = db.query(SaleInvoice).filter(SaleInvoice.id == payload.sale_invoice_id).first()
    elif payload.invoice_no:
        inv = db.query(SaleInvoice).filter(SaleInvoice.invoice_no == payload.invoice_no).first()

    if inv:
        inv.is_custom_mto = True
        inv.workshop_job_card_no = jc_no
        job_card.sale_invoice_id = inv.id
        job_card.invoice_no = inv.invoice_no

    db.commit()
    db.refresh(job_card)

    realtime_manager.broadcast_sync({
        "event": "WORKSHOP_UPDATED",
        "action": "JOB_CARD_CREATED",
        "job_card_no": job_card.job_card_no,
        "stage": job_card.stage,
        "product_name": job_card.product_name,
        "customer_name": job_card.customer_name,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })

    return job_card


@router.get("/job-cards/{card_id}", response_model=WorkshopJobCardResponse)
def get_workshop_job_card_detail(card_id: int, db: Session = Depends(get_db)):
    jc = db.query(WorkshopJobCard).filter(WorkshopJobCard.id == card_id).first()
    if not jc:
        raise HTTPException(status_code=404, detail="Workshop Job Card not found")
    return jc


@router.patch("/job-cards/{card_id}/stage", response_model=WorkshopJobCardResponse)
def update_job_card_stage(
    card_id: int,
    payload: WorkshopJobCardStageUpdate,
    db: Session = Depends(get_db)
):
    """
    Progress Workshop Job Card through its 6-stage lifecycle:
    DESIGN_LOCKED -> WOOD_FRAME -> WEBBING_FOAM -> FABRIC_UPHOLSTERY -> QC_VERIFIED -> READY_FOR_DISPATCH
    """
    jc = db.query(WorkshopJobCard).filter(WorkshopJobCard.id == card_id).with_for_update().first()
    if not jc:
        raise HTTPException(status_code=404, detail="Workshop Job Card not found")

    new_stage = payload.stage.strip().upper()
    if new_stage not in VALID_STAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid production stage '{new_stage}'. Must be one of: {VALID_STAGES}"
        )

    old_stage = jc.stage
    jc.stage = new_stage
    if payload.notes:
        jc.notes = (jc.notes or "") + f"\n[{datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M')}] Stage changed to {new_stage}: {payload.notes}"
    if payload.technician_name:
        jc.technician_name = payload.technician_name
    jc.updated_at = datetime.datetime.utcnow()

    # If stage reached READY_FOR_DISPATCH, transition linked invoice delivery state to PACKED
    if new_stage == "READY_FOR_DISPATCH" and jc.sale_invoice_id:
        inv = db.query(SaleInvoice).filter(SaleInvoice.id == jc.sale_invoice_id).first()
        if inv and inv.delivery_state == "BOOKED":
            inv.delivery_state = "PACKED"

    db.commit()
    db.refresh(jc)

    realtime_manager.broadcast_sync({
        "event": "WORKSHOP_UPDATED",
        "action": "STAGE_UPDATED",
        "job_card_no": jc.job_card_no,
        "old_stage": old_stage,
        "new_stage": jc.stage,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })

    return jc


@router.delete("/job-cards/{card_id}")
def cancel_workshop_job_card(card_id: int, db: Session = Depends(get_db)):
    jc = db.query(WorkshopJobCard).filter(WorkshopJobCard.id == card_id).first()
    if not jc:
        raise HTTPException(status_code=404, detail="Workshop Job Card not found")

    if jc.sale_invoice_id:
        inv = db.query(SaleInvoice).filter(SaleInvoice.id == jc.sale_invoice_id).first()
        if inv:
            inv.workshop_job_card_no = None

    card_no = jc.job_card_no
    db.delete(jc)
    db.commit()

    return {"status": "SUCCESS", "message": f"Workshop Job Card {card_no} deleted successfully"}
