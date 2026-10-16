from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class CompanyProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    state_code: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    currency_symbol: Optional[str] = None
    financial_year: Optional[str] = None
    loyalty_per_point_value: Optional[float] = None
    bank_name: Optional[str] = None
    bank_ac_no: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_branch: Optional[str] = None
    invoice_header_note: Optional[str] = None
    invoice_footer_note: Optional[str] = None
    logo_url: Optional[str] = None

class CompanyProfileResponse(BaseModel):
    id: int
    company_name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: str = "Kerala"
    state_code: str = "32"
    pincode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    currency_symbol: str = "₹"
    financial_year: str = "2024-2025"
    loyalty_per_point_value: float = 0.10
    bank_name: Optional[str] = None
    bank_ac_no: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_branch: Optional[str] = None
    invoice_header_note: Optional[str] = None
    invoice_footer_note: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: bool = True
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CompanyTenantCreate(BaseModel):
    code: str
    name: str
    legal_name: Optional[str] = None
    gstin: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: str = "Kerala"
    db_key: str
    is_default: bool = False
    active: bool = True

class CompanyTenantResponse(CompanyTenantCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DocumentPrefixSuffixResponse(BaseModel):
    id: int
    doc_type: str
    prefix: str
    suffix: str
    next_number: int
    padding_zeros: int
    model_config = ConfigDict(from_attributes=True)
