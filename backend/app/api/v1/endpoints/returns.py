from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.returns import SaleReturn, SaleReturnItem, PurchaseReturn, PurchaseReturnItem
from app.models.product import Product
from app.models.customer import Customer, CustomerLedgerEntry
from app.models.supplier import Supplier
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
        if existing.customer_name == payload.customer_name and abs((existing.grand_total or 0.0) - payload.grand_total) < 0.5:
            return existing
        raise HTTPException(
            status_code=409,
            detail=f"Sale return collision: Voucher '{payload.return_no}' already exists in database with different items/customer."
        )

    sr_data = payload.model_dump(exclude={"items"})
    db_sr = SaleReturn(**sr_data)
    db.add(db_sr)
    db.flush()

    for item in payload.items:
        db_item = SaleReturnItem(sale_return_id=db_sr.id, **item.model_dump())
        db.add(db_item)
        # Restore stock on return atomically with row lock (Video 03)
        if item.product_id:
            prod = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
            if prod:
                prod.current_stock += item.qty

    # Post Credit Note to Customer Ledger if customer linked
    if db_sr.customer_id:
        cust = db.query(Customer).filter(Customer.id == db_sr.customer_id).with_for_update().first()
        if cust:
            # If payment mode is Credit or Adjust, reduce customer's outstanding balance
            if db_sr.payment_mode in ["Credit", "Adjust", "Credit Note"]:
                cust.current_balance = max(0.0, float(cust.current_balance or 0.0) - float(db_sr.grand_total or 0.0))
            
            # Record Credit Note entry
            credit_entry = CustomerLedgerEntry(
                customer_id=cust.id,
                date=db_sr.date,
                voucher_no=db_sr.return_no,
                particulars=f"Credit Note / Sale Return (Inv: {db_sr.original_invoice_no})",
                debit=0.0,
                credit=float(db_sr.grand_total or 0.0),
                balance=cust.current_balance or 0.0
            )
            db.add(credit_entry)

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
        if existing.supplier_name == payload.supplier_name and abs((existing.grand_total or 0.0) - payload.grand_total) < 0.5:
            return existing
        raise HTTPException(
            status_code=409,
            detail=f"Purchase return collision: Voucher '{payload.return_no}' already exists with different items/supplier."
        )

    pr_data = payload.model_dump(exclude={"items"})
    db_pr = PurchaseReturn(**pr_data)
    db.add(db_pr)
    db.flush()

    for item in payload.items:
        db_item = PurchaseReturnItem(purchase_return_id=db_pr.id, **item.model_dump())
        db.add(db_item)
        # Deduct stock on purchase return with row-level lock and availability check
        if item.product_id:
            prod = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
            if prod:
                if prod.current_stock < item.qty:
                    db.rollback()
                    raise HTTPException(
                        status_code=400,
                        detail=f"Insufficient godown stock for '{prod.name}' to process vendor return! Available: {prod.current_stock}, Returning: {item.qty}."
                    )
                prod.current_stock -= item.qty

    # Reduce accounts payable to supplier
    if db_pr.supplier_id:
        supp = db.query(Supplier).filter(Supplier.id == db_pr.supplier_id).with_for_update().first()
        if supp:
            supp.current_balance = max(0.0, float(supp.current_balance or 0.0) - float(db_pr.grand_total or 0.0))

    db.commit()
    db.refresh(db_pr)
    return db_pr
