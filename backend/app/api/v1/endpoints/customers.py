from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.customer import Customer, CustomerLedgerEntry, LoyaltyTransaction
from app.schemas.customer import (
    CustomerCreate, CustomerUpdate, CustomerResponse,
    CustomerLedgerEntryResponse, LoyaltyTransactionResponse
)

router = APIRouter()

@router.get("/", response_model=List[CustomerResponse])
def get_customers(
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Customer).filter(Customer.active == True)
    if search:
        s = f"%{search}%"
        query = query.filter((Customer.name.ilike(s)) | (Customer.phone.ilike(s)) | (Customer.code.ilike(s)))
    return query.offset(skip).limit(limit).all()

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.post("/", response_model=CustomerResponse)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    existing = db.query(Customer).filter(Customer.code == payload.code).first()
    if existing:
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    
    db_customer = Customer(**payload.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: int, payload: CustomerUpdate, db: Session = Depends(get_db)):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_customer, key, value)
    
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if db_customer:
        db_customer.active = False
        db.commit()
    return {"message": "Customer deactivated successfully"}

# Customer Account Ledger (Video 07 & 20)
@router.get("/{customer_id}/ledger", response_model=List[CustomerLedgerEntryResponse])
def get_customer_ledger(customer_id: int, db: Session = Depends(get_db)):
    return db.query(CustomerLedgerEntry).filter(CustomerLedgerEntry.customer_id == customer_id).order_by(CustomerLedgerEntry.id.desc()).all()

@router.post("/{customer_id}/ledger", response_model=CustomerLedgerEntryResponse)
def add_customer_ledger_entry(customer_id: int, payload: dict, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).with_for_update().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    debit = float(payload.get("debit", 0.0))
    credit = float(payload.get("credit", 0.0))
    customer.current_balance = float(customer.current_balance or 0.0) + debit - credit
    
    entry = CustomerLedgerEntry(
        customer_id=customer_id,
        date=payload.get("date", ""),
        voucher_no=payload.get("voucher_no", ""),
        particulars=payload.get("particulars", ""),
        debit=debit,
        credit=credit,
        balance=customer.current_balance
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

# Customer Loyalty Transactions (Video 09 & 13)
@router.get("/{customer_id}/loyalty", response_model=List[LoyaltyTransactionResponse])
def get_customer_loyalty(customer_id: int, db: Session = Depends(get_db)):
    return db.query(LoyaltyTransaction).filter(LoyaltyTransaction.customer_id == customer_id).order_by(LoyaltyTransaction.id.desc()).all()

@router.post("/{customer_id}/loyalty", response_model=LoyaltyTransactionResponse)
def add_customer_loyalty_transaction(customer_id: int, payload: dict, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).with_for_update().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    pts = float(payload.get("points", 0.0))
    if payload.get("type") == "Redeemed":
        customer.loyalty_points = max(0.0, float(customer.loyalty_points or 0.0) - pts)
    else:
        customer.loyalty_points = float(customer.loyalty_points or 0.0) + pts
        
    tx = LoyaltyTransaction(
        customer_id=customer_id,
        date=payload.get("date", ""),
        bill_no=payload.get("bill_no", ""),
        type=payload.get("type", "Earned"),
        bill_amount=float(payload.get("bill_amount", 0.0)),
        points=pts,
        point_value_rate=float(payload.get("point_value_rate", 0.10)),
        equivalent_amount=float(payload.get("equivalent_amount", 0.0)),
        balance_points_after=customer.loyalty_points,
        remarks=payload.get("remarks")
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx
