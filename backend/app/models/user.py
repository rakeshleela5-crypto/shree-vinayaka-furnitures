import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    full_name = Column(String(200), nullable=False)
    password_hash = Column(String(255), nullable=False)
    user_type = Column(String(50), default="Salesman") # Admin / Salesman / Cashier / Manager
    email = Column(String(100), nullable=True)
    contact_no = Column(String(50), nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    permissions = relationship("UserControlPermission", back_populates="user", uselist=False, cascade="all, delete-orphan")


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
