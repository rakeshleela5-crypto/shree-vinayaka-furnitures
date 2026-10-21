import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class WorkshopJobCard(Base):
    """
    Workshop / Factory Production Job Card Model for Made-to-Order Custom Furniture:
    Tracks production stages: DESIGN_LOCKED -> WOOD_FRAME -> WEBBING_FOAM -> FABRIC_UPHOLSTERY -> QC_VERIFIED -> READY_FOR_DISPATCH
    """
    __tablename__ = "workshop_job_cards"

    id = Column(Integer, primary_key=True, index=True)
    job_card_no = Column(String(100), unique=True, nullable=False, index=True) # e.g. "JC-2627-0001"
    date = Column(String(50), nullable=False)
    
    # Associated Sale / Customer
    sale_invoice_id = Column(Integer, ForeignKey("sale_invoices.id", ondelete="SET NULL"), nullable=True)
    invoice_no = Column(String(100), nullable=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    customer_name = Column(String(200), nullable=False)
    customer_phone = Column(String(50), nullable=True)

    # Made-to-Order Custom Specifications
    product_name = Column(String(255), nullable=False)
    frame_wood = Column(String(150), default="Treated Teak / Silver Oak")
    cushioning = Column(String(150), default="40 Density Sleepwell PU Foam")
    upholstery_code = Column(String(255), default="D'Decor Series 402 Velvet (Teal #08)")
    dimensions_orientation = Column(String(255), default="L-Shape Left Lounger (108x68x34 in)")
    
    # Production Timeline & Deadlines
    target_completion_date = Column(String(50), nullable=True)
    delivery_promise_date = Column(String(50), nullable=True)
    
    # Production Stage Machine:
    # DESIGN_LOCKED -> WOOD_FRAME -> WEBBING_FOAM -> FABRIC_UPHOLSTERY -> QC_VERIFIED -> READY_FOR_DISPATCH
    stage = Column(String(50), default="DESIGN_LOCKED", index=True)
    technician_name = Column(String(150), default="Master Craftsman Murugan")
    notes = Column(Text, nullable=True)
    estimated_cost = Column(Float, default=0.0)
    advance_paid = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
