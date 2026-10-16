from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class CustomerBase(BaseModel):
    code: str
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: str = "Kerala"
    state_code: str = "32"
    gstin: Optional[str] = None
    credit_limit: float = 50000.0
    opening_balance: float = 0.0
    current_balance: float = 0.0
    loyalty_points: float = 0.0
    active: bool = True

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    gstin: Optional[str] = None
    credit_limit: Optional[float] = None
    current_balance: Optional[float] = None
    loyalty_points: Optional[float] = None
    active: Optional[bool] = None

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CustomerLedgerEntryResponse(BaseModel):
    id: int
    customer_id: int
    date: str
    voucher_no: str
    particulars: str
    debit: float
    credit: float
    balance: float
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class LoyaltyTransactionResponse(BaseModel):
    id: int
    customer_id: int
    date: str
    bill_no: str
    type: str
    bill_amount: float
    points: float
    point_value_rate: float
    equivalent_amount: float
    balance_points_after: float
    remarks: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
