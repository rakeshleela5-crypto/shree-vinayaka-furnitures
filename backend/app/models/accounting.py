import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Numeric
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
    balance = Column(Float, default=0.0)
    utr_number = Column(String(100), nullable=True, index=True)
    status = Column(String(50), default="Unreconciled") # Unreconciled / Reconciled / Ignored
    reconciled_party_type = Column(String(50), nullable=True) # Customer / Supplier / Expense / Direct
    reconciled_party_id = Column(Integer, nullable=True)
    reconciled_party_name = Column(String(200), nullable=True)
    reconciled_ref_no = Column(String(100), nullable=True)
    reconciled_at = Column(DateTime, nullable=True)
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


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    entry_number = Column(String(100), unique=True, nullable=False, index=True) # e.g. "JV-20261020-0001"
    date = Column(String(50), nullable=False, index=True)
    voucher_type = Column(String(50), nullable=False, index=True) # GRN, ADVANCE_RECEIPT, TAX_INVOICE, KHATA_RECEIPT, SUPPLIER_PAYMENT, EXPENSE, CREDIT_NOTE
    reference_no = Column(String(100), nullable=False, index=True) # e.g. "INV-2425-0012", "GRN-0001"
    narration = Column(Text, nullable=False)
    total_debit = Column(Numeric(14, 2, asdecimal=False), nullable=False, default=0.0)
    total_credit = Column(Numeric(14, 2, asdecimal=False), nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    lines = relationship("JournalLine", back_populates="journal_entry", cascade="all, delete-orphan")


class JournalLine(Base):
    __tablename__ = "journal_lines"

    id = Column(Integer, primary_key=True, index=True)
    journal_entry_id = Column(Integer, ForeignKey("journal_entries.id", ondelete="CASCADE"), nullable=False, index=True)
    account_name = Column(String(100), nullable=False, index=True) # Cash in Hand, Bank / UPI Account, Accounts Receivable, Accounts Payable, GST Output (CGST), etc.
    account_group = Column(String(100), nullable=False) # Current Assets, Current Liabilities, Revenue, Direct Expenses, etc.
    debit = Column(Numeric(14, 2, asdecimal=False), default=0.0)
    credit = Column(Numeric(14, 2, asdecimal=False), default=0.0)
    party_type = Column(String(50), nullable=True) # Customer, Supplier, Transporter, None
    party_id = Column(Integer, nullable=True)
    party_name = Column(String(200), nullable=True)

    journal_entry = relationship("JournalEntry", back_populates="lines")


class ContraTransfer(Base):
    __tablename__ = "contra_transfers"

    id = Column(Integer, primary_key=True, index=True)
    voucher_no = Column(String(100), unique=True, nullable=False, index=True) # e.g. "CONTRA-20261024-0001"
    date = Column(String(50), nullable=False, index=True)
    transfer_type = Column(String(50), nullable=False) # CASH_DEPOSIT, CASH_WITHDRAWAL, BANK_TO_BANK
    from_account = Column(String(150), nullable=False) # "Cash Drawer" or Account Number
    to_account = Column(String(150), nullable=False)   # Account Number or "Cash Drawer"
    amount = Column(Numeric(14, 2, asdecimal=False), nullable=False, default=0.0)
    narration = Column(Text, nullable=True)
    performed_by = Column(String(100), default="Showroom Manager")
    status = Column(String(50), default="Active") # Active / Voided
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class BankMaster(Base):
    __tablename__ = "banks_master"

    id = Column(Integer, primary_key=True, index=True)
    bank_code = Column(String(50), unique=True, nullable=False, index=True)
    bank_name = Column(String(150), nullable=False, index=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class BranchMaster(Base):
    __tablename__ = "branches_master"

    id = Column(Integer, primary_key=True, index=True)
    bank_name = Column(String(150), nullable=False, index=True)
    branch_name = Column(String(150), nullable=False, index=True)
    ifsc = Column(String(50), nullable=False, index=True)
    address = Column(Text, nullable=True)
    contact_no = Column(String(50), nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class BankAccountMaster(Base):
    __tablename__ = "bank_accounts_master"

    id = Column(Integer, primary_key=True, index=True)
    account_no = Column(String(100), unique=True, nullable=False, index=True)
    account_holder = Column(String(200), nullable=False)
    account_type = Column(String(50), default="Current") # Current / Savings / Overdraft
    bank_name = Column(String(150), nullable=False, index=True)
    branch_name = Column(String(150), nullable=True)
    ifsc_code = Column(String(50), nullable=False)
    opening_balance = Column(Numeric(14, 2, asdecimal=False), default=0.0)
    current_balance = Column(Numeric(14, 2, asdecimal=False), default=0.0)
    upi_id = Column(String(100), nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)



