"""
backend/app/services/feature_flag_service.py
PostgreSQL Dynamic Feature Flags with 60-Second In-Memory TTL Cache (#61, #67, #69, #74, #76).
Allows instant toggling of mission-critical production behaviors from the Admin UI
without redeploying:
- decentro_live_mode
- auto_utr_reconciliation
- strict_box_scan_on_dispatch
"""
import time
import logging
from typing import Dict, Tuple, Optional, List
from sqlalchemy.orm import Session
from app.models.feature_flag import FeatureFlag
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)

# In-memory flag cache: {flag_key: (is_enabled, cache_timestamp)}
_FLAG_CACHE: Dict[str, Tuple[bool, float]] = {}
CACHE_TTL_SECONDS = 60.0

DEFAULT_FLAGS = {
    "decentro_live_mode": (False, "Enable live banking gateway vs sandbox mode"),
    "auto_utr_reconciliation": (True, "Automatically settle orders upon verified UTR match"),
    "strict_box_scan_on_dispatch": (True, "Require all box component barcodes scanned before gate pass generation"),
}


def seed_default_feature_flags(db: Session) -> None:
    """Ensures default feature flags exist in the database upon startup."""
    for key, (enabled, desc) in DEFAULT_FLAGS.items():
        existing = db.query(FeatureFlag).filter(FeatureFlag.key == key).first()
        if not existing:
            new_flag = FeatureFlag(
                key=key,
                is_enabled=enabled,
                description=desc,
                updated_by="SystemSeed"
            )
            db.add(new_flag)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.warning(f"Feature flags seed notice: {e}")


def is_feature_enabled(key: str, default: bool = False, db: Optional[Session] = None) -> bool:
    """
    Checks if a feature flag is enabled using a 60-second in-memory TTL cache.
    Falls back to querying PostgreSQL / SQLite if cache is cold or expired.
    """
    now = time.time()
    cached = _FLAG_CACHE.get(key)
    if cached is not None:
        value, timestamp = cached
        if now - timestamp < CACHE_TTL_SECONDS:
            return value

    # Cache miss or expired - query database
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        flag = db.query(FeatureFlag).filter(FeatureFlag.key == key).first()
        if flag is not None:
            _FLAG_CACHE[key] = (flag.is_enabled, now)
            return flag.is_enabled
        else:
            # Check default flags or fallback
            default_val, desc = DEFAULT_FLAGS.get(key, (default, "Dynamic feature flag"))
            # Auto-create if missing
            new_flag = FeatureFlag(
                key=key,
                is_enabled=default_val,
                description=desc,
                updated_by="SystemAutoInit"
            )
            db.add(new_flag)
            db.commit()
            _FLAG_CACHE[key] = (default_val, now)
            return default_val
    except Exception as ex:
        logger.error(f"Error querying feature flag {key}: {ex}")
        return default
    finally:
        if close_db:
            db.close()


def set_feature_flag(
    key: str,
    enabled: bool,
    updated_by: str = "Admin",
    description: Optional[str] = None,
    db: Optional[Session] = None
) -> FeatureFlag:
    """
    Updates or inserts a feature flag, and updates the local in-memory cache instantly.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        flag = db.query(FeatureFlag).filter(FeatureFlag.key == key).first()
        if flag:
            flag.is_enabled = enabled
            flag.updated_by = updated_by
            if description:
                flag.description = description
        else:
            flag = FeatureFlag(
                key=key,
                is_enabled=enabled,
                description=description or DEFAULT_FLAGS.get(key, (False, "Dynamic flag"))[1],
                updated_by=updated_by
            )
            db.add(flag)

        db.commit()
        db.refresh(flag)
        # Update cache immediately
        _FLAG_CACHE[key] = (enabled, time.time())
        logger.info(f"Feature flag '{key}' updated to {enabled} by {updated_by}")
        return flag
    finally:
        if close_db:
            db.close()


def list_feature_flags(db: Session) -> List[FeatureFlag]:
    """Retrieves all feature flags from the database."""
    return db.query(FeatureFlag).order_by(FeatureFlag.key).all()


def clear_flag_cache() -> None:
    """Clears in-memory cache (primarily for unit tests)."""
    _FLAG_CACHE.clear()
