from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.sale import SaleInvoice, SaleInvoiceItem, HeldCart, EstimateRecord, DeliveryNote
from app.models.product import Product
from app.schemas.sale import (
    SaleInvoiceCreate, SaleInvoiceResponse,
    HeldCartCreate, HeldCartResponse,
    EstimateCreate, EstimateResponse,
    DeliveryNoteCreate, DeliveryNoteResponse
)

router = APIRouter()

@router.get("/", response_model=List[SaleInvoiceResponse])
def get_sales_invoices(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return db.query(SaleInvoice).order_by(SaleInvoice.id.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=SaleInvoiceResponse)
def create_sale_invoice(payload: SaleInvoiceCreate, db: Session = Depends(get_db)):
    existing = db.query(SaleInvoice).filter(SaleInvoice.invoice_no == payload.invoice_no).first()
    if existing:
        return existing

    from datetime import datetime as dt
    invoice_dict = payload.model_dump(exclude={"items"})
    if not invoice_dict.get("date"):
        invoice_dict["date"] = invoice_dict.get("invoice_date") or dt.utcnow().strftime("%Y-%m-%d")

    # Map aliases if present
    if not invoice_dict.get("sub_total") and invoice_dict.get("gross_amount"):
        invoice_dict["sub_total"] = invoice_dict["gross_amount"]
    if not invoice_dict.get("cgst_total") and invoice_dict.get("cgst_amount"):
        invoice_dict["cgst_total"] = invoice_dict["cgst_amount"]
    if not invoice_dict.get("sgst_total") and invoice_dict.get("sgst_amount"):
        invoice_dict["sgst_total"] = invoice_dict["sgst_amount"]
    if not invoice_dict.get("igst_total") and invoice_dict.get("igst_amount"):
        invoice_dict["igst_total"] = invoice_dict["igst_amount"]

    inv_cols = {c.name for c in SaleInvoice.__table__.columns}
    filtered_inv = {k: v for k, v in invoice_dict.items() if k in inv_cols and v is not None}

    db_invoice = SaleInvoice(**filtered_inv)
    db.add(db_invoice)
    db.flush()

    item_cols = {c.name for c in SaleInvoiceItem.__table__.columns}
    for item_data in payload.items:
        raw_item = item_data.model_dump()
        if not raw_item.get("taxable_amount") and raw_item.get("taxable_value"):
            raw_item["taxable_amount"] = raw_item["taxable_value"]
        if not raw_item.get("total") and raw_item.get("net_amount"):
            raw_item["total"] = raw_item["net_amount"]
        if not raw_item.get("cgst_percent") and raw_item.get("cgst_rate"):
            raw_item["cgst_percent"] = raw_item["cgst_rate"]
        if not raw_item.get("sgst_percent") and raw_item.get("sgst_rate"):
            raw_item["sgst_percent"] = raw_item["sgst_rate"]
        if not raw_item.get("igst_percent") and raw_item.get("igst_rate"):
            raw_item["igst_percent"] = raw_item["igst_rate"]

        filtered_item = {k: v for k, v in raw_item.items() if k in item_cols and v is not None}
        db_item = SaleInvoiceItem(invoice_id=db_invoice.id, **filtered_item)
        db.add(db_item)
        
        # Deduct stock reactively (Videos 01 & 04)
        if item_data.product_id:
            prod = db.query(Product).filter(Product.id == item_data.product_id).first()
            if prod:
                prod.current_stock = max(0.0, prod.current_stock - item_data.qty)

    db.commit()
    db.refresh(db_invoice)
    return db_invoice


# Held Carts (Video 17 & 20)
@router.get("/held-carts", response_model=List[HeldCartResponse])
def get_held_carts(db: Session = Depends(get_db)):
    return db.query(HeldCart).order_by(HeldCart.id.desc()).all()

@router.post("/held-carts", response_model=HeldCartResponse)
def hold_cart(payload: HeldCartCreate, db: Session = Depends(get_db)):
    db_hold = HeldCart(**payload.model_dump())
    db.add(db_hold)
    db.commit()
    db.refresh(db_hold)
    return db_hold

@router.delete("/held-carts/{hold_id}")
def delete_held_cart(hold_id: str, db: Session = Depends(get_db)):
    cart = db.query(HeldCart).filter(HeldCart.hold_id == hold_id).first()
    if cart:
        db.delete(cart)
        db.commit()
    return {"message": "Held cart cleared"}

# Estimates (Video 16)
@router.get("/estimates", response_model=List[EstimateResponse])
def get_estimates(db: Session = Depends(get_db)):
    return db.query(EstimateRecord).order_by(EstimateRecord.id.desc()).all()

@router.post("/estimates", response_model=EstimateResponse)
def create_estimate(payload: EstimateCreate, db: Session = Depends(get_db)):
    est = EstimateRecord(**payload.model_dump())
    db.add(est)
    db.commit()
    db.refresh(est)
    return est

# Delivery Notes (Video 16)
@router.get("/delivery-notes", response_model=List[DeliveryNoteResponse])
def get_delivery_notes(db: Session = Depends(get_db)):
    return db.query(DeliveryNote).order_by(DeliveryNote.id.desc()).all()

@router.post("/delivery-notes", response_model=DeliveryNoteResponse)
def create_delivery_note(payload: DeliveryNoteCreate, db: Session = Depends(get_db)):
    dn = DeliveryNote(**payload.model_dump())
    db.add(dn)
    db.commit()
    db.refresh(dn)
    return dn
