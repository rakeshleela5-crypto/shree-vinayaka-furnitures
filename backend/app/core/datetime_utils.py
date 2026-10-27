"""
backend/app/core/datetime_utils.py
Standardized UTC timestamp handling with server-side generation (func.now())
and Asia/Kolkata (IST = UTC+5:30) serialization to eliminate browser clock skew.
"""
from datetime import datetime, timezone, timedelta
from typing import Optional

# Indian Standard Time is UTC + 5 hours 30 minutes
IST_OFFSET = timedelta(hours=5, minutes=30)
IST_TZ = timezone(IST_OFFSET, name="Asia/Kolkata")
UTC_TZ = timezone.utc

def get_utc_now() -> datetime:
    """Returns current datetime in UTC with timezone awareness."""
    return datetime.now(UTC_TZ)

def to_ist(dt: Optional[datetime]) -> Optional[datetime]:
    """Converts a naive or UTC-aware datetime to Asia/Kolkata (IST)."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        # Assume stored naive datetime is UTC
        dt = dt.replace(tzinfo=UTC_TZ)
    return dt.astimezone(IST_TZ)

def format_ist_iso(dt: Optional[datetime]) -> Optional[str]:
    """Formats a datetime as ISO 8601 string in Asia/Kolkata (+05:30) timezone."""
    if dt is None:
        return None
    ist_dt = to_ist(dt)
    return ist_dt.isoformat() if ist_dt else None

def format_ist_display(dt: Optional[datetime], fmt: str = "%d/%m/%Y %I:%M %p") -> Optional[str]:
    """Formats a datetime for Indian showroom UI display (e.g. '27/10/2026 04:30 PM')."""
    if dt is None:
        return None
    ist_dt = to_ist(dt)
    return ist_dt.strftime(fmt) if ist_dt else None

# Convenience aliases
to_ist_datetime = to_ist
format_iso_ist = format_ist_iso

