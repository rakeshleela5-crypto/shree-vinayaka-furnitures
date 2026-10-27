import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Numeric
from app.core.database import Base

class Inquiry(Base):
    __tablename__ = "inquiries"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(150), nullable=True)
    city = Column(String(100), nullable=True, default="Kozhikode")
    furniture_id = Column(Integer, ForeignKey("furniture.id", ondelete="SET NULL"), nullable=True)
    furniture_title = Column(String(200), nullable=True)
    message = Column(Text, nullable=False)
    inquiry_type = Column(String(50), default="quote")  # quote, custom_order, showroom_visit
    status = Column(String(50), default="new")          # new, in_progress, resolved

    # Extended CRM Lead Pipeline Fields (Frames from Video 18 & Video 20)
    lead_status = Column(String(50), default="HOT")      # HOT, WARM, COLD, CONVERTED
    source = Column(String(50), default="WALK_IN")        # WALK_IN, WHATSAPP_INQUIRY, PHONE_CALL, WEBSITE_PORTAL
    assigned_salesman = Column(String(150), nullable=True, default="Arun Kumar (Senior Consultant)")
    estimated_budget = Column(Numeric(12, 2, asdecimal=False), default=50000.0)
    follow_up_date = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    last_contacted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

CustomerInquiry = Inquiry
CrmLead = Inquiry
