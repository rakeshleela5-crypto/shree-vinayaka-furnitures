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
    balance: float = 0.0
    utr_number: Optional[str] = None

class BankStatementEntryResponse(BankStatementEntryCreate):
    id: int
    status: str = "Unreconciled"
    reconciled_party_type: Optional[str] = None
    reconciled_party_id: Optional[int] = None
    reconciled_party_name: Optional[str] = None
    reconciled_ref_no: Optional[str] = None
    reconciled_at: Optional[datetime] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class BankStatementBulkUploadPayload(BaseModel):
    account_no: str
    entries: list[BankStatementEntryCreate]

class ReconciliationCandidate(BaseModel):
    party_type: str # Customer or Supplier
    party_id: int
    party_code: str
    party_name: str
    phone: Optional[str] = None
    invoice_id: Optional[int] = None
    invoice_no: Optional[str] = None
    invoice_date: Optional[str] = None
    amount_due: float
    confidence_score: int # 0 to 100
    match_reason: str

class BankReconciliationCandidatesResponse(BaseModel):
    entry_id: int
    date: str
    description: str
    amount: float
    type: str # "Credit" or "Debit"
    utr_number: Optional[str] = None
    candidates: list[ReconciliationCandidate]

class BankReconcileRequest(BaseModel):
    entry_id: int
    party_type: str # "Customer", "Supplier", "Expense", "Direct"
    party_id: Optional[int] = None
    invoice_id: Optional[int] = None
    ref_no: Optional[str] = None
    notes: Optional[str] = None


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

