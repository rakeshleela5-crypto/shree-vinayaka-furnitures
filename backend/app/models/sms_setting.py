import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.core.database import Base

class SmsSetting(Base):
    __tablename__ = "sms_settings"

    id = Column(Integer, primary_key=True, index=True)
    api_url = Column(String(500), default="")
    sender_id = Column(String(50), default="SVFURN")
    is_enabled = Column(Boolean, default=False)
    is_default = Column(Boolean, default=True)
    auto_sms_enabled = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
