import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from app.core.database import Base

class Inquiry(Base):
    __tablename__ = "inquiries"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(150), nullable=True)
    furniture_id = Column(Integer, ForeignKey("furniture.id", ondelete="SET NULL"), nullable=True)
    furniture_title = Column(String(200), nullable=True)
    message = Column(Text, nullable=False)
    inquiry_type = Column(String(50), default="quote")  # quote, custom_order, showroom_visit
    status = Column(String(50), default="new")          # new, in_progress, resolved
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

CustomerInquiry = Inquiry
