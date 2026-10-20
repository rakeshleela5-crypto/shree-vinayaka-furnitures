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


class JournalLineBase(BaseModel):
    account_name: str
    debit: float = 0.0
    credit: float = 0.0
    description: Optional[str] = None
    entity_type: Optional[str] = None # CUSTOMER, SUPPLIER, EXPENSE, TAX
    entity_id: Optional[int] = None

class JournalLineCreate(JournalLineBase):
    pass

class JournalLineResponse(JournalLineBase):
    id: int
    journal_entry_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class JournalEntryBase(BaseModel):
    entry_number: str
    entry_date: str
    entry_type: str # SALE, PURCHASE, PAYMENT, RECEIPT, CONTRA, JOURNAL, CREDIT_NOTE
    narration: Optional[str] = None
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    total_amount: float = 0.0

class JournalEntryCreate(JournalEntryBase):
    lines: list[JournalLineCreate]

class JournalEntryResponse(JournalEntryBase):
    id: int
    is_posted: bool = True
    created_at: datetime
    lines: list[JournalLineResponse] = []
    model_config = ConfigDict(from_attributes=True)

class InvoiceAllocationItem(BaseModel):
    invoice_id: int
    invoice_no: str
    allocated_amount: float
    previous_balance: float
    new_balance: float
    payment_status: str # PAID, PARTIALLY_PAID

class CustomerKhataReceiptRequest(BaseModel):
    customer_id: int
    amount: float
    payment_mode: str = "CASH" # CASH, UPI, CARD, BANK_TRANSFER
    reference_no: Optional[str] = None
    invoice_ids: Optional[list[int]] = None # If None/empty, allocated FIFO
    notes: Optional[str] = None

class CustomerKhataReceiptResponse(BaseModel):
    receipt_no: str
    customer_id: int
    customer_name: str
    amount_received: float
    customer_previous_balance: float
    customer_new_balance: float
    allocated_invoices: list[InvoiceAllocationItem] = []
    journal_entry_id: Optional[int] = None
    created_at: datetime

class SupplierPaymentRequest(BaseModel):
    supplier_id: int
    amount: float
    payment_mode: str = "BANK_TRANSFER"
    bank_ac_no: Optional[str] = None
    reference_no: Optional[str] = None
    notes: Optional[str] = None

class SupplierPaymentResponse(BaseModel):
    voucher_no: str
    supplier_id: int
    supplier_name: str
    amount_paid: float
    supplier_previous_balance: float
    supplier_new_balance: float
    journal_entry_id: Optional[int] = None
    created_at: datetime

class LiveLedgerBalancesResponse(BaseModel):
    cash_in_hand: float
    bank_upi: float
    finance_receivable: float
    accounts_receivable: float
    accounts_payable: float
    gst_output_cgst: float
    gst_output_sgst: float
    gst_output_igst: float
    gst_input_itc: float
    sales_revenue: float
    total_debit: float
    total_credit: float

