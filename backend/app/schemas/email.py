from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

class EmailConfigBase(BaseModel):
    server_name: Optional[str] = "Gmail"
    smtp_address: str = "smtp.gmail.com"
    email_id: str = "shreevinayakafurnitures@gmail.com"
    password: Optional[str] = ""
    port: int = 587
    tls_ssl_required: str = "Yes"
    is_default: bool = True
    is_enabled: bool = True
    sender_name: Optional[str] = "Shree Vinayaka Furnitures"

class EmailConfigCreate(EmailConfigBase):
    pass

class EmailConfigUpdate(BaseModel):
    server_name: Optional[str] = None
    smtp_address: Optional[str] = None
    email_id: Optional[str] = None
    password: Optional[str] = None
    port: Optional[int] = None
    tls_ssl_required: Optional[str] = None
    is_default: Optional[bool] = None
    is_enabled: Optional[bool] = None
    sender_name: Optional[str] = None

class EmailConfigOut(BaseModel):
    id: int
    server_name: str
    smtp_address: str
    email_id: str
    port: int
    tls_ssl_required: str
    is_default: bool
    is_enabled: bool
    sender_name: str
    has_password: bool
    password_masked: str
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class EmailTestRequest(BaseModel):
    server_name: Optional[str] = "Gmail"
    smtp_address: str = "smtp.gmail.com"
    email_id: str
    password: str
    port: int = 587
    tls_ssl_required: Optional[str] = "Yes"

class EmailTestResponse(BaseModel):
    success: bool
    message: str
    server_name: Optional[str] = None
    smtp_address: Optional[str] = None
    port: Optional[int] = None
    email_id: Optional[str] = None

class EmailSendRequest(BaseModel):
    to_email: str
    subject: str
    message: Optional[str] = None
    html_content: Optional[str] = None

class InvoiceEmailRequest(BaseModel):
    to_email: str
    custom_message: Optional[str] = None
    subject: Optional[str] = None
