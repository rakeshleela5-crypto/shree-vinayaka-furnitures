from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.purchase import PurchaseInvoice, PurchaseInvoiceItem
from app.models.product import Product
from app.models.supplier import Supplier
from app.schemas.purchase import PurchaseInvoiceCreate, PurchaseInvoiceResponse

router = APIRouter()

@router.get("/", response_model=List[PurchaseInvoiceResponse])
def get_purchases(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(PurchaseInvoice).order_by(PurchaseInvoice.id.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=PurchaseInvoiceResponse)
def create_purchase(payload: PurchaseInvoiceCreate, db: Session = Depends(get_db)):
    existing = db.query(PurchaseInvoice).filter(PurchaseInvoice.invoice_no == payload.invoice_no).first()
    if existing:
        raise HTTPException(status_code=400, detail="Purchase invoice already exists")

    purchase_data = payload.model_dump(exclude={"items"})
    db_purchase = PurchaseInvoice(**purchase_data)
    db.add(db_purchase)
    db.flush()

    for item_data in payload.items:
        db_item = PurchaseInvoiceItem(purchase_id=db_purchase.id, **item_data.model_dump())
        db.add(db_item)
        
        # Increase stock reactively (Video 06 & 01)
        if item_data.product_id:
            prod = db.query(Product).filter(Product.id == item_data.product_id).first()
            if prod:
                prod.current_stock += item_data.qty
                prod.purchase_price = item_data.purchase_price
                if item_data.retail_price > 0:
                    prod.retail_price = item_data.retail_price

    # Update supplier balance
    supplier = db.query(Supplier).filter(Supplier.id == payload.supplier_id).first()
    if supplier:
        supplier.current_balance += payload.grand_total

    db.commit()
    db.refresh(db_purchase)
    return db_purchase
