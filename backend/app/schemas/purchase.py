from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class PurchaseInvoiceItemBase(BaseModel):
    product_id: Optional[int] = None
    product_code: Optional[str] = None
    product_name: str
    barcode: Optional[str] = None
    hsn_code: Optional[str] = None
    qty: float = 1.0
    unit: str = "Pcs"
    purchase_price: float = 0.0
    mrp: float = 0.0
    retail_price: float = 0.0
    wholesale_price: float = 0.0
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
