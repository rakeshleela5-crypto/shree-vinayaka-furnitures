from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.inquiry import Inquiry
from app.schemas.inquiry import InquiryCreate, InquiryOut

router = APIRouter()

@router.post("/", response_model=InquiryOut, status_code=status.HTTP_201_CREATED)
def submit_inquiry(inquiry_in: InquiryCreate, db: Session = Depends(get_db)):
    inquiry = Inquiry(**inquiry_in.dict())
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)
    return inquiry

@router.get("/", response_model=List[InquiryOut])
def list_inquiries(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    inquiries = db.query(Inquiry).order_by(Inquiry.id.desc()).offset(skip).limit(limit).all()
    return inquiries

@router.patch("/{id}/status", response_model=InquiryOut)
def update_inquiry_status(id: int, new_status: str, db: Session = Depends(get_db)):
    inquiry = db.query(Inquiry).filter(Inquiry.id == id).first()
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    inquiry.status = new_status
    db.commit()
    db.refresh(inquiry)
    return inquiry
