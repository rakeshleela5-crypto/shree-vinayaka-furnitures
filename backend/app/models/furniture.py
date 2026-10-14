import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Furniture(Base):
    __tablename__ = "furniture"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    slug = Column(String(200), unique=True, nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=True)
    material = Column(String(100), nullable=True)
    dimensions = Column(String(100), nullable=True)
    color = Column(String(50), nullable=True)
    warranty = Column(String(100), default="3 Years Comprehensive")
    in_stock = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    image_url = Column(String(500), nullable=True)
    rating = Column(Float, default=4.8)
    reviews_count = Column(Integer, default=18)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    category = relationship("Category", back_populates="furniture")
