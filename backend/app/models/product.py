import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    p_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    barcode = Column(String(100), unique=True, nullable=False, index=True)
    
    # Financials & Pricing (Numeric 12, 2)
    purchase_price = Column(Numeric(12, 2, asdecimal=False), nullable=False, default=0.0)
    mrp = Column(Numeric(12, 2, asdecimal=False), nullable=False, default=0.0)
    retail_price = Column(Numeric(12, 2, asdecimal=False), nullable=False, default=0.0)
    wholesale_price = Column(Numeric(12, 2, asdecimal=False), nullable=True, default=0.0)
    cess_percent = Column(Numeric(5, 2, asdecimal=False), default=0.0)
    gst_rate = Column(Numeric(5, 2, asdecimal=False), default=18.0)
    
    # Inventory Tracking & Stock Hedging (4-Bucket Stock Separation: Physical vs Reserved vs Display vs Damaged)
    opening_stock = Column(Float, default=0.0)
    current_stock = Column(Float, default=0.0) # Physical In-Hand Stock in Godown
    physical_stock = Column(Float, default=0.0) # Total units physically in warehouse
    display_stock = Column(Float, default=0.0) # Showroom floor pieces
    damaged_stock = Column(Float, default=0.0) # Damaged/transit stock awaiting vendor claim
    reserved_stock = Column(Float, default=0.0) # Reserved for booked customer orders
    transit_stock = Column(Float, default=0.0) # In-transit from Godrej plant / depot
    min_stock = Column(Float, default=5.0) # Reorder trigger threshold
    reorder_quantity = Column(Float, default=5.0) # Recommended batch replenishment
    lead_time_days = Column(Integer, default=7) # Expected factory-to-store delivery days
    
    # Classification & Units
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    sub_category = Column(String(100), nullable=True)
    sales_unit = Column(String(50), default="Pcs")
    sales_alt_unit = Column(String(50), nullable=True)
    conv_ratio = Column(Float, default=1.0) # e.g. 1 Box = 12 Pcs
    
    # Taxation (GST / CGST / SGST / IGST)
    hsn_code = Column(String(50), nullable=True)
    cgst = Column(Float, default=0.0)
    sgst = Column(Float, default=0.0)
    igst = Column(Float, default=0.0)
    sale_tax_type = Column(String(20), default="Inclusive") # Inclusive / Exclusive
    purchase_tax_type = Column(String(20), default="Exclusive")
    
    # Storage & Logistics
    godown = Column(String(100), nullable=True)
    rack = Column(String(100), nullable=True)
    part_no = Column(String(100), nullable=True)
    
    # Sales Incentive & Loyalty
    salesman_commission = Column(Float, default=0.0) # Percentage
    loyalty_value = Column(Float, default=0.0)
    loyalty_type = Column(String(20), default="Percentage")
    
    # Knockdown Multi-Box Flat-Pack & Assembly (Godrej Furniture Spec)
    is_knockdown = Column(Boolean, default=False)
    total_boxes = Column(Integer, default=1)
    total_boxes_count = Column(Integer, default=1)
    assembly_required = Column(Boolean, default=False)
    assembly_lead_time_mins = Column(Integer, default=0)

    # Media & Status
    image_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    category = relationship("Category", back_populates="products")
    batches = relationship("ProductBatch", back_populates="product", cascade="all, delete-orphan")
    serials = relationship("ProductSerial", back_populates="product", cascade="all, delete-orphan")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    discount_rules = relationship("ProductQuantityDiscountRule", back_populates="product", cascade="all, delete-orphan")
    box_components = relationship("ProductBoxComponent", back_populates="product", cascade="all, delete-orphan")
    assembly_logs = relationship("FurnitureAssemblyLog", back_populates="product", cascade="all, delete-orphan")

    @property
    def available_to_sell(self) -> float:
        phys = self.physical_stock if (self.physical_stock is not None and self.physical_stock > 0) else (self.current_stock or 0.0)
        res = self.reserved_stock or 0.0
        return max(0.0, phys - res)

    @available_to_sell.setter
    def available_to_sell(self, val):
        pass


class ProductBatch(Base):
    __tablename__ = "product_batches"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    batch_no = Column(String(100), nullable=False, index=True)
    barcode = Column(String(100), nullable=True)
    mrp = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    retail_price = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    wholesale_price = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    purchase_rate = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    available_qty = Column(Float, default=0.0)
    mfg_date = Column(String(50), nullable=True)
    exp_date = Column(String(50), nullable=True)
    colour = Column(String(50), nullable=True)
    size = Column(String(50), nullable=True)
    info = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    product = relationship("Product", back_populates="batches")


class ProductSerial(Base):
    __tablename__ = "product_serials"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    serial_no = Column(String(100), unique=True, nullable=False, index=True)
    barcode = Column(String(100), nullable=True)
    status = Column(String(20), default="InStock") # InStock / Sold
    purchase_invoice_no = Column(String(100), nullable=True)
    sale_invoice_no = Column(String(100), nullable=True)
    supplier_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    product = relationship("Product", back_populates="serials")


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    size = Column(String(50), nullable=True)
    colour = Column(String(50), nullable=True)
    barcode = Column(String(100), nullable=True)
    qty = Column(Float, default=0.0)
    mrp = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    retail_price = Column(Numeric(12, 2, asdecimal=False), default=0.0)

    product = relationship("Product", back_populates="variants")


class ProductBoxComponent(Base):
    __tablename__ = "product_box_components"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    box_number = Column(Integer, nullable=False) # e.g. 1
    total_boxes = Column(Integer, nullable=False) # e.g. 3
    component_name = Column(String(200), nullable=False) # e.g. "Headboard & Footboard"
    box_barcode = Column(String(100), unique=True, nullable=False, index=True) # e.g. "GDJ-BED-CENT-KNG-BX1"
    box_sku = Column(String(100), nullable=True)
    dimensions = Column(String(100), nullable=True) # e.g. "210 x 185 x 18 cm"
    weight_kg = Column(Float, default=0.0) # e.g. 32.5
    godown = Column(String(100), nullable=True)
    rack = Column(String(100), nullable=True)
    status = Column(String(50), default="InStock") # InStock / Dispatched / Damaged / Missing
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    product = relationship("Product", back_populates="box_components")


class FurnitureAssemblyLog(Base):
    __tablename__ = "furniture_assembly_logs"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    invoice_no = Column(String(100), nullable=True, index=True)
    carpenter_name = Column(String(100), nullable=True)
    scanned_boxes_json = Column(Text, nullable=False) # JSON array of scanned box barcodes
    is_complete = Column(Boolean, default=False)
    status = Column(String(50), default="Verified") # Verified / Assembled / Dispatched / Incomplete
    notes = Column(Text, nullable=True)
    verified_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    product = relationship("Product", back_populates="assembly_logs")
