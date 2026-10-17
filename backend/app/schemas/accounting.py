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
    name: str = "General Expense"
    details: Optional[str] = None
    payment_mode: str = "Cash"
    bank_ac_no: Optional[str] = None
    grand_total: float = 0.0
    items_json: str = "[]"

class ExpenseVoucherResponse(ExpenseVoucherCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class IncomeVoucherCreate(BaseModel):
    voucher_no: str
    date: str
    name: str = "General Income"
    details: Optional[str] = None
    payment_mode: str = "Cash"
    bank_ac_no: Optional[str] = None
    grand_total: float = 0.0
    items_json: str = "[]"

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


class ShiftSettlementCreate(BaseModel):
    shift_code: str
    date: str
    cashier_name: str
    terminal_id: str = "POS-01"
    opening_cash: float = 0.0
    total_sales_amount: float = 0.0
    cash_sales: float = 0.0
    card_sales: float = 0.0
    upi_sales: float = 0.0
    credit_sales: float = 0.0
    cash_expenses: float = 0.0
    expected_drawer_cash: float = 0.0
    actual_physical_cash: float = 0.0
    cash_difference: float = 0.0
    total_bills_count: int = 0
    status: str = "Closed"
    notes: Optional[str] = None


class ShiftSettlementResponse(ShiftSettlementCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

