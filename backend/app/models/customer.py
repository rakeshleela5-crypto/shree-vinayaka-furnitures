import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True) # e.g. "C-0001"
    name = Column(String(200), nullable=False, index=True)
    phone = Column(String(50), nullable=False, index=True)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), default="Kerala")
    state_code = Column(String(10), default="32")
    gstin = Column(String(50), nullable=True)
    credit_limit = Column(Numeric(12, 2, asdecimal=False), default=50000.0)
    opening_balance = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    current_balance = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    loyalty_points = Column(Float, default=0.0)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    sales = relationship("SaleInvoice", back_populates="customer")
    ledger_entries = relationship("CustomerLedgerEntry", back_populates="customer", cascade="all, delete-orphan")
    loyalty_transactions = relationship("LoyaltyTransaction", back_populates="customer", cascade="all, delete-orphan")


class CustomerLedgerEntry(Base):
    __tablename__ = "customer_ledger_entries"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    date = Column(String(50), nullable=False)
    voucher_no = Column(String(100), nullable=False, index=True)
    particulars = Column(String(255), nullable=False)
    debit = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    credit = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    balance = Column(Numeric(12, 2, asdecimal=False), default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    customer = relationship("Customer", back_populates="ledger_entries")


class LoyaltyTransaction(Base):
    __tablename__ = "loyalty_transactions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    date = Column(String(50), nullable=False)
    bill_no = Column(String(100), nullable=False, index=True)
    type = Column(String(50), nullable=False) # Earned / Redeemed / Adjusted / Expired
    bill_amount = Column(Float, default=0.0)
    points = Column(Float, default=0.0)
    point_value_rate = Column(Float, default=0.10)
    equivalent_amount = Column(Float, default=0.0)
    balance_points_after = Column(Float, default=0.0)
    remarks = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    customer = relationship("Customer", back_populates="loyalty_transactions")
