import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True) # e.g. "S-0001"
    name = Column(String(200), nullable=False, index=True)
    company_name = Column(String(255), nullable=True)
    gstin = Column(String(50), nullable=True)
    state = Column(String(100), default="Kerala")
    state_code = Column(String(10), default="32")
    contact_no = Column(String(50), nullable=False)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)
    
    # Banking Info
    bank_name = Column(String(100), nullable=True)
    bank_ac_no = Column(String(100), nullable=True)
    bank_ifsc = Column(String(50), nullable=True)
    bank_branch = Column(String(100), nullable=True)
    
    # Ledger & Terms
    credit_period_days = Column(Integer, default=30)
    opening_balance = Column(Float, default=0.0)
    current_balance = Column(Float, default=0.0)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    purchases = relationship("PurchaseInvoice", back_populates="supplier")
    payments = relationship("SupplierPayment", back_populates="supplier", cascade="all, delete-orphan")


class SupplierPayment(Base):
    __tablename__ = "supplier_payments"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    voucher_no = Column(String(100), unique=True, nullable=False, index=True)
    date = Column(String(50), nullable=False)
    amount = Column(Float, nullable=False)
    payment_mode = Column(String(50), default="By Cash") # By Cash / Cheque / Bank Transfer / UPI
    bank_ac_no = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    supplier = relationship("Supplier", back_populates="payments")
