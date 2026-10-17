import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class AccountHead(Base):
    __tablename__ = "account_heads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    under_group = Column(String(100), nullable=False, index=True) # Direct Expenses, Indirect Expenses, Fixed Assets, etc.
    active = Column(Boolean, default=True)


class ExpenseVoucher(Base):
    __tablename__ = "expense_vouchers"

    id = Column(Integer, primary_key=True, index=True)
    voucher_no = Column(String(100), unique=True, nullable=False, index=True) # e.g. "EXP-0001-2024/25"
    date = Column(String(50), nullable=False)
    name = Column(String(200), nullable=False) # Payee
    details = Column(Text, nullable=True)
    payment_mode = Column(String(50), default="Cash") # Cash / Bank
    bank_ac_no = Column(String(100), nullable=True)
    grand_total = Column(Float, nullable=False, default=0.0)
    items_json = Column(Text, nullable=False) # JSON array of { particulars, amount, notes }
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class IncomeVoucher(Base):
    __tablename__ = "income_vouchers"

    id = Column(Integer, primary_key=True, index=True)
    voucher_no = Column(String(100), unique=True, nullable=False, index=True) # e.g. "INCM-0001-2024/25"
    date = Column(String(50), nullable=False)
    name = Column(String(200), nullable=False) # Payer
    details = Column(Text, nullable=True)
    payment_mode = Column(String(50), default="Cash") # Cash / Bank
    bank_ac_no = Column(String(100), nullable=True)
    grand_total = Column(Float, nullable=False, default=0.0)
    items_json = Column(Text, nullable=False) # JSON array of { particulars, amount, notes }
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class BankStatementEntry(Base):
    __tablename__ = "bank_statement_entries"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(50), nullable=False)
    account_no = Column(String(100), nullable=False, index=True)
    receipt_no = Column(String(100), nullable=True)
    description = Column(Text, nullable=False)
    debit = Column(Float, default=0.0)
    credit = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ShiftSettlement(Base):
    __tablename__ = "shift_settlements"

    id = Column(Integer, primary_key=True, index=True)
    shift_code = Column(String(100), unique=True, nullable=False, index=True) # e.g. "SHIFT-20261017-01"
    date = Column(String(50), nullable=False, index=True)
    cashier_name = Column(String(100), nullable=False)
    terminal_id = Column(String(50), default="POS-01")

    opening_cash = Column(Float, default=0.0)
    total_sales_amount = Column(Float, default=0.0)
    cash_sales = Column(Float, default=0.0)
    card_sales = Column(Float, default=0.0)
    upi_sales = Column(Float, default=0.0)
    credit_sales = Column(Float, default=0.0)
    cash_expenses = Column(Float, default=0.0)

    expected_drawer_cash = Column(Float, default=0.0)
    actual_physical_cash = Column(Float, default=0.0)
    cash_difference = Column(Float, default=0.0) # actual - expected (negative = shortage)

    total_bills_count = Column(Integer, default=0)
    status = Column(String(50), default="Closed") # Open / Closed / Verified
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

