import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.core.database import Base

class EmailSetting(Base):
    __tablename__ = "email_settings"

    id = Column(Integer, primary_key=True, index=True)
    server_name = Column(String(50), default="Gmail")  # 'Gmail', 'Yahoo', 'Rediffmail', 'Hotmail(Outlook)', 'Custom'
    smtp_address = Column(String(255), default="smtp.gmail.com")
    email_id = Column(String(255), default="shreevinayakafurnitures@gmail.com")
    password = Column(String(255), default="")  # Google App Password (16 characters) or SMTP password
    port = Column(Integer, default=587)
    tls_ssl_required = Column(String(10), default="Yes")  # 'Yes' | 'No'
    is_default = Column(Boolean, default=True)
    is_enabled = Column(Boolean, default=True)
    sender_name = Column(String(150), default="Shree Vinayaka Furnitures")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
