from pydantic import BaseModel, ConfigDict, model_validator
from typing import Optional
from datetime import datetime

class UserLoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    full_name: str
    password: str
    user_type: str = "Salesman" # Admin / Salesman / Cashier / Manager
    email: Optional[str] = None
    contact_no: Optional[str] = None
    active: bool = True

class UserControlPermissionUpdate(BaseModel):
    can_edit_sale_price: bool = False
    can_give_discount: bool = False
    can_void_bill: bool = False
    can_access_records: bool = True
    can_access_reports: bool = False
    can_access_master: bool = False
    can_access_settings: bool = False
    can_access_backup: bool = False

class UserControlPermissionResponse(UserControlPermissionUpdate):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)

class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    user_type: str
    email: Optional[str] = None
    contact_no: Optional[str] = None
    active: bool
    created_at: datetime
    access_token: Optional[str] = "jwt_svf_session_token"
    permissions: Optional[UserControlPermissionResponse] = None
    model_config = ConfigDict(from_attributes=True)

class SalesmanCreate(BaseModel):
    code: Optional[str] = None
    salesman_code: Optional[str] = None
    name: str
    phone: Optional[str] = None
    contact_no: Optional[str] = None
    commission_percent: float = 2.0
    active: bool = True

    @model_validator(mode="before")
    @classmethod
    def resolve_aliases(cls, data):
        if isinstance(data, dict):
            if not data.get("code") and data.get("salesman_code"):
                data["code"] = data["salesman_code"]
            if not data.get("phone") and data.get("contact_no"):
                data["phone"] = data["contact_no"]
            if not data.get("code") and data.get("name"):
                data["code"] = f"SM-{data['name'][:3].upper()}"
        return data

class SalesmanResponse(BaseModel):
    id: int
    code: str
    name: str
    phone: Optional[str] = None
    commission_percent: float = 2.0
    active: bool = True
    total_sales: float = 0.0
    total_commission: float = 0.0
    paid_commission: float = 0.0
    balance_commission: float = 0.0
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class SalesmanPayoutRequest(BaseModel):
    amount: float
    payment_mode: str = "Cash"
    remarks: Optional[str] = None
    date: Optional[str] = None

class SalesmanPayoutVoidRequest(BaseModel):
    amount: float
    voucher_no: Optional[str] = None
    remarks: Optional[str] = None


class SalesmanPaymentVoucherBase(BaseModel):
    voucher_no: str
    salesman_id: int
    salesman_name: str
    salesman_phone: Optional[str] = None
    date: str
    amount: float
    payment_mode: str = "Cash"
    bank_ac_no: Optional[str] = None
    transaction_ref: Optional[str] = None
    narration: Optional[str] = None


class SalesmanPaymentVoucherCreate(SalesmanPaymentVoucherBase):
    pass


class SalesmanPaymentVoucherResponse(SalesmanPaymentVoucherBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SalesmanLedgerEntryBase(BaseModel):
    salesman_id: int
    date: str
    voucher_no: str
    invoice_no: Optional[str] = None
    particulars: str
    debit: float = 0.0
    credit: float = 0.0
    balance: float = 0.0


class SalesmanLedgerEntryCreate(SalesmanLedgerEntryBase):
    pass


class SalesmanLedgerEntryResponse(SalesmanLedgerEntryBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


