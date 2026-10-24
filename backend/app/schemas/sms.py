from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class SmsConfigBase(BaseModel):
    apiUrl: Optional[str] = ""
    senderId: Optional[str] = "SVFURN"
    isEnabled: Optional[bool] = False
    isDefault: Optional[bool] = True
    autoSmsEnabled: Optional[bool] = False

class SmsConfigCreate(SmsConfigBase):
    pass

class SmsConfigOut(SmsConfigBase):
    id: Optional[int] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
