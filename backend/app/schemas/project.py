import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class PresignedUrlRequest(BaseModel):
    filename: str
    content_type: str = "image/jpeg"

class PresignedUrlResponse(BaseModel):
    presigned_upload_url: str
    public_image_url: str
    r2_file_key: str

class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = ""
    category: Optional[str] = "Living Room"
    r2_file_key: str
    image_url: str
    client_name: Optional[str] = None
    location: Optional[str] = None
    is_featured: Optional[bool] = False

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    r2_file_key: Optional[str] = None
    image_url: Optional[str] = None
    client_name: Optional[str] = None
    location: Optional[str] = None
    is_featured: Optional[bool] = None

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
