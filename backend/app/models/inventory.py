import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class StockEntry(Base):
    __tablename__ = "stock_entries"

    id = Column(Integer, primary_key=True, index=True)
    stock_code = Column(String(50), unique=True, nullable=False, index=True) # e.g. "STK-0001"
    date = Column(String(50), nullable=False)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    items = relationship("StockEntryItem", back_populates="stock_entry", cascade="all, delete-orphan")


class StockEntryItem(Base):
    __tablename__ = "stock_entry_items"

    id = Column(Integer, primary_key=True, index=True)
    stock_entry_id = Column(Integer, ForeignKey("stock_entries.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    product_code = Column(String(50), nullable=True)
    product_name = Column(String(255), nullable=False)
    barcode = Column(String(100), nullable=True)
    qty = Column(Float, nullable=False, default=1.0)
    unit = Column(String(50), default="Pcs")
    remarks = Column(String(255), nullable=True)

    stock_entry = relationship("StockEntry", back_populates="items")


class StockAdjustment(Base):
    __tablename__ = "stock_adjustments"

    id = Column(Integer, primary_key=True, index=True)
    adjustment_code = Column(String(50), unique=True, nullable=False, index=True) # e.g. "SA-1-Y"
    date = Column(String(50), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    product_code = Column(String(50), nullable=True)
    product_name = Column(String(255), nullable=False)
    barcode = Column(String(100), nullable=True)
    adjustment_type = Column(String(20), nullable=False) # Plus / Minus
    qty = Column(Float, nullable=False, default=1.0)
    reason = Column(String(255), nullable=False) # e.g. "Physical stock audit variance", "Damaged goods"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
