from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.inquiry import Inquiry
from app.models.sale import Quotation
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

@router.post("/{id}/convert-to-quotation")
def convert_inquiry_to_quotation(id: int, db: Session = Depends(get_db)):
    """
    Direct Lead-to-Quotation conversion.
    Converts a web or showroom customer inquiry into an official Price Quotation.
    """
    inquiry = db.query(Inquiry).filter(Inquiry.id == id).first()
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")

    import json, datetime
    today_str = datetime.date.today().isoformat()
    q_no = f"QUOT-INQ-{inquiry.id}-{int(datetime.datetime.utcnow().timestamp()) % 10000:04d}"
    
    title = inquiry.furniture_title or inquiry.message or "Custom Furniture Request"
    items_data = [{
        "product_name": title,
        "qty": 1.0,
        "rate": 0.0,
        "total": 0.0,
        "hsn_code": "9403"
    }]

    quotation = Quotation(
        quotation_no=q_no,
        date=today_str,
        customer_name=inquiry.customer_name,
        contact_no=inquiry.phone,
        state="Kerala",
        remarks=f"Generated from Customer Inquiry #{inquiry.id}: {inquiry.message}",
        sub_total=0.0,
        grand_total=0.0,
        items_json=json.dumps(items_data)
    )
    db.add(quotation)
    inquiry.status = "quoted"
    db.commit()
    db.refresh(quotation)
    return {
        "status": "SUCCESS",
        "message": f"Inquiry #{inquiry.id} successfully converted to Quotation {quotation.quotation_no}",
        "quotation_id": quotation.id,
        "quotation_no": quotation.quotation_no,
        "customer_name": quotation.customer_name,
        "contact_no": quotation.contact_no,
        "inquiry_status": inquiry.status
    }


@router.put("/{id}", response_model=InquiryOut)
def update_inquiry(id: int, payload: InquiryCreate, db: Session = Depends(get_db)):
    """
    Update inquiry or CRM lead details in PostgreSQL.
    """
    inquiry = db.query(Inquiry).filter(Inquiry.id == id).first()
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")

    for k, v in payload.dict(exclude_unset=True).items():
        setattr(inquiry, k, v)

    db.commit()
    db.refresh(inquiry)
    return inquiry


@router.delete("/{id}")
def delete_inquiry(id: int, db: Session = Depends(get_db)):
    """
    Permanently delete an inquiry or CRM lead from PostgreSQL.
    """
    inquiry = db.query(Inquiry).filter(Inquiry.id == id).first()
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")

    db.delete(inquiry)
    db.commit()
    return {"status": "SUCCESS", "message": f"Inquiry #{id} deleted successfully"}
