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
    allow_negative_stock: bool = False
    is_advance_booking: bool = False
    is_custom_mto: bool = False
    workshop_job_card_no: Optional[str] = None
    advance_adjusted: float = 0.0
    tax_inclusive: bool = True
    sell_from_display: bool = False
    payment_splits_json: Optional[str] = None
    utr_number: Optional[str] = None
    subvention_percent: Optional[float] = 0.0
    eway_bill_no: Optional[str] = None
    e_way_bill_details: Optional[str] = None
    transporter_name: Optional[str] = None
    transporter_id: Optional[str] = None
    distance_km: Optional[float] = None
    vehicle_no: Optional[str] = None
    delivery_state: str = "BOOKED" # PENDING_PACKET_VERIFICATION, GATE_PASS_ISSUED, OUT_FOR_DELIVERY, DELIVERED_AT_SITE, CARPENTER_ASSIGNED, INSTALLED_AND_CLOSED


class MultiTenderPaymentItem(BaseModel):
    tender_type: str # CASH, UPI, CARD, CONSUMER_FINANCE, CREDIT_KHATA
    amount: float = 0.0
    reference_no: Optional[str] = None # UTR / Card Auth / Loan DO Number
    down_payment: Optional[float] = 0.0
    subvention_fee: Optional[float] = 0.0
    provider_name: Optional[str] = None # e.g. Bajaj Finserv, HDFC, IDFC, PhonePe
    notes: Optional[str] = None


class SaleInvoicePaymentBase(BaseModel):
    payment_mode: str # Cash, UPI, Card, Bajaj Finance, Bank Transfer, Cheque, Credit Khata
    amount: float = 0.0
    utr_number: Optional[str] = None
    card_network: Optional[str] = None
    card_last_four: Optional[str] = None
    subvention_percent: Optional[float] = 0.0
    subvention_fee: Optional[float] = 0.0
    bank_account_id: Optional[int] = None
    reference_no: Optional[str] = None
    status: str = "Completed"
    notes: Optional[str] = None

class SaleInvoicePaymentCreate(SaleInvoicePaymentBase):
    pass

class SaleInvoicePaymentResponse(SaleInvoicePaymentBase):
    id: int
    invoice_id: int
    payment_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class SaleInvoiceCreate(SaleInvoiceBase):
    items: List[SaleInvoiceItemCreate]
    payments: Optional[List[SaleInvoicePaymentCreate]] = []
    tenders: Optional[List[MultiTenderPaymentItem]] = []

class SaleInvoiceResponse(SaleInvoiceBase):
    id: int
    created_at: datetime
    items: List[SaleInvoiceItemResponse] = []
    payments: List[SaleInvoicePaymentResponse] = []
    eway_bill_required: bool = False
    model_config = ConfigDict(from_attributes=True)

class CreditNoteItem(BaseModel):
    product_id: int
    qty: float = 1.0
    unit_price: float = 0.0
    gst_rate: float = 18.0
    total_amount: float = 0.0

class CreditNoteCreateRequest(BaseModel):
    invoice_id: int
    credit_note_no: Optional[str] = None
    reason: str
    destination_bucket: str = "godown_available_qty" # "godown_available_qty" or "damaged_quarantine_qty"
    items: Optional[List[CreditNoteItem]] = None

class CreditNoteResponse(BaseModel):
    id: int
    credit_note_no: str
    invoice_id: int
    invoice_no: str
    date: str
    customer_id: Optional[int] = None
    customer_name: str
    total_taxable: float
    total_gst: float
    grand_total: float
    destination_bucket: str
    reason: str
    journal_entry_id: Optional[int] = None
    created_at: datetime
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
    
    # Pipeline & Assembly
    stage: str = "Booked"
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    eway_bill_no: Optional[str] = None
    technician_name: Optional[str] = None
    technician_phone: Optional[str] = None
    assembly_notes: Optional[str] = None

class DeliveryNoteResponse(DeliveryNoteCreate):
    id: int
    created_at: datetime
    dispatched_at: Optional[datetime] = None
    assembled_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    gate_pass_no: Optional[str] = None
    gate_pass_issued_at: Optional[datetime] = None
    verified_packets_json: Optional[str] = None
    cod_collected: float = 0.0
    cod_utr: Optional[str] = None
    credit_override_reason: Optional[str] = None
    signed_challan_photo_url: Optional[str] = None
    carpenter_name: Optional[str] = None
    carpenter_phone: Optional[str] = None
    assembly_slot: Optional[str] = None
    installation_otp: Optional[str] = None
    installed_at: Optional[datetime] = None
    csat_rating: Optional[int] = None
    csat_tags: Optional[str] = None
    csat_feedback: Optional[str] = None
    csat_logged_at: Optional[datetime] = None
    csat_followup_status: Optional[str] = "Pending"
    model_config = ConfigDict(from_attributes=True)

class DeliveryNoteUpdate(BaseModel):
    status: Optional[str] = None
    vehicle_no: Optional[str] = None
    transporter_name: Optional[str] = None
    delivery_address: Optional[str] = None
    stage: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    eway_bill_no: Optional[str] = None
    technician_name: Optional[str] = None
    technician_phone: Optional[str] = None
    carpenter_name: Optional[str] = None
    carpenter_phone: Optional[str] = None
    assembly_slot: Optional[str] = None
    installation_otp: Optional[str] = None
    assembly_notes: Optional[str] = None
    cod_collected: Optional[float] = None
    credit_override_reason: Optional[str] = None
    signed_challan_photo_url: Optional[str] = None
    verified_packets_json: Optional[str] = None

class DeliveryStageAdvanceRequest(BaseModel):
    stage: str # PENDING_PACKET_VERIFICATION, GATE_PASS_ISSUED, OUT_FOR_DELIVERY, DELIVERED_AT_SITE, CARPENTER_ASSIGNED, INSTALLED_AND_CLOSED
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    vehicle_no: Optional[str] = None
    eway_bill_no: Optional[str] = None
    technician_name: Optional[str] = None
    technician_phone: Optional[str] = None
    carpenter_name: Optional[str] = None
    carpenter_phone: Optional[str] = None
    assembly_slot: Optional[str] = None
    installation_otp: Optional[str] = None
    assembly_notes: Optional[str] = None
    cod_collected: Optional[float] = 0.0
    credit_override_reason: Optional[str] = None
    signed_challan_photo_url: Optional[str] = None
    verified_packets_json: Optional[str] = None
    payment_mode: Optional[str] = "CASH"
    reference_no: Optional[str] = None

class CsatFeedbackRequest(BaseModel):
    rating: int # 1 to 5
    tags: Optional[str] = None # e.g. "Punctual,Neat Assembly,Polite Staff"
    feedback: Optional[str] = None
    followup_status: Optional[str] = "Satisfied"

class CsatWhatsAppResponse(BaseModel):
    delivery_note_no: str
    customer_name: str
    contact_no: str
    whatsapp_url: str
    message: str


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

