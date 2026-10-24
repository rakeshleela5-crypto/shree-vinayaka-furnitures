from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.models.sms_setting import SmsSetting
from app.schemas.sms import SmsConfigBase, SmsConfigOut

router = APIRouter()

@router.get("/config", response_model=SmsConfigOut)
def get_sms_config(db: Session = Depends(get_db)):
    setting = db.query(SmsSetting).filter(SmsSetting.is_default == True).first()
    if not setting:
        setting = db.query(SmsSetting).first()

    if not setting:
        setting = SmsSetting(
            api_url="",
            sender_id="SVFURN",
            is_enabled=False,
            is_default=True,
            auto_sms_enabled=False
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)

    return SmsConfigOut(
        id=setting.id,
        apiUrl=setting.api_url or "",
        senderId=setting.sender_id or "SVFURN",
        isEnabled=bool(setting.is_enabled),
        isDefault=bool(setting.is_default),
        autoSmsEnabled=bool(setting.auto_sms_enabled),
        updated_at=setting.updated_at
    )

@router.post("/config", response_model=SmsConfigOut)
def save_sms_config(payload: SmsConfigBase, db: Session = Depends(get_db)):
    setting = db.query(SmsSetting).filter(SmsSetting.is_default == True).first()
    if not setting:
        setting = db.query(SmsSetting).first()

    if not setting:
        setting = SmsSetting()
        db.add(setting)

    setting.api_url = payload.apiUrl or ""
    setting.sender_id = payload.senderId or "SVFURN"
    setting.is_enabled = bool(payload.isEnabled)
    setting.is_default = bool(payload.isDefault)
    setting.auto_sms_enabled = bool(payload.autoSmsEnabled)

    db.commit()
    db.refresh(setting)

    return SmsConfigOut(
        id=setting.id,
        apiUrl=setting.api_url,
        senderId=setting.sender_id,
        isEnabled=setting.is_enabled,
        isDefault=setting.is_default,
        autoSmsEnabled=setting.auto_sms_enabled,
        updated_at=setting.updated_at
    )

@router.delete("/config")
def delete_sms_config(db: Session = Depends(get_db)):
    db.query(SmsSetting).delete()
    db.commit()
    return {"message": "SMS configuration deleted and reset to default."}
