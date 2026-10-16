from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class ProductBatchBase(BaseModel):
    batch_no: str
    barcode: Optional[str] = None
    mrp: float = 0.0
    retail_price: float = 0.0
    wholesale_price: float = 0.0
    purchase_rate: float = 0.0
    available_qty: float = 0.0
    mfg_date: Optional[str] = None
    exp_date: Optional[str] = None
    colour: Optional[str] = None
    size: Optional[str] = None
    info: Optional[str] = None

class ProductBatchCreate(ProductBatchBase):
    pass

class ProductBatchResponse(ProductBatchBase):
    id: int
    product_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ProductSerialBase(BaseModel):
    serial_no: str
    barcode: Optional[str] = None
    status: str = "InStock"
    purchase_invoice_no: Optional[str] = None
    sale_invoice_no: Optional[str] = None
    supplier_name: Optional[str] = None

class ProductSerialCreate(ProductSerialBase):
    pass

class ProductSerialResponse(ProductSerialBase):
    id: int
    product_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ProductVariantBase(BaseModel):
    size: Optional[str] = None
    colour: Optional[str] = None
    barcode: Optional[str] = None
    qty: float = 0.0
    mrp: float = 0.0
    retail_price: float = 0.0

class ProductVariantCreate(ProductVariantBase):
    pass

class ProductVariantResponse(ProductVariantBase):
    id: int
    product_id: int
    model_config = ConfigDict(from_attributes=True)

class ProductBase(BaseModel):
    p_code: str
    name: str
    barcode: str
    purchase_price: float = 0.0
    mrp: float = 0.0
    retail_price: float = 0.0
    wholesale_price: Optional[float] = 0.0
    cess_percent: float = 0.0
    opening_stock: float = 0.0
    current_stock: float = 0.0
    min_stock: float = 5.0
    category_id: Optional[int] = None
    sub_category: Optional[str] = None
    sales_unit: str = "Pcs"
    sales_alt_unit: Optional[str] = None
    conv_ratio: float = 1.0
    hsn_code: Optional[str] = None
    cgst: float = 0.0
    sgst: float = 0.0
    igst: float = 0.0
    sale_tax_type: str = "Inclusive"
    purchase_tax_type: str = "Exclusive"
    godown: Optional[str] = None
    rack: Optional[str] = None
    part_no: Optional[str] = None
    salesman_commission: float = 0.0
    loyalty_value: float = 0.0
    loyalty_type: str = "Percentage"
    image_url: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True

class ProductCreate(ProductBase):
    batches: Optional[List[ProductBatchCreate]] = None
    serials: Optional[List[ProductSerialCreate]] = None
    variants: Optional[List[ProductVariantCreate]] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    barcode: Optional[str] = None
    purchase_price: Optional[float] = None
    mrp: Optional[float] = None
    retail_price: Optional[float] = None
    wholesale_price: Optional[float] = None
    current_stock: Optional[float] = None
    min_stock: Optional[float] = None
    cgst: Optional[float] = None
    sgst: Optional[float] = None
    igst: Optional[float] = None
    godown: Optional[str] = None
    rack: Optional[str] = None
    salesman_commission: Optional[float] = None
    loyalty_value: Optional[float] = None
    loyalty_type: Optional[str] = None
    sub_category: Optional[str] = None
    category_name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    batches: List[ProductBatchResponse] = []
    serials: List[ProductSerialResponse] = []
    variants: List[ProductVariantResponse] = []
    model_config = ConfigDict(from_attributes=True)
