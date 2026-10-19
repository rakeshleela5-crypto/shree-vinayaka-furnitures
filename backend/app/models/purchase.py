import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Numeric
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
    
    # Financial Totals (Numeric 12, 2)
    sub_total = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    cgst = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    sgst = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    igst = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    cess = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    round_off = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    grand_total = Column(Numeric(12, 2, asdecimal=False), default=0.0)
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
    purchase_price = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    mrp = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    retail_price = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    wholesale_price = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    taxable_amount = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    cgst_percent = Column(Float, default=0.0)
    cgst_amount = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    sgst_percent = Column(Float, default=0.0)
    sgst_amount = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    igst_percent = Column(Float, default=0.0)
    igst_amount = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    total_amount = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    colour = Column(String(50), nullable=True)
    size = Column(String(50), nullable=True)
    batch_no = Column(String(100), nullable=True)

    purchase = relationship("PurchaseInvoice", back_populates="items")


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    po_no = Column(String(100), unique=True, nullable=False, index=True) # e.g. "PO-202610-001"
    date = Column(String(50), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=False)
    supplier_name = Column(String(200), nullable=False)
    expected_delivery_date = Column(String(50), nullable=True)
    status = Column(String(50), default="PENDING") # PENDING / PARTIALLY_RECEIVED / COMPLETED / CANCELLED
    
    total_ordered_qty = Column(Float, default=0.0)
    total_received_qty = Column(Float, default=0.0)
    total_damaged_qty = Column(Float, default=0.0)
    sub_total = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    tax_amount = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    grand_total = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    supplier = relationship("Supplier")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")
    grns = relationship("GoodsReceiptNote", back_populates="purchase_order")


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    product_code = Column(String(50), nullable=True)
    product_name = Column(String(255), nullable=False)
    barcode = Column(String(100), nullable=True)
    hsn_code = Column(String(50), nullable=True)
    
    ordered_qty = Column(Float, nullable=False, default=1.0)
    received_good_qty = Column(Float, default=0.0)
    received_damaged_qty = Column(Float, default=0.0)
    pending_qty = Column(Float, default=1.0)
    unit_price = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    tax_percent = Column(Float, default=18.0)
    total_amount = Column(Numeric(12, 2, asdecimal=False), default=0.0)

    purchase_order = relationship("PurchaseOrder", back_populates="items")


class GoodsReceiptNote(Base):
    __tablename__ = "goods_receipt_notes"

    id = Column(Integer, primary_key=True, index=True)
    grn_no = Column(String(100), unique=True, nullable=False, index=True) # e.g. "GRN-202610-001"
    po_id = Column(Integer, ForeignKey("purchase_orders.id", ondelete="SET NULL"), nullable=True)
    po_no = Column(String(100), nullable=True, index=True)
    date = Column(String(50), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=False)
    supplier_name = Column(String(200), nullable=False)
    vendor_invoice_no = Column(String(100), nullable=True)
    vehicle_no = Column(String(50), nullable=True)
    
    total_received_good = Column(Float, default=0.0)
    total_received_damaged = Column(Float, default=0.0)
    vendor_debit_note_no = Column(String(100), nullable=True) # Auto-generated damage claim note
    vendor_debit_amount = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    purchase_order = relationship("PurchaseOrder", back_populates="grns")
    supplier = relationship("Supplier")
    items = relationship("GoodsReceiptNoteItem", back_populates="grn", cascade="all, delete-orphan")


class GoodsReceiptNoteItem(Base):
    __tablename__ = "goods_receipt_note_items"

    id = Column(Integer, primary_key=True, index=True)
    grn_id = Column(Integer, ForeignKey("goods_receipt_notes.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    product_code = Column(String(50), nullable=True)
    product_name = Column(String(255), nullable=False)
    barcode = Column(String(100), nullable=True)
    
    ordered_qty = Column(Float, default=1.0)
    received_good = Column(Float, default=1.0)
    received_damaged = Column(Float, default=0.0)
    pending_backorder = Column(Float, default=0.0)
    unit_price = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    damage_claim_amount = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    carton_boxes_verified = Column(Boolean, default=True)
    scanned_box_barcodes_json = Column(Text, nullable=True) # JSON list of verified box barcodes

    grn = relationship("GoodsReceiptNote", back_populates="items")
