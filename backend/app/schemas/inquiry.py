import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator

class InquiryCreate(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=150)
    phone: str = Field(..., min_length=8, max_length=25)
    email: Optional[str] = Field(default=None, max_length=150)
    furniture_id: Optional[int] = None
    furniture_title: Optional[str] = Field(default=None, max_length=200)
    message: str = Field(..., min_length=2, max_length=2000)
    inquiry_type: Optional[str] = Field(default="quote", max_length=50)

    @field_validator("customer_name", "phone", "message", "furniture_title")
    @classmethod
    def sanitize_strings(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        cleaned = v.strip().replace("\x00", "").replace("<script", "&lt;script")
        return cleaned

class InquiryOut(InquiryCreate):
    id: int
    status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True
