import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Numeric
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
    
    # Financial Totals & Discounts (Numeric 12, 2)
    sub_total = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    bill_discount = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    coupon_discount = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    coupon_code = Column(String(100), nullable=True)  # Stores applied coupon code for exact used_count tracking
    loyalty_redeemed_amt = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    sale_return_adjusted_amt = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    
    # Taxes
    cgst_total = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    sgst_total = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    igst_total = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    cess_total = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    round_off = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    grand_total = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    
    # Settlement & Salesman
    paid_amount = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    balance_due = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    payment_mode = Column(String(50), default="Cash")
    salesman_id = Column(Integer, ForeignKey("salesmen.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="Completed") # Completed / Voided / Partial
    is_advance_booking = Column(Boolean, default=False)
    payment_splits_json = Column(Text, nullable=True)
    utr_number = Column(String(100), nullable=True)
    subvention_percent = Column(Numeric(5, 2, asdecimal=False), default=0.0)
    eway_bill_no = Column(String(100), nullable=True)
    vehicle_no = Column(String(50), nullable=True)
    delivery_state = Column(String(50), default="BOOKED", index=True) # BOOKED, PACKED, DISPATCHED, DELIVERED, INSTALLATION_ASSIGNED, INSTALLED_AND_CLOSED
    is_custom_mto = Column(Boolean, default=False)
    workshop_job_card_no = Column(String(100), nullable=True)
    advance_adjusted = Column(Numeric(14, 2, asdecimal=False), default=0.0)
    tax_inclusive = Column(Boolean, default=True)
    e_way_bill_details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    customer = relationship("Customer", back_populates="sales")
    salesman = relationship("Salesman", back_populates="sales")
    items = relationship("SaleInvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("SaleInvoicePayment", back_populates="invoice", cascade="all, delete-orphan")

    @property
    def eway_bill_required(self) -> bool:
        return bool((self.grand_total or 0.0) >= 50000.0)

    @property
    def amount_paid(self) -> float:
        return float(self.paid_amount or 0.0)

    @amount_paid.setter
    def amount_paid(self, val):
        self.paid_amount = float(val or 0.0)

    @property
    def payment_status(self) -> str:
        return "PAID" if float(self.balance_due or 0.0) <= 0.001 else "PARTIALLY_PAID"

    @payment_status.setter
    def payment_status(self, val):
        self.status = str(val)


class SaleInvoicePayment(Base):
    """
    Split-Tender Payments model supporting multiple payment rows per invoice:
    Cash, UPI with UTR, Card, Bajaj Finance with DBD subvention fee, Bank Transfer, Cheque.
    """
    __tablename__ = "sale_invoice_payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("sale_invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    payment_mode = Column(String(50), nullable=False) # Cash, UPI, Card, Bajaj Finance, Bank Transfer, Cheque
    amount = Column(Numeric(12, 2, asdecimal=False), nullable=False, default=0.0)
    utr_number = Column(String(100), nullable=True) # UPI / NEFT / RTGS reference
    card_network = Column(String(50), nullable=True) # Visa, Mastercard, RuPay
    card_last_four = Column(String(10), nullable=True)
    subvention_percent = Column(Numeric(5, 2, asdecimal=False), default=0.0) # Bajaj Finance DBD subvention %
    subvention_fee = Column(Numeric(12, 2, asdecimal=False), default=0.0) # DBD subvention deduction fee
    bank_account_id = Column(Integer, nullable=True)
    bank_account_no = Column(String(100), nullable=True)
    reference_no = Column(String(100), nullable=True) # Bajaj loan ref / POS auth code
    payment_date = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(50), default="Completed") # Completed / Pending / Voided
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    invoice = relationship("SaleInvoice", back_populates="payments")


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
    rate = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    mrp = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    purchase_rate = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    discount_percent = Column(Float, default=0.0)
    discount_amount = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    taxable_amount = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    cgst_percent = Column(Float, default=0.0)
    cgst_amount = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    sgst_percent = Column(Float, default=0.0)
    sgst_amount = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    igst_percent = Column(Float, default=0.0)
    igst_amount = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    cess_percent = Column(Float, default=0.0)
    cess_amount = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    total = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    
    salesman_commission_percent = Column(Float, default=0.0)
    salesman_commission_amount = Column(Numeric(12, 2, asdecimal=False), default=0.0)

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
    transporter_name = Column(String(200), nullable=True)
    vehicle_no = Column(String(50), nullable=True)
    status = Column(String(50), default="Dispatched") # Draft / Dispatched / Delivered / Invoiced
    invoice_no = Column(String(100), nullable=True)
    grand_total = Column(Float, default=0.0)
    items_json = Column(Text, nullable=False)
    
    # Dispatch, Assembly & Delivery Pipeline Fields (6 Strict Stages)
    # 1: PENDING_PACKET_VERIFICATION, 2: GATE_PASS_ISSUED, 3: OUT_FOR_DELIVERY,
    # 4: DELIVERED_AT_SITE, 5: CARPENTER_ASSIGNED, 6: INSTALLED_AND_CLOSED
    stage = Column(String(50), default="PENDING_PACKET_VERIFICATION")
    gate_pass_no = Column(String(100), nullable=True, index=True)
    gate_pass_issued_at = Column(DateTime, nullable=True)
    verified_packets_json = Column(Text, nullable=True) # JSON checklist of verified packet barcodes
    cod_collected = Column(Numeric(14, 2, asdecimal=False), default=0.0)
    cod_utr = Column(String(100), nullable=True)
    credit_override_reason = Column(Text, nullable=True)
    signed_challan_photo_url = Column(String(500), nullable=True)
    driver_name = Column(String(100), nullable=True)
    driver_phone = Column(String(50), nullable=True)
    eway_bill_no = Column(String(100), nullable=True)
    technician_name = Column(String(100), nullable=True)
    technician_phone = Column(String(50), nullable=True)
    carpenter_name = Column(String(100), nullable=True)
    carpenter_phone = Column(String(50), nullable=True)
    assembly_slot = Column(String(100), nullable=True)
    installation_otp = Column(String(10), nullable=True)
    assembly_notes = Column(Text, nullable=True)
    dispatched_at = Column(DateTime, nullable=True)
    assembled_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    installed_at = Column(DateTime, nullable=True)
    
    # CSAT Feedback & Customer Satisfaction Tracking
    csat_rating = Column(Integer, nullable=True) # 1 to 5 Stars
    csat_tags = Column(String(255), nullable=True) # e.g. "Punctual,Neat Assembly,Polite"
    csat_feedback = Column(Text, nullable=True)
    csat_logged_at = Column(DateTime, nullable=True)
    csat_followup_status = Column(String(50), default="Pending") # Pending / Satisfied / Escalated / Resolved

    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    quotation_no = Column(String(100), unique=True, nullable=False, index=True) # e.g. "QUOT-0001-2024/25"
    date = Column(String(50), nullable=False)
    customer_id = Column(String(50), nullable=True)
    customer_name = Column(String(200), nullable=False)
    contact_no = Column(String(50), nullable=True)
    state = Column(String(100), default="Kerala")
    gstin = Column(String(50), nullable=True)
    remarks = Column(Text, nullable=True)
    sub_total = Column(Float, default=0.0)
    cgst = Column(Float, default=0.0)
    sgst = Column(Float, default=0.0)
    igst = Column(Float, default=0.0)
    cess = Column(Float, default=0.0)
    total_discount = Column(Float, default=0.0)
    round_off = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    items_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class InvoiceSequence(Base):
    __tablename__ = "invoice_sequences"

    financial_year = Column(String(10), primary_key=True)  # e.g., '2026-27' or '2627'
    prefix = Column(String(20), nullable=False, default="SVF-")  # e.g., 'SVF-2627-'
    last_number = Column(Integer, nullable=False, default=0)


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    reference_id = Column(String(100), unique=True, nullable=False, index=True)
    provider_txn_id = Column(String(100), nullable=True, index=True)
    invoice_id = Column(Integer, ForeignKey("sale_invoices.id", ondelete="SET NULL"), nullable=True, index=True)
    delivery_order_id = Column(Integer, ForeignKey("delivery_notes.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    payment_mode = Column(String(50), default="DECENTRO_UPI_QR") # DECENTRO_UPI_QR, DECENTRO_VA_RTGS, etc.
    amount = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    status = Column(String(50), default="PENDING", index=True) # PENDING, SUCCESS, FAILED
    utr_number = Column(String(100), nullable=True, index=True)
    qr_base64 = Column(Text, nullable=True)
    upi_uri = Column(String(500), nullable=True)
    expiry_minutes = Column(Integer, default=15)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    settled_at = Column(DateTime, nullable=True)

    invoice = relationship("SaleInvoice", foreign_keys=[invoice_id])
    delivery_order = relationship("DeliveryNote", foreign_keys=[delivery_order_id])
    customer = relationship("Customer", foreign_keys=[customer_id])


# Canonical domain model aliases
Invoice = SaleInvoice
DeliveryOrder = DeliveryNote


class EMISchedule(Base):
    __tablename__ = "emi_schedules"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("sale_invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    provider = Column(String(100), default="Bajaj Finserv")  # Bajaj Finserv, HDFC, TVS Credit, IDFC First
    loan_account_no = Column(String(100), nullable=True)
    tenure_months = Column(Integer, default=6)
    total_financed_amount = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    monthly_amount = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    start_date = Column(String(50), nullable=True)
    next_due_date = Column(String(50), nullable=True)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, CLOSED, DEFAULTED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    invoice = relationship("SaleInvoice")
    customer = relationship("Customer")



