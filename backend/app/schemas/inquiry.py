import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator

class InquiryCreate(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=150)
    phone: str = Field(..., min_length=8, max_length=25)
    email: Optional[str] = Field(default=None, max_length=150)
    city: Optional[str] = Field(default="Kozhikode", max_length=100)
    furniture_id: Optional[int] = None
    furniture_title: Optional[str] = Field(default=None, max_length=200)
    # Optional for CRM walk-in leads (default provided to satisfy DB NOT NULL constraint)
    message: Optional[str] = Field(default="Showroom Lead Intake Inquiry", max_length=2000)
    inquiry_type: Optional[str] = Field(default="quote", max_length=50)
    status: Optional[str] = Field(default="new", max_length=50)

    # CRM Lead Fields
    lead_status: Optional[str] = Field(default="HOT", max_length=50)
    source: Optional[str] = Field(default="WALK_IN", max_length=50)
    assigned_salesman: Optional[str] = Field(default="Arun Kumar (Senior Consultant)", max_length=150)
    estimated_budget: Optional[float] = 50000.0
    furniture_interest: Optional[str] = Field(default=None, max_length=300)  # CRM frontend field alias
    follow_up_date: Optional[str] = None
    notes: Optional[str] = None
    last_contacted_at: Optional[datetime.datetime] = None

    @field_validator("message", mode="before")
    @classmethod
    def ensure_message_not_empty(cls, v: Optional[str]) -> str:
        if not v or not str(v).strip():
            return "Showroom Lead Intake Inquiry"
        return str(v).strip()

    @field_validator("customer_name", "phone", "message", "furniture_title")
    @classmethod
    def sanitize_strings(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        cleaned = v.strip().replace("\x00", "").replace("<script", "&lt;script")
        return cleaned


class InquiryUpdate(BaseModel):
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    furniture_title: Optional[str] = None
    message: Optional[str] = None
    inquiry_type: Optional[str] = None
    status: Optional[str] = None
    lead_status: Optional[str] = None
    source: Optional[str] = None
    assigned_salesman: Optional[str] = None
    estimated_budget: Optional[float] = None
    furniture_interest: Optional[str] = None
    follow_up_date: Optional[str] = None
    notes: Optional[str] = None
    last_contacted_at: Optional[datetime.datetime] = None


class InquiryOut(InquiryCreate):
    id: int
    status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


CrmLeadResponse = InquiryOut

