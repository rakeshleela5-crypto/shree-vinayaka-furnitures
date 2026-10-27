"""
backend/app/core/rate_limit.py
Centralized Rate Limiting Configuration via slowapi (#2, #18, #19).
Enforces:
- Login brute force protection: 5 requests / minute per client IP on /api/v1/auth/login
- Webhook flood protection: 60 requests / minute on /api/v1/webhooks/* and /api/decentro/webhook
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

def _client_ip_key_func(request) -> str:
    """
    Extracts real client IP respecting Cloudflare (CF-Connecting-IP),
    X-Forwarded-For, and direct connection IP.
    """
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()

    x_forwarded = request.headers.get("X-Forwarded-For")
    if x_forwarded:
        return x_forwarded.split(",")[0].strip()

    return get_remote_address(request) or "127.0.0.1"

# Centralized Limiter instance
limiter = Limiter(
    key_func=_client_ip_key_func,
    default_limits=["300/minute"],
    headers_enabled=False
)
