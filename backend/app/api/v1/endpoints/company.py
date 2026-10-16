from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.company import CompanyProfile, CompanyTenant, DocumentPrefixSuffix
from app.schemas.company import (
    CompanyProfileUpdate, CompanyProfileResponse,
    CompanyTenantCreate, CompanyTenantResponse,
    DocumentPrefixSuffixResponse
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
def update_or_create_prefixes(payload: List[dict], db: Session = Depends(get_db)):
    for item in payload:
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
