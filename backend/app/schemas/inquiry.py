import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class InquiryCreate(BaseModel):
    customer_name: str
    phone: str
    email: Optional[str] = None
    furniture_id: Optional[int] = None
    furniture_title: Optional[str] = None
    message: str
    inquiry_type: Optional[str] = "quote"

class InquiryOut(InquiryCreate):
    id: int
    status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True
