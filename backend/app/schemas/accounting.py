from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AccountHeadCreate(BaseModel):
    name: str
    under_group: str
    active: bool = True

class AccountHeadResponse(AccountHeadCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ExpenseVoucherCreate(BaseModel):
    voucher_no: str
    date: str
    name: str
    details: Optional[str] = None
    payment_mode: str = "Cash"
    bank_ac_no: Optional[str] = None
    grand_total: float
    items_json: str

class ExpenseVoucherResponse(ExpenseVoucherCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class IncomeVoucherCreate(BaseModel):
    voucher_no: str
    date: str
    name: str
    details: Optional[str] = None
    payment_mode: str = "Cash"
    bank_ac_no: Optional[str] = None
    grand_total: float
    items_json: str

class IncomeVoucherResponse(IncomeVoucherCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class BankStatementEntryCreate(BaseModel):
    date: str
    account_no: str
    receipt_no: Optional[str] = None
    description: str
    debit: float = 0.0
    credit: float = 0.0

class BankStatementEntryResponse(BankStatementEntryCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
