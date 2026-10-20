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

class ProductBoxComponentBase(BaseModel):
    box_number: int
    total_boxes: int
    component_name: str
    box_barcode: str
    box_sku: Optional[str] = None
    dimensions: Optional[str] = None
    weight_kg: float = 0.0
    godown: Optional[str] = None
    rack: Optional[str] = None
    status: str = "InStock"
    notes: Optional[str] = None

class ProductBoxComponentCreate(ProductBoxComponentBase):
    pass

class ProductBoxComponentResponse(ProductBoxComponentBase):
    id: int
    product_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ProductBase(BaseModel):
    p_code: str
    name: str
    barcode: str
    item_type: str = "PRODUCT" # "PRODUCT" | "SERVICE"
    purchase_price: float = 0.0
    mrp: float = 0.0
    retail_price: float = 0.0
    wholesale_price: Optional[float] = 0.0
    min_wholesale_quantity: Optional[float] = 1.0
    cess_percent: float = 0.0
    opening_stock: float = 0.0
    current_stock: float = 0.0
    physical_stock: Optional[float] = 0.0
    display_stock: Optional[float] = 0.0
    damaged_stock: Optional[float] = 0.0
    available_to_sell: Optional[float] = 0.0
    reserved_stock: float = 0.0
    transit_stock: float = 0.0
    min_stock: float = 5.0
    reorder_quantity: float = 5.0
    lead_time_days: int = 7
    category_id: Optional[int] = None
    sub_category: Optional[str] = None
    sales_unit: str = "Pcs"
    sales_alt_unit: Optional[str] = None
    conv_ratio: float = 1.0
    hsn_code: Optional[str] = None
    gst_rate: Optional[float] = 18.0
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
    
    # Knockdown Multi-Box Flat-Pack Specs (Godrej Furniture Standard)
    is_knockdown: bool = False
    total_boxes_count: int = 1
    total_boxes: Optional[int] = 1
    assembly_required: bool = False
    assembly_lead_time_mins: int = 0

    image_url: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True

class ProductCreate(ProductBase):
    batches: Optional[List[ProductBatchCreate]] = None
    serials: Optional[List[ProductSerialCreate]] = None
    variants: Optional[List[ProductVariantCreate]] = None
    box_components: Optional[List[ProductBoxComponentCreate]] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    barcode: Optional[str] = None
    item_type: Optional[str] = None
    purchase_price: Optional[float] = None
    mrp: Optional[float] = None
    retail_price: Optional[float] = None
    wholesale_price: Optional[float] = None
    min_wholesale_quantity: Optional[float] = None
    current_stock: Optional[float] = None
    physical_stock: Optional[float] = None
    display_stock: Optional[float] = None
    damaged_stock: Optional[float] = None
    reserved_stock: Optional[float] = None
    transit_stock: Optional[float] = None
    min_stock: Optional[float] = None
    reorder_quantity: Optional[float] = None
    lead_time_days: Optional[int] = None
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
    is_knockdown: Optional[bool] = None
    total_boxes_count: Optional[int] = None
    total_boxes: Optional[int] = None
    assembly_required: Optional[bool] = None
    assembly_lead_time_mins: Optional[int] = None

class StockHedgingItem(BaseModel):
    id: int
    p_code: str
    name: str
    barcode: str
    category_name: Optional[str] = None
    godown: Optional[str] = None
    rack: Optional[str] = None
    retail_price: float = 0.0
    purchase_price: float = 0.0
    physical_stock: float
    display_stock: float = 0.0
    damaged_stock: float = 0.0
    reserved_stock: float
    available_stock: float
    transit_stock: float
    virtual_stock: float
    min_stock: float
    reorder_quantity: float
    lead_time_days: int
    is_knockdown: bool = False
    total_boxes_count: int = 1
    total_boxes: Optional[int] = 1
    stock_status: str
    suggested_reorder_qty: float

class StockHedgingSummary(BaseModel):
    total_products_count: int
    total_physical_stock: float
    total_reserved_stock: float
    total_available_stock: float
    total_transit_stock: float
    low_stock_count: int
    critical_stock_count: int
    items: List[StockHedgingItem]

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    batches: List[ProductBatchResponse] = []
    serials: List[ProductSerialResponse] = []
    variants: List[ProductVariantResponse] = []
    box_components: List[ProductBoxComponentResponse] = []
    model_config = ConfigDict(from_attributes=True)


class SkuGeneratorRequest(BaseModel):
    brand: str = "GDJ" # GDJ = Godrej Interio, SVF = Shree Vinayaka Furnitures
    category_code: str # BED, ALM, SOF, DIN, DSK, CHR, MAT
    model_name: str # e.g. "Royal", "Slimline", "Centurion"
    variant: Optional[str] = None # e.g. "King", "3-Door", "Brown"
    is_knockdown: bool = False
    total_boxes: int = 1
    custom_box_names: Optional[List[str]] = None

class GeneratedBoxComponent(BaseModel):
    box_number: int
    total_boxes: int
    component_name: str
    box_barcode: str
    box_sku: str

class SkuGeneratorResponse(BaseModel):
    generated_sku: str
    generated_barcode: str
    brand: str
    category_code: str
    is_knockdown: bool
    total_boxes: int
    boxes: List[GeneratedBoxComponent] = []


class AssemblyBoxVerifyRequest(BaseModel):
    product_id: int
    scanned_barcodes: List[str]
    invoice_no: Optional[str] = None
    carpenter_name: Optional[str] = None
    notes: Optional[str] = None

class AssemblyBoxVerifyResponse(BaseModel):
    is_complete: bool
    status: str
    total_required: int
    scanned_count: int
    missing_box_numbers: List[int] = []
    missing_box_names: List[str] = []
    scanned_boxes: List[str] = []
    message: str
