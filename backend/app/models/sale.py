import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class SaleInvoice(Base):
    __tablename__ = "sale_invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_no = Column(String(100), unique=True, nullable=False, index=True) # e.g. "SHIB-0138-DADDY"
    date = Column(String(50), nullable=False) # DD/MM/YYYY
    time = Column(String(50), nullable=True) # HH:MM:SS
    bill_type = Column(String(50), default="Cash") # Cash / Credit / Split
    
    # Customer Details
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    customer_name = Column(String(200), default="Cash Customer")
    customer_phone = Column(String(50), nullable=True)
    customer_gstin = Column(String(50), nullable=True)
    state = Column(String(100), default="Kerala")
    state_code = Column(String(10), default="32")
    
    # Financial Totals & Discounts
    sub_total = Column(Float, default=0.0)
    bill_discount = Column(Float, default=0.0)
    coupon_discount = Column(Float, default=0.0)
    loyalty_redeemed_amt = Column(Float, default=0.0)
    sale_return_adjusted_amt = Column(Float, default=0.0)
    
    # Taxes
    cgst_total = Column(Float, default=0.0)
    sgst_total = Column(Float, default=0.0)
    igst_total = Column(Float, default=0.0)
    cess_total = Column(Float, default=0.0)
    round_off = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    
    # Settlement & Salesman
    paid_amount = Column(Float, default=0.0)
    balance_due = Column(Float, default=0.0)
    payment_mode = Column(String(50), default="Cash")
    salesman_id = Column(Integer, ForeignKey("salesmen.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="Completed") # Completed / Voided
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    customer = relationship("Customer", back_populates="sales")
    salesman = relationship("Salesman", back_populates="sales")
    items = relationship("SaleInvoiceItem", back_populates="invoice", cascade="all, delete-orphan")


class SaleInvoiceItem(Base):
    __tablename__ = "sale_invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("sale_invoices.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    p_code = Column(String(50), nullable=True)
    product_name = Column(String(255), nullable=False)
    barcode = Column(String(100), nullable=True)
    hsn_code = Column(String(50), nullable=True)
    batch_no = Column(String(100), nullable=True)
    
    qty = Column(Float, default=1.0)
    rate = Column(Float, default=0.0)
    mrp = Column(Float, default=0.0)
    purchase_rate = Column(Float, default=0.0)
    discount_percent = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    taxable_amount = Column(Float, default=0.0)
    cgst_percent = Column(Float, default=0.0)
    cgst_amount = Column(Float, default=0.0)
    sgst_percent = Column(Float, default=0.0)
    sgst_amount = Column(Float, default=0.0)
    igst_percent = Column(Float, default=0.0)
    igst_amount = Column(Float, default=0.0)
    cess_percent = Column(Float, default=0.0)
    cess_amount = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    
    salesman_commission_percent = Column(Float, default=0.0)
    salesman_commission_amount = Column(Float, default=0.0)

    # Relationships
    invoice = relationship("SaleInvoice", back_populates="items")


class HeldCart(Base):
    __tablename__ = "held_carts"

    id = Column(Integer, primary_key=True, index=True)
    hold_id = Column(String(100), unique=True, nullable=False, index=True) # e.g. "HOLD-1741002"
    time = Column(String(50), nullable=False)
    customer_name = Column(String(200), default="Walk-in Customer")
    phone = Column(String(50), nullable=True)
    items_count = Column(Integer, default=0)
    total_amount = Column(Float, default=0.0)
    cart_json = Column(Text, nullable=False) # JSON array of items
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class EstimateRecord(Base):
    __tablename__ = "estimates"

    id = Column(Integer, primary_key=True, index=True)
    estimate_no = Column(String(100), unique=True, nullable=False, index=True) # e.g. "ESTM-0001-2024/25"
    date = Column(String(50), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    customer_name = Column(String(200), nullable=False)
    contact_no = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    state = Column(String(100), default="Kerala")
    gstin = Column(String(50), nullable=True)
    sub_total = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    round_off = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    items_json = Column(Text, nullable=False)
    status = Column(String(50), default="Active") # Active / ConvertedToInvoice
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class DeliveryNote(Base):
    __tablename__ = "delivery_notes"

    id = Column(Integer, primary_key=True, index=True)
    delivery_note_no = Column(String(100), unique=True, nullable=False, index=True) # e.g. "DN-0001-2024/25"
    date = Column(String(50), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    customer_name = Column(String(200), nullable=False)
    contact_no = Column(String(50), nullable=True)
    delivery_address = Column(Text, nullable=False)
    state = Column(String(100), default="Kerala")
    vehicle_no = Column(String(50), nullable=True)
    transporter_name = Column(String(200), nullable=True)
    status = Column(String(50), default="Dispatched") # Draft / Dispatched / Delivered / Invoiced
    invoice_no = Column(String(100), nullable=True)
    grand_total = Column(Float, default=0.0)
    items_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
