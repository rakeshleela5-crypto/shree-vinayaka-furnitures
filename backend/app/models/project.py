import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from app.core.database import Base

class FurnitureProject(Base):
    __tablename__ = "furniture_projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True, default="")
    category = Column(String(100), nullable=True, default="Living Room", index=True)
    r2_file_key = Column(String(500), nullable=False)
    image_url = Column(String(1000), nullable=False)
    client_name = Column(String(200), nullable=True)
    location = Column(String(200), nullable=True)
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
