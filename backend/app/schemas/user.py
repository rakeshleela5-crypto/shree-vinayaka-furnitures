from pydantic import BaseModel, ConfigDict
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
    permissions: Optional[UserControlPermissionResponse] = None
    model_config = ConfigDict(from_attributes=True)

class SalesmanCreate(BaseModel):
    code: str
    name: str
    phone: Optional[str] = None
    commission_percent: float = 2.0
    active: bool = True

class SalesmanResponse(SalesmanCreate):
    id: int
    total_sales: float = 0.0
    total_commission: float = 0.0
    paid_commission: float = 0.0
    balance_commission: float = 0.0
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
