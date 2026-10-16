from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class SupplierBase(BaseModel):
    code: str
    name: str
    company_name: Optional[str] = None
    gstin: Optional[str] = None
    state: str = "Kerala"
    state_code: str = "32"
    contact_no: str
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    bank_name: Optional[str] = None
    bank_ac_no: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_branch: Optional[str] = None
    credit_period_days: int = 30
    opening_balance: float = 0.0
    current_balance: float = 0.0
    active: bool = True

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    gstin: Optional[str] = None
    contact_no: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    current_balance: Optional[float] = None
    active: Optional[bool] = None

class SupplierResponse(SupplierBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class SupplierPaymentCreate(BaseModel):
    supplier_id: int
    voucher_no: str
    date: str
    amount: float
    payment_mode: str = "By Cash"
    bank_ac_no: Optional[str] = None
    details: Optional[str] = None

class SupplierPaymentResponse(SupplierPaymentCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
