from pydantic import BaseModel, ConfigDict, Field
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
    category_name: Optional[str] = None
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
    
    # Knockdown Multi-Box Flat-Pack Specs & Stock Buckets
    is_knockdown: bool = False
    total_boxes_count: int = 1
    total_boxes: Optional[int] = 1
    total_packets_per_unit: int = 1
    sku_code: Optional[str] = None
    brand: Optional[str] = "Generic"
    landed_cost: float = 0.0
    mrp_inclusive_gst: float = 0.0
    min_floor_price: float = 0.0
    
    # 4 Explicit Stock Buckets
    godown_available_qty: float = 0.0
    showroom_display_qty: float = 0.0
    reserved_booked_qty: float = 0.0
    damaged_quarantine_qty: float = 0.0
    allow_floor_sample_sale: bool = False

    assembly_required: bool = False
    assembly_lead_time_mins: int = 0

    image_url: Optional[str] = None
    description: Optional[str] = None
    material: Optional[str] = None
    dimensions: Optional[str] = None
    color: Optional[str] = None
    warranty: Optional[str] = "3 Years Comprehensive"
    is_active: bool = True

class ProductPacketDefinitionBase(BaseModel):
    packet_number: int
    packet_name: str
    packet_barcode: Optional[str] = None
    weight_kg: float = 0.0
    dimensions: Optional[str] = None
    is_fragile: bool = False
    notes: Optional[str] = None

class ProductPacketDefinitionCreate(ProductPacketDefinitionBase):
    pass

class ProductPacketDefinitionResponse(ProductPacketDefinitionBase):
    id: int
    product_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class StockLedgerEventResponse(BaseModel):
    id: int
    product_id: int
    event_type: str
    bucket: str
    before_qty: float
    delta_qty: float
    after_qty: float
    reference_id: Optional[str] = None
    reason_code: Optional[str] = None
    performed_by: Optional[str] = "SYSTEM"
    notes: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class StockTransferRequest(BaseModel):
    product_id: int
    source_bucket: str # "godown_available_qty" or "showroom_display_qty"
    target_bucket: str # "showroom_display_qty" or "godown_available_qty" or "damaged_quarantine_qty"
    qty: float
    reason: Optional[str] = None
    performed_by: Optional[str] = "USER"

class StockAuditAdjustRequest(BaseModel):
    product_id: int
    bucket: str # "godown_available_qty", "showroom_display_qty", etc.
    new_qty: float
    reason: str
    performed_by: Optional[str] = "MANAGER"

class QuarantineWriteOffRequest(BaseModel):
    product_id: int
    qty: float = Field(..., gt=0, description="Quantity to scrap and write off from inventory")
    source_bucket: str = Field("damaged_quarantine_qty", description="godown_available_qty, showroom_display_qty, or damaged_quarantine_qty")
    reason: str = Field(..., min_length=3, description="Statutory write-off reason / damage description")
    performed_by: Optional[str] = "STORE_MANAGER"

class ProductCreate(ProductBase):
    batches: Optional[List[ProductBatchCreate]] = None
    serials: Optional[List[ProductSerialCreate]] = None
    variants: Optional[List[ProductVariantCreate]] = None
    box_components: Optional[List[ProductBoxComponentCreate]] = None
    packet_definitions: Optional[List[ProductPacketDefinitionCreate]] = None

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
    packet_definitions: List[ProductPacketDefinitionResponse] = []
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
