from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.returns import SaleReturn, SaleReturnItem, PurchaseReturn, PurchaseReturnItem
from app.models.product import Product
from app.schemas.returns import (
    SaleReturnCreate, SaleReturnResponse,
    PurchaseReturnCreate, PurchaseReturnResponse
)

router = APIRouter()

@router.get("/sales", response_model=List[SaleReturnResponse])
def get_sale_returns(db: Session = Depends(get_db)):
    return db.query(SaleReturn).order_by(SaleReturn.id.desc()).all()

@router.post("/sales", response_model=SaleReturnResponse)
def create_sale_return(payload: SaleReturnCreate, db: Session = Depends(get_db)):
    existing = db.query(SaleReturn).filter(SaleReturn.return_no == payload.return_no).first()
    if existing:
        raise HTTPException(status_code=400, detail="Return number already exists")

    sr_data = payload.model_dump(exclude={"items"})
    db_sr = SaleReturn(**sr_data)
    db.add(db_sr)
    db.flush()

    for item in payload.items:
        db_item = SaleReturnItem(sale_return_id=db_sr.id, **item.model_dump())
        db.add(db_item)
        # Restore stock on return (Video 03)
        if item.product_id:
            prod = db.query(Product).filter(Product.id == item.product_id).first()
            if prod:
                prod.current_stock += item.qty

    db.commit()
    db.refresh(db_sr)
    return db_sr

@router.get("/purchases", response_model=List[PurchaseReturnResponse])
def get_purchase_returns(db: Session = Depends(get_db)):
    return db.query(PurchaseReturn).order_by(PurchaseReturn.id.desc()).all()

@router.post("/purchases", response_model=PurchaseReturnResponse)
def create_purchase_return(payload: PurchaseReturnCreate, db: Session = Depends(get_db)):
    existing = db.query(PurchaseReturn).filter(PurchaseReturn.return_no == payload.return_no).first()
    if existing:
        raise HTTPException(status_code=400, detail="Purchase return number already exists")

    pr_data = payload.model_dump(exclude={"items"})
    db_pr = PurchaseReturn(**pr_data)
    db.add(db_pr)
    db.flush()

    for item in payload.items:
        db_item = PurchaseReturnItem(purchase_return_id=db_pr.id, **item.model_dump())
        db.add(db_item)
        # Deduct stock on purchase return
        if item.product_id:
            prod = db.query(Product).filter(Product.id == item.product_id).first()
            if prod:
                prod.current_stock = max(0.0, prod.current_stock - item.qty)

    db.commit()
    db.refresh(db_pr)
    return db_pr
