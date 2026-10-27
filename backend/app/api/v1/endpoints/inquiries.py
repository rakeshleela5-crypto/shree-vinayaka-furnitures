from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.inquiry import Inquiry
from app.models.sale import Quotation
from app.schemas.inquiry import InquiryCreate, InquiryOut, InquiryUpdate, CrmLeadResponse

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
    limit: int = 500,
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    lead_status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Inquiry)
    if search:
        s = f"%{search}%"
        query = query.filter((Inquiry.customer_name.ilike(s)) | (Inquiry.phone.ilike(s)) | (Inquiry.city.ilike(s)))
    if status:
        query = query.filter(Inquiry.status == status)
    if lead_status:
        query = query.filter(Inquiry.lead_status == lead_status)
    return query.order_by(Inquiry.id.desc()).offset(skip).limit(limit).all()


# CRM Leads Dedicated Endpoints
@router.get("/crm-leads", response_model=List[CrmLeadResponse])
def get_crm_leads(
    lead_status: Optional[str] = Query(None),
    salesman: Optional[str] = Query(None),
    limit: int = 500,
    db: Session = Depends(get_db)
):
    query = db.query(Inquiry)
    if lead_status:
        query = query.filter(Inquiry.lead_status == lead_status)
    if salesman:
        query = query.filter(Inquiry.assigned_salesman.ilike(f"%{salesman}%"))
    return query.order_by(Inquiry.id.desc()).limit(limit).all()


@router.post("/crm-leads", response_model=CrmLeadResponse, status_code=status.HTTP_201_CREATED)
def create_crm_lead(payload: InquiryCreate, db: Session = Depends(get_db)):
    lead = Inquiry(**payload.dict())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.put("/crm-leads/{id}", response_model=CrmLeadResponse)
def update_crm_lead(id: int, payload: InquiryUpdate, db: Session = Depends(get_db)):
    lead = db.query(Inquiry).filter(Inquiry.id == id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CRM Lead not found")
    for k, v in payload.dict(exclude_unset=True).items():
        if v is not None:
            setattr(lead, k, v)
    db.commit()
    db.refresh(lead)
    return lead


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
def update_inquiry(id: int, payload: InquiryUpdate, db: Session = Depends(get_db)):
    """
    Update inquiry or CRM lead details in PostgreSQL.
    """
    inquiry = db.query(Inquiry).filter(Inquiry.id == id).first()
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")

    for k, v in payload.dict(exclude_unset=True).items():
        if v is not None:
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

