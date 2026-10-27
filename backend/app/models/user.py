import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Numeric, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    full_name = Column(String(200), nullable=False)
    password_hash = Column(String(255), nullable=False)
    user_type = Column(String(50), default="Salesman") # OWNER / ACCOUNTANT / CASHIER / WAREHOUSE / Salesman / Admin
    email = Column(String(100), nullable=True)
    contact_no = Column(String(50), nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    permissions = relationship("UserControlPermission", back_populates="user", uselist=False, cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")


class RefreshToken(Base):
    """
    Database-backed Refresh Token rotation with instant revocation support (#47, #48).
    Allows immediately locking out terminated staff.
    """
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    is_revoked = Column(Boolean, default=False, nullable=False, index=True)
    device_info = Column(String(255), nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="refresh_tokens")


class UserControlPermission(Base):
    __tablename__ = "user_control_permissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Feature Toggles (Video 11 & Video 16)
    can_edit_sale_price = Column(Boolean, default=False)
    can_give_discount = Column(Boolean, default=False)
    can_void_bill = Column(Boolean, default=False)
    can_access_records = Column(Boolean, default=True)
    can_access_reports = Column(Boolean, default=False)
    can_access_master = Column(Boolean, default=False)
    can_access_settings = Column(Boolean, default=False)
    can_access_backup = Column(Boolean, default=False)

    user = relationship("User", back_populates="permissions")


class Salesman(Base):
    __tablename__ = "salesmen"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True) # e.g. "SM-01"
    name = Column(String(200), nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    commission_percent = Column(Float, default=2.0)
    total_sales = Column(Float, default=0.0)
    total_commission = Column(Float, default=0.0)
    paid_commission = Column(Float, default=0.0)
    balance_commission = Column(Float, default=0.0)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sales = relationship("SaleInvoice", back_populates="salesman")


class SalesmanPaymentVoucher(Base):
    __tablename__ = "salesman_payment_vouchers"

    id = Column(Integer, primary_key=True, index=True)
    salesman_id = Column(Integer, ForeignKey("salesmen.id", ondelete="CASCADE"), nullable=False, index=True)
    voucher_no = Column(String(100), unique=True, nullable=False, index=True)
    date = Column(String(50), nullable=False)
    amount = Column(Numeric(12, 2, asdecimal=False), nullable=False)
    payment_mode = Column(String(50), default="Cash")  # Cash / Bank / UPI
    bank_ac_no = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    salesman = relationship("Salesman")


class SalesmanLedgerEntry(Base):
    __tablename__ = "salesman_ledger_entries"

    id = Column(Integer, primary_key=True, index=True)
    salesman_id = Column(Integer, ForeignKey("salesmen.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(String(50), nullable=False)
    voucher_no = Column(String(100), nullable=False, index=True)
    invoice_no = Column(String(100), nullable=True, index=True)
    particulars = Column(String(255), nullable=False)
    debit = Column(Numeric(12, 2, asdecimal=False), default=0.0)   # Payouts disbursed
    credit = Column(Numeric(12, 2, asdecimal=False), default=0.0)  # Commission earned from sale
    balance = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    salesman = relationship("Salesman")
