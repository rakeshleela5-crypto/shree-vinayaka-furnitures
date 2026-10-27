"""
backend/app/models/feature_flag.py
PostgreSQL Dynamic Feature Flags Model (#61, #67, #69, #74, #76).
Allows instant toggling of critical behaviors from Admin UI without redeployment:
- decentro_live_mode
- auto_utr_reconciliation
- strict_box_scan_on_dispatch
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.core.database import Base

class FeatureFlag(Base):
    __tablename__ = "feature_flags"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    is_enabled = Column(Boolean, default=False, nullable=False)
    description = Column(String(255), nullable=True)
    updated_by = Column(String(100), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
