import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class PurchaseInvoice(Base):
    __tablename__ = "purchase_invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_no = Column(String(100), unique=True, nullable=False, index=True) # e.g. "SHIB-0011-2024/25"
    date = Column(String(50), nullable=False)
    supplier_invoice_no = Column(String(100), nullable=True)
    supplier_invoice_date = Column(String(50), nullable=True)
    
    # Supplier Details
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=False)
    supplier_name = Column(String(200), nullable=False)
    gstin = Column(String(50), nullable=True)
    state = Column(String(100), default="Kerala")
    tax_type = Column(String(50), default="GST") # GST / Non-GST / Composition
    purchase_type = Column(String(50), default="Credit") # Credit / Cash
    reverse_charges = Column(String(10), default="No") # Yes / No
    
    # Financial Totals
    sub_total = Column(Float, default=0.0)
    cgst = Column(Float, default=0.0)
    sgst = Column(Float, default=0.0)
    igst = Column(Float, default=0.0)
    cess = Column(Float, default=0.0)
    round_off = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    supplier = relationship("Supplier", back_populates="purchases")
    items = relationship("PurchaseInvoiceItem", back_populates="purchase", cascade="all, delete-orphan")


class PurchaseInvoiceItem(Base):
    __tablename__ = "purchase_invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchase_invoices.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    product_code = Column(String(50), nullable=True)
    product_name = Column(String(255), nullable=False)
    barcode = Column(String(100), nullable=True)
    hsn_code = Column(String(50), nullable=True)
    
    qty = Column(Float, default=1.0)
    unit = Column(String(50), default="Pcs")
    purchase_price = Column(Float, default=0.0)
    mrp = Column(Float, default=0.0)
    retail_price = Column(Float, default=0.0)
    wholesale_price = Column(Float, default=0.0)
    taxable_amount = Column(Float, default=0.0)
    cgst_percent = Column(Float, default=0.0)
    cgst_amount = Column(Float, default=0.0)
    sgst_percent = Column(Float, default=0.0)
    sgst_amount = Column(Float, default=0.0)
    igst_percent = Column(Float, default=0.0)
    igst_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    colour = Column(String(50), nullable=True)
    size = Column(String(50), nullable=True)
    batch_no = Column(String(100), nullable=True)

    purchase = relationship("PurchaseInvoice", back_populates="items")
