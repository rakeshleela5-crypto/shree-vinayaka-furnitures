import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    p_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    barcode = Column(String(100), unique=True, nullable=False, index=True)
    
    # Financials & Pricing
    purchase_price = Column(Float, nullable=False, default=0.0)
    mrp = Column(Float, nullable=False, default=0.0)
    retail_price = Column(Float, nullable=False, default=0.0)
    wholesale_price = Column(Float, nullable=True, default=0.0)
    cess_percent = Column(Float, default=0.0)
    
    # Inventory Tracking
    opening_stock = Column(Float, default=0.0)
    current_stock = Column(Float, default=0.0)
    min_stock = Column(Float, default=5.0)
    
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


class ProductBatch(Base):
    __tablename__ = "product_batches"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    batch_no = Column(String(100), nullable=False, index=True)
    barcode = Column(String(100), nullable=True)
    mrp = Column(Float, default=0.0)
    retail_price = Column(Float, default=0.0)
    wholesale_price = Column(Float, default=0.0)
    purchase_rate = Column(Float, default=0.0)
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
    mrp = Column(Float, default=0.0)
    retail_price = Column(Float, default=0.0)

    product = relationship("Product", back_populates="variants")
