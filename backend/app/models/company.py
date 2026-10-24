import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from app.core.database import Base

class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(200), nullable=False, default="Shree Vinayaka Furnitures")
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), default="Kerala")
    state_code = Column(String(10), default="32")
    pincode = Column(String(20), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    gstin = Column(String(50), nullable=True)
    
    # Financial Configuration
    currency_symbol = Column(String(10), default="₹")
    financial_year = Column(String(20), default="2024-2025")
    loyalty_per_point_value = Column(Float, default=0.10)
    
    # Banking Info for Invoice Footer
    bank_name = Column(String(100), nullable=True)
    bank_ac_no = Column(String(100), nullable=True)
    bank_ifsc = Column(String(50), nullable=True)
    bank_branch = Column(String(100), nullable=True)
    
    # Formatting
    invoice_header_note = Column(String(255), nullable=True)
    invoice_footer_note = Column(Text, nullable=True)
    logo_url = Column(String(500), nullable=True)
    signature_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class CompanyTenant(Base):
    __tablename__ = "company_tenants"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True) # e.g. "COMP-01"
    name = Column(String(200), nullable=False)
    legal_name = Column(String(255), nullable=True)
    gstin = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), default="Kerala")
    db_key = Column(String(100), unique=True, nullable=False)
    is_default = Column(Boolean, default=False)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class DocumentPrefixSuffix(Base):
    __tablename__ = "document_prefix_suffixes"

    id = Column(Integer, primary_key=True, index=True)
    doc_type = Column(String(50), unique=True, nullable=False, index=True) # Sale, Purchase, Estimate, SaleReturn, PurchaseReturn, Expense
    prefix = Column(String(50), default="SHIB-")
    suffix = Column(String(50), default="-2024/25")
    next_number = Column(Integer, default=1)
    padding_zeros = Column(Integer, default=4)


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value_json = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

