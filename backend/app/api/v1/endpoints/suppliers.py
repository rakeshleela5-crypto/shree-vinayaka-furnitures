from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.supplier import Supplier, SupplierPayment
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse, SupplierPaymentCreate, SupplierPaymentResponse

router = APIRouter()

@router.get("/", response_model=List[SupplierResponse])
def get_suppliers(
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Supplier).filter(Supplier.active == True)
    if search:
        s = f"%{search}%"
        query = query.filter((Supplier.name.ilike(s)) | (Supplier.code.ilike(s)) | (Supplier.contact_no.ilike(s)))
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=SupplierResponse)
def create_supplier(payload: SupplierCreate, db: Session = Depends(get_db)):
    existing = db.query(Supplier).filter(Supplier.code == payload.code).first()
    if existing:
        for k, v in payload.model_dump().items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
    
    db_supplier = Supplier(**payload.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@router.get("/payments", response_model=List[SupplierPaymentResponse])
def get_supplier_payments(
    supplier_id: Optional[int] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(SupplierPayment)
    if supplier_id:
        query = query.filter(SupplierPayment.supplier_id == supplier_id)
    return query.order_by(SupplierPayment.id.desc()).offset(skip).limit(limit).all()

@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(supplier_id: int, payload: SupplierUpdate, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(supplier, k, v)
    db.commit()
    db.refresh(supplier)
    return supplier

@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    supplier.active = False
    db.commit()
    return {"message": "Supplier deleted successfully", "id": supplier_id}

@router.post("/payments", response_model=SupplierPaymentResponse)
def record_supplier_payment(payload: SupplierPaymentCreate, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == payload.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    payment = SupplierPayment(**payload.model_dump())
    supplier.current_balance = max(0.0, supplier.current_balance - payload.amount)
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

