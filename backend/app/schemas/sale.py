from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class SaleInvoiceItemBase(BaseModel):
    product_id: Optional[int] = None
    p_code: Optional[str] = None
    product_name: str
    barcode: Optional[str] = None
    hsn_code: Optional[str] = None
    batch_no: Optional[str] = None
    serial_no: Optional[str] = None
    qty: float = 1.0
    rate: float = 0.0
    mrp: float = 0.0
    purchase_rate: float = 0.0
    discount_percent: float = 0.0
    discount_amount: float = 0.0
    taxable_amount: float = 0.0
    taxable_value: Optional[float] = 0.0
    cgst_percent: float = 0.0
    cgst_rate: Optional[float] = 0.0
    cgst_amount: float = 0.0
    sgst_percent: float = 0.0
    sgst_rate: Optional[float] = 0.0
    sgst_amount: float = 0.0
    igst_percent: float = 0.0
    igst_rate: Optional[float] = 0.0
    igst_amount: float = 0.0
    cess_percent: float = 0.0
    cess_amount: float = 0.0
    total: float = 0.0
    net_amount: Optional[float] = 0.0
    salesman_commission_percent: float = 0.0
    salesman_commission_amount: float = 0.0

class SaleInvoiceItemCreate(SaleInvoiceItemBase):
    pass

class SaleInvoiceItemResponse(SaleInvoiceItemBase):
    id: int
    invoice_id: int
    model_config = ConfigDict(from_attributes=True)

class SaleInvoiceBase(BaseModel):
    invoice_no: str
    date: Optional[str] = None
    invoice_date: Optional[str] = None
    time: Optional[str] = None
    bill_type: str = "Cash"
    customer_id: Optional[int] = None
    customer_name: str = "Cash Customer"
    customer_phone: Optional[str] = None
    customer_gstin: Optional[str] = None
    state: str = "Kerala"
    state_code: str = "32"
    sub_total: float = 0.0
    gross_amount: Optional[float] = 0.0
    bill_discount: float = 0.0
    discount_amount: Optional[float] = 0.0
    coupon_discount: float = 0.0
    gift_voucher_discount: Optional[float] = 0.0
    loyalty_redeemed_amt: float = 0.0
    sale_return_adjusted_amt: float = 0.0
    taxable_amount: Optional[float] = 0.0
    cgst_total: float = 0.0
    cgst_amount: Optional[float] = 0.0
    sgst_total: float = 0.0
    sgst_amount: Optional[float] = 0.0
    igst_total: float = 0.0
    igst_amount: Optional[float] = 0.0
    cess_total: float = 0.0
    round_off: float = 0.0
    grand_total: float = 0.0
    paid_amount: float = 0.0
    balance_due: float = 0.0
    payment_mode: str = "Cash"
    salesman_id: Optional[int] = None
    salesman_code: Optional[str] = None
    status: str = "Completed"


class SaleInvoiceCreate(SaleInvoiceBase):
    items: List[SaleInvoiceItemCreate]

class SaleInvoiceResponse(SaleInvoiceBase):
    id: int
    created_at: datetime
    items: List[SaleInvoiceItemResponse] = []
    eway_bill_required: bool = False
    model_config = ConfigDict(from_attributes=True)

class HeldCartCreate(BaseModel):
    hold_id: str
    time: str
    customer_name: str = "Walk-in Customer"
    phone: Optional[str] = None
    items_count: int = 0
    total_amount: float = 0.0
    cart_json: str

class HeldCartResponse(HeldCartCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class EstimateCreate(BaseModel):
    estimate_no: str
    date: str
    customer_id: Optional[int] = None
    customer_name: str
    contact_no: Optional[str] = None
    address: Optional[str] = None
    state: str = "Kerala"
    gstin: Optional[str] = None
    sub_total: float = 0.0
    discount: float = 0.0
    round_off: float = 0.0
    grand_total: float = 0.0
    items_json: str
    status: str = "Active"

class EstimateResponse(EstimateCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DeliveryNoteCreate(BaseModel):
    delivery_note_no: str
    date: str
    customer_id: Optional[int] = None
    customer_name: str
    contact_no: Optional[str] = None
    delivery_address: str
    state: str = "Kerala"
    vehicle_no: Optional[str] = None
    transporter_name: Optional[str] = None
    status: str = "Dispatched"
    invoice_no: Optional[str] = None
    grand_total: float = 0.0
    items_json: str

class DeliveryNoteResponse(DeliveryNoteCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DeliveryNoteUpdate(BaseModel):
    status: Optional[str] = None
    vehicle_no: Optional[str] = None
    transporter_name: Optional[str] = None
    delivery_address: Optional[str] = None


class QuotationCreate(BaseModel):
    quotation_no: str
    date: str
    customer_id: Optional[str] = None
    customer_name: str
    contact_no: Optional[str] = None
    state: str = "Kerala"
    gstin: Optional[str] = None
    remarks: Optional[str] = None
    sub_total: float = 0.0
    cgst: float = 0.0
    sgst: float = 0.0
    igst: float = 0.0
    cess: float = 0.0
    total_discount: float = 0.0
    round_off: float = 0.0
    grand_total: float = 0.0
    items_json: str

class QuotationResponse(QuotationCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

