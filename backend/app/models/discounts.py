import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class ProductQuantityDiscountRule(Base):
    __tablename__ = "product_quantity_discount_rules"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    min_qty = Column(Float, nullable=False, default=1.0)
    max_qty = Column(Float, nullable=False, default=10.0)
    discount_percent = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    active = Column(Boolean, default=True)

    product = relationship("Product", back_populates="discount_rules")


class ComboPack(Base):
    __tablename__ = "combo_packs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    barcode = Column(String(100), unique=True, nullable=False, index=True)
    combo_price = Column(Float, nullable=False)
    mrp = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    items_json = Column(Text, nullable=False) # JSON array of { product_id, qty, individual_price }
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True) # e.g. "FURNITURE50"
    title = Column(String(200), nullable=False)
    discount_type = Column(String(50), default="Percentage") # Percentage / FlatAmount
    discount_value = Column(Float, nullable=False)
    min_bill_amount = Column(Float, default=0.0)
    max_discount_amount = Column(Float, nullable=True)
    start_date = Column(String(50), nullable=False)
    end_date = Column(String(50), nullable=False)
    usage_limit = Column(Integer, nullable=True)
    used_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class GiftVoucher(Base):
    __tablename__ = "gift_vouchers"

    id = Column(Integer, primary_key=True, index=True)
    voucher_code = Column(String(100), unique=True, nullable=False, index=True) # e.g. "GIFT-1000"
    title = Column(String(200), nullable=False)
    denomination = Column(Float, nullable=False)
    issue_date = Column(String(50), nullable=False)
    expiry_date = Column(String(50), nullable=False)
    issued_to_customer = Column(String(200), nullable=True)
    status = Column(String(50), default="Active") # Active / Redeemed / Expired
    redeemed_date = Column(String(50), nullable=True)
    redeemed_bill_no = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class BarcodeTemplate(Base):
    __tablename__ = "barcode_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    paper_type = Column(String(50), default="A4_Sheet") # A4_Sheet / Continuous_Roll
    labels_across = Column(Integer, default=3)
    labels_down = Column(Integer, default=8)
    label_width_mm = Column(Float, default=64.0)
    label_height_mm = Column(Float, default=34.0)
    show_shop_name = Column(Boolean, default=True)
    show_product_name = Column(Boolean, default=True)
    show_mrp = Column(Boolean, default=True)
    show_retail_price = Column(Boolean, default=True)
    show_barcode_number = Column(Boolean, default=True)
    show_size_colour = Column(Boolean, default=True)
    barcode_type = Column(String(50), default="CODE128")


class EWayBill(Base):
    __tablename__ = "eway_bills"

    id = Column(Integer, primary_key=True, index=True)
    eway_bill_no = Column(String(100), unique=True, nullable=False, index=True)
    eway_bill_date = Column(String(50), nullable=False)
    invoice_no = Column(String(100), nullable=False, index=True)
    customer_name = Column(String(200), nullable=False)
    customer_gstin = Column(String(50), nullable=True)
    from_place = Column(String(100), nullable=False)
    to_place = Column(String(100), nullable=False)
    distance_km = Column(Float, default=0.0)
    transporter_id = Column(String(100), nullable=True)
    transporter_name = Column(String(200), nullable=False)
    transport_mode = Column(String(50), default="Road")
    vehicle_no = Column(String(50), nullable=False)
    status = Column(String(50), default="Generated")
    valid_until = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
