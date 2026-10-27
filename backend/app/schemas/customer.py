from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class CustomerBase(BaseModel):
    code: Optional[str] = None
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

class CustomerAgingRow(BaseModel):
    customer_id: int
    code: str
    name: str
    phone: str
    credit_limit: float
    current_balance: float
    total_unpaid_invoices_amount: float
    bucket_0_30: float
    bucket_31_60: float
    bucket_61_90: float
    bucket_91_120: float
    bucket_over_120: float
    oldest_overdue_days: int
    oldest_invoice_no: Optional[str] = None
    risk_level: str # "Current", "Notice", "Warning", "Critical"
    unpaid_invoices_count: int

class CustomerCreditAgingSummary(BaseModel):
    total_receivables: float
    total_customers_with_dues: int
    bucket_0_30_total: float
    bucket_31_60_total: float
    bucket_61_90_total: float
    bucket_91_120_total: float
    bucket_over_120_total: float
    high_risk_amount: float
    rows: list[CustomerAgingRow]

class CustomerInvoiceAgingItem(BaseModel):
    invoice_id: int
    invoice_no: str
    invoice_date: str
    days_overdue: int
    grand_total: float
    paid_amount: float
    balance_due: float
    bucket: str

class CustomerCreditAgingDetailResponse(BaseModel):
    customer_id: int
    name: str
    code: str
    phone: str
    credit_limit: float
    current_balance: float
    oldest_overdue_days: int
    invoices: list[CustomerInvoiceAgingItem]

class PaymentReminderResponse(BaseModel):
    customer_id: int
    customer_name: str
    phone: str
    total_due: float
    oldest_overdue_days: int
    message_text: str
    whatsapp_url: str


class CustomerWishlistBase(BaseModel):
    product_id: int
    customer_id: Optional[int] = None
    customer_phone: Optional[str] = None
    session_id: Optional[str] = None


class CustomerWishlistCreate(CustomerWishlistBase):
    pass


class CustomerWishlistResponse(CustomerWishlistBase):
    id: int
    created_at: datetime
    product_title: Optional[str] = None
    product_price: Optional[float] = None
    product_image: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class CustomerReceiptBase(BaseModel):
    receipt_no: str
    customer_id: int
    amount: float
    payment_mode: str = "Cash"
    bank_ac_no: Optional[str] = None
    transaction_ref: Optional[str] = None
    remarks: Optional[str] = None
    date: str


class CustomerReceiptCreate(CustomerReceiptBase):
    pass


class CustomerReceiptResponse(CustomerReceiptBase):
    id: int
    created_at: datetime
    customer_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

