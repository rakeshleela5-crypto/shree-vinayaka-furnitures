import json
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Union, Dict, Any
from app.core.database import get_db
from app.models.company import CompanyProfile, CompanyTenant, DocumentPrefixSuffix, SystemSetting, MarketingCampaignLog
from app.schemas.company import (
    CompanyProfileUpdate, CompanyProfileResponse,
    CompanyTenantCreate, CompanyTenantResponse,
    DocumentPrefixSuffixResponse,
    MarketingCampaignLogCreate, MarketingCampaignLogResponse
)

router = APIRouter()

@router.get("/profile", response_model=CompanyProfileResponse)
def get_company_profile(db: Session = Depends(get_db)):
    profile = db.query(CompanyProfile).filter(CompanyProfile.is_active == True).first()
    if not profile:
        profile = CompanyProfile(
            company_name="Shree Vinayaka Furnitures",
            address="Post Office Road, Vaikom",
            city="Vaikom",
            state="Kerala",
            phone="9845001234",
            email="sales@shreevinayakafurnitures.com",
            gstin="32AABCS8899Z1Z5"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/profile", response_model=CompanyProfileResponse)
def update_company_profile(payload: CompanyProfileUpdate, db: Session = Depends(get_db)):
    profile = db.query(CompanyProfile).filter(CompanyProfile.is_active == True).first()
    if not profile:
        profile = CompanyProfile()
        db.add(profile)
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    
    db.commit()
    db.refresh(profile)
    return profile

@router.get("/tenants", response_model=List[CompanyTenantResponse])
def get_company_tenants(db: Session = Depends(get_db)):
    return db.query(CompanyTenant).filter(CompanyTenant.active == True).all()

@router.post("/tenants", response_model=CompanyTenantResponse)
def create_company_tenant(payload: CompanyTenantCreate, db: Session = Depends(get_db)):
    existing = db.query(CompanyTenant).filter((CompanyTenant.code == payload.code) | (CompanyTenant.db_key == payload.db_key)).first()
    if existing:
        for k, v in payload.model_dump().items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
    tenant = CompanyTenant(**payload.model_dump())
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant

@router.get("/prefixes", response_model=List[DocumentPrefixSuffixResponse])
def get_prefixes(db: Session = Depends(get_db)):
    return db.query(DocumentPrefixSuffix).all()

@router.post("/prefixes")
def update_or_create_prefixes(payload: Union[List[dict], Dict[str, Any]], db: Session = Depends(get_db)):
    items: List[dict] = []
    if isinstance(payload, list):
        items = payload
    elif isinstance(payload, dict):
        for k, v in payload.items():
            if isinstance(v, dict):
                row = dict(v)
                row.setdefault("doc_type", k)
                items.append(row)
            else:
                items.append({"doc_type": k, "prefix": str(v)})

    for item in items:
        doc_type = item.get("doc_type")
        if not doc_type:
            continue
        existing = db.query(DocumentPrefixSuffix).filter(DocumentPrefixSuffix.doc_type == doc_type).first()
        if existing:
            if "prefix" in item: existing.prefix = item["prefix"]
            if "suffix" in item: existing.suffix = item["suffix"]
            if "next_number" in item: existing.next_number = item["next_number"]
            if "padding_zeros" in item: existing.padding_zeros = item["padding_zeros"]
        else:
            new_p = DocumentPrefixSuffix(
                doc_type=doc_type,
                prefix=item.get("prefix", ""),
                suffix=item.get("suffix", ""),
                next_number=item.get("next_number", 1),
                padding_zeros=item.get("padding_zeros", 4)
            )
            db.add(new_p)
    db.commit()
    return db.query(DocumentPrefixSuffix).all()


@router.get("/settings")
def get_all_system_settings(db: Session = Depends(get_db)):
    rows = db.query(SystemSetting).all()
    res = {}
    for r in rows:
        try:
            res[r.key] = json.loads(r.value_json)
        except Exception:
            res[r.key] = r.value_json
    return res


@router.get("/settings/{key}")
def get_system_setting(key: str, db: Session = Depends(get_db)):
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        return None
    try:
        return json.loads(setting.value_json)
    except Exception:
        return setting.value_json


@router.post("/settings/{key}")
def save_system_setting(key: str, payload: Any = Body(...), db: Session = Depends(get_db)):
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    val_str = json.dumps(payload) if not isinstance(payload, str) else payload
    if setting:
        setting.value_json = val_str
    else:
        setting = SystemSetting(key=key, value_json=val_str)
        db.add(setting)
    db.commit()
    db.refresh(setting)
    try:
        return json.loads(setting.value_json)
    except Exception:
        return setting.value_json


@router.delete("/settings/{key}")
def delete_system_setting(key: str, db: Session = Depends(get_db)):
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if setting:
        db.delete(setting)
        db.commit()
    return {"message": f"Setting '{key}' deleted successfully"}


# ==========================================
# MARKETING CAMPAIGN LOGS (WHATSAPP/SMS/EMAIL)
# ==========================================

@router.get("/campaign-logs", response_model=List[MarketingCampaignLogResponse])
def get_campaign_logs(
    limit: int = 200,
    channel: str = None,
    db: Session = Depends(get_db)
):
    """
    List marketing message dispatch logs.
    """
    query = db.query(MarketingCampaignLog)
    if channel:
        query = query.filter(MarketingCampaignLog.channel == channel.upper())
    return query.order_by(MarketingCampaignLog.id.desc()).limit(limit).all()


@router.post("/campaign-logs", response_model=MarketingCampaignLogResponse)
def create_campaign_log(
    payload: MarketingCampaignLogCreate,
    db: Session = Depends(get_db)
):
    """
    Log an outbound campaign message to PostgreSQL.
    """
    from datetime import datetime as dt
    log = MarketingCampaignLog(**payload.model_dump())
    log.sent_at = dt.utcnow()
    db.add(log)
    db.commit()
    db.refresh(log)
    return log



