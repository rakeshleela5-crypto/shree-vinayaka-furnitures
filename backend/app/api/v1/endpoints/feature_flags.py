"""
backend/app/api/v1/endpoints/feature_flags.py
Admin Dynamic Feature Flags Management API (#61, #67, #69, #74, #76).
Allows OWNER and ACCOUNTANT to view and toggle dynamic system features:
- decentro_live_mode
- auto_utr_reconciliation
- strict_box_scan_on_dispatch
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import require_role, get_current_user
from app.models.user import User
from app.services.feature_flag_service import (
    list_feature_flags,
    set_feature_flag,
    is_feature_enabled
)

router = APIRouter()

class FeatureFlagResponse(BaseModel):
    id: Optional[int] = None
    key: str
    is_enabled: bool
    description: Optional[str] = None
    updated_by: Optional[str] = None
    updated_at: Optional[datetime] = None

class FeatureFlagUpdate(BaseModel):
    is_enabled: bool
    description: Optional[str] = None


@router.get("", response_model=List[FeatureFlagResponse])
@router.get("/", response_model=List[FeatureFlagResponse])
def get_all_flags(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["OWNER", "ACCOUNTANT"]))
):
    """
    List all system feature flags. Restricted strictly to OWNER and ACCOUNTANT.
    """
    flags = list_feature_flags(db=db)
    return [
        FeatureFlagResponse(
            id=f.id,
            key=f.key,
            is_enabled=f.is_enabled,
            description=f.description,
            updated_by=f.updated_by,
            updated_at=f.updated_at
        )
        for f in flags
    ]


@router.get("/{key}", response_model=FeatureFlagResponse)
def get_single_flag(
    key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["OWNER", "ACCOUNTANT"]))
):
    """
    Get live status of a specific feature flag.
    """
    flags = list_feature_flags(db=db)
    flag = next((f for f in flags if f.key == key), None)
    if not flag:
        enabled = is_feature_enabled(key=key, default=False, db=db)
        return FeatureFlagResponse(key=key, is_enabled=enabled, description="Auto-resolved flag")
    return FeatureFlagResponse(
        id=flag.id,
        key=flag.key,
        is_enabled=flag.is_enabled,
        description=flag.description,
        updated_by=flag.updated_by,
        updated_at=flag.updated_at
    )


@router.put("/{key}", response_model=FeatureFlagResponse)
def update_feature_flag(
    key: str,
    payload: FeatureFlagUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["OWNER", "ACCOUNTANT"]))
):
    """
    Toggle or update a feature flag. Restricted strictly to OWNER and ACCOUNTANT (#48, #67).
    Instantly refreshes the 60s in-memory cache.
    """
    updated_by_name = f"{current_user.username} ({current_user.user_type})"
    flag = set_feature_flag(
        key=key,
        enabled=payload.is_enabled,
        updated_by=updated_by_name,
        description=payload.description,
        db=db
    )
    return FeatureFlagResponse(
        id=flag.id,
        key=flag.key,
        is_enabled=flag.is_enabled,
        description=flag.description,
        updated_by=flag.updated_by,
        updated_at=flag.updated_at
    )
