from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime

class PurchaseInvoiceItemBase(BaseModel):
    product_id: Optional[int] = None
    product_code: Optional[str] = None
    product_name: str
    barcode: Optional[str] = None
    hsn_code: Optional[str] = None
    qty: float = Field(..., gt=0, description="Purchase quantity must be positive")
    unit: str = "Pcs"
    purchase_price: float = Field(0.0, ge=0, description="Purchase price cannot be negative")
    mrp: float = Field(0.0, ge=0, description="MRP cannot be negative")
    retail_price: float = Field(0.0, ge=0, description="Retail price cannot be negative")
    wholesale_price: float = Field(0.0, ge=0, description="Wholesale price cannot be negative")
    taxable_amount: float = 0.0
    cgst_percent: float = 0.0
    cgst_amount: float = 0.0
    sgst_percent: float = 0.0
    sgst_amount: float = 0.0
    igst_percent: float = 0.0
    igst_amount: float = 0.0
    total_amount: float = 0.0
    colour: Optional[str] = None
    size: Optional[str] = None
    batch_no: Optional[str] = None

class PurchaseInvoiceItemCreate(PurchaseInvoiceItemBase):
    pass

class PurchaseInvoiceItemResponse(PurchaseInvoiceItemBase):
    id: int
    purchase_id: int
    model_config = ConfigDict(from_attributes=True)

class PurchaseInvoiceBase(BaseModel):
    invoice_no: str
    date: str
    supplier_invoice_no: Optional[str] = None
    supplier_invoice_date: Optional[str] = None
    supplier_id: int
    supplier_name: str
    gstin: Optional[str] = None
    state: str = "Kerala"
    tax_type: str = "GST"
    purchase_type: str = "Credit"
    reverse_charges: str = "No"
    sub_total: float = 0.0
    cgst: float = 0.0
    sgst: float = 0.0
    igst: float = 0.0
    cess: float = 0.0
    round_off: float = 0.0
    grand_total: float = 0.0

class PurchaseInvoiceCreate(PurchaseInvoiceBase):
    items: List[PurchaseInvoiceItemCreate]

class PurchaseInvoiceResponse(PurchaseInvoiceBase):
    id: int
    created_at: datetime
    items: List[PurchaseInvoiceItemResponse] = []
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# PURCHASE ORDER (PO) SCHEMAS
# ==========================================
class PurchaseOrderItemBase(BaseModel):
    product_id: Optional[int] = None
    product_code: Optional[str] = None
    product_name: str
    barcode: Optional[str] = None
    hsn_code: Optional[str] = None
    ordered_qty: float = 1.0
    unit_price: float = 0.0
    tax_percent: float = 18.0
    total_amount: float = 0.0

class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass

class PurchaseOrderItemResponse(PurchaseOrderItemBase):
    id: int
    po_id: int
    received_good_qty: float = 0.0
    received_damaged_qty: float = 0.0
    pending_qty: float = 1.0
    model_config = ConfigDict(from_attributes=True)

class PurchaseOrderBase(BaseModel):
    po_no: str
    date: str
    supplier_id: int
    supplier_name: str
    expected_delivery_date: Optional[str] = None
    status: str = "PENDING"
    sub_total: float = 0.0
    tax_amount: float = 0.0
    grand_total: float = 0.0
    remarks: Optional[str] = None

class PurchaseOrderCreate(PurchaseOrderBase):
    items: List[PurchaseOrderItemCreate]

class PurchaseOrderResponse(PurchaseOrderBase):
    id: int
    total_ordered_qty: float = 0.0
    total_received_qty: float = 0.0
    total_damaged_qty: float = 0.0
    created_at: datetime
    items: List[PurchaseOrderItemResponse] = []
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# GOODS RECEIPT NOTE (GRN) SCHEMAS
# ==========================================
class GoodsReceiptNoteItemCreate(BaseModel):
    product_id: Optional[int] = None
    product_code: Optional[str] = None
    product_name: str
    barcode: Optional[str] = None
    ordered_qty: float = 1.0
    received_good: float = 1.0
    received_qty: Optional[float] = None
    received_damaged: float = 0.0
    damaged_qty: Optional[float] = None
    pending_backorder: float = 0.0
    unit_price: float = 0.0
    damage_claim_amount: float = 0.0
    target_location: str = "GODOWN" # "GODOWN" or "SHOWROOM"
    carton_boxes_verified: bool = True
    scanned_box_barcodes_json: Optional[str] = None
    is_knockdown: bool = False
    packets_per_unit: int = 1
    total_packets_received: Optional[int] = None
    missing_packets_count: int = 0

class GoodsReceiptNoteItemResponse(GoodsReceiptNoteItemCreate):
    id: int
    grn_id: int
    model_config = ConfigDict(from_attributes=True)

class GoodsReceiptNoteCreate(BaseModel):
    grn_no: str
    po_id: Optional[int] = None
    po_no: Optional[str] = None
    date: str
    supplier_id: int
    supplier_name: str
    supplier_invoice_no: Optional[str] = None
    supplier_invoice_date: Optional[str] = None
    vendor_invoice_no: Optional[str] = None
    freight_hamali_cost: float = 0.0
    vehicle_no: Optional[str] = None
    remarks: Optional[str] = None
    items: List[GoodsReceiptNoteItemCreate]

class GoodsReceiptNoteResponse(BaseModel):
    id: int
    grn_no: str
    po_id: Optional[int] = None
    po_no: Optional[str] = None
    date: str
    supplier_id: int
    supplier_name: str
    supplier_invoice_no: Optional[str] = None
    supplier_invoice_date: Optional[str] = None
    vendor_invoice_no: Optional[str] = None
    freight_hamali_cost: float = 0.0
    vehicle_no: Optional[str] = None
    total_received_good: float = 0.0
    total_received_damaged: float = 0.0
    vendor_debit_note_no: Optional[str] = None
    vendor_debit_amount: float = 0.0
    journal_entry_id: Optional[int] = None
    remarks: Optional[str] = None
    created_at: datetime
    items: List[GoodsReceiptNoteItemResponse] = []
    model_config = ConfigDict(from_attributes=True)
