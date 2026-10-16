from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class SaleReturnItemCreate(BaseModel):
    product_id: Optional[int] = None
    p_code: Optional[str] = None
    product_name: str
    barcode: Optional[str] = None
    hsn_code: Optional[str] = None
    qty: float = 1.0
    sales_rate: float = 0.0
    taxable_amount: float = 0.0
    cgst_percent: float = 0.0
    cgst_amount: float = 0.0
    sgst_percent: float = 0.0
    sgst_amount: float = 0.0
    igst_percent: float = 0.0
    igst_amount: float = 0.0
    total: float = 0.0

class SaleReturnItemResponse(SaleReturnItemCreate):
    id: int
    sale_return_id: int
    model_config = ConfigDict(from_attributes=True)

class SaleReturnCreate(BaseModel):
    return_no: str
    date: str
    tax_type: str = "GST"
    original_invoice_no: str
    customer_id: Optional[int] = None
    customer_name: str
    total: float = 0.0
    round_off: float = 0.0
    grand_total: float = 0.0
    payment_mode: str = "Adjust"
    status: str = "ACTIVE"
    items: List[SaleReturnItemCreate]

class SaleReturnResponse(BaseModel):
    id: int
    return_no: str
    date: str
    tax_type: str
    original_invoice_no: str
    customer_id: Optional[int] = None
    customer_name: str
    total: float
    round_off: float
    grand_total: float
    payment_mode: str
    status: str
    created_at: datetime
    items: List[SaleReturnItemResponse] = []
    model_config = ConfigDict(from_attributes=True)

class PurchaseReturnItemCreate(BaseModel):
    product_id: Optional[int] = None
    product_name: str
    barcode: Optional[str] = None
    hsn_code: Optional[str] = None
    qty: float = 1.0
    purchase_rate: float = 0.0
    cgst_percent: float = 0.0
    cgst_amount: float = 0.0
    sgst_percent: float = 0.0
    sgst_amount: float = 0.0
    total: float = 0.0

class PurchaseReturnItemResponse(PurchaseReturnItemCreate):
    id: int
    purchase_return_id: int
    model_config = ConfigDict(from_attributes=True)

class PurchaseReturnCreate(BaseModel):
    return_no: str
    date: str
    tax_type: str = "GST"
    original_invoice_no: str
    supplier_id: Optional[int] = None
    supplier_name: str
    total: float = 0.0
    round_off: float = 0.0
    grand_total: float = 0.0
    items: List[PurchaseReturnItemCreate]

class PurchaseReturnResponse(BaseModel):
    id: int
    return_no: str
    date: str
    tax_type: str
    original_invoice_no: str
    supplier_id: int
    supplier_name: str
    total: float
    round_off: float
    grand_total: float
    created_at: datetime
    items: List[PurchaseReturnItemResponse] = []
    model_config = ConfigDict(from_attributes=True)
