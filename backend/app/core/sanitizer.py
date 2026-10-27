"""
backend/app/core/sanitizer.py
XSS Input Sanitization and Outbound SSRF Guard (#43, #44).
Protects customer data (names, addresses, notes) against stored/reflected XSS
and strictly restricts outbound HTTP calls to whitelisted external domains.
"""
import re
import html
import ipaddress
import urllib.parse
from typing import Optional, Dict, Any, List
from app.core.config import settings

# Common XSS patterns: script tags, dangerous HTML tags, javascript pseudo-protocols, event handlers
_SCRIPT_RE = re.compile(r'<\s*script[^>]*>.*?<\s*/\s*script\s*>', flags=re.IGNORECASE | re.DOTALL)
_TAG_RE = re.compile(r'<\s*/?\s*(iframe|object|embed|applet|meta|link|style|base|svg|img|script)[^>]*>', flags=re.IGNORECASE)
_EVENT_RE = re.compile(r'\b(on\w+)\s*=\s*["\']?[^"\'>\s]+["\']?', flags=re.IGNORECASE)
_JS_PROTOCOL_RE = re.compile(r'javascript:\s*', flags=re.IGNORECASE)
_DATA_HTML_RE = re.compile(r'data:\s*text/html', flags=re.IGNORECASE)

def sanitize_text(value: Optional[str]) -> Optional[str]:
    """
    Sanitizes string inputs (names, addresses, notes, remarks) against XSS.
    Strips dangerous HTML tags, script elements, event attributes, and javascript URLs
    while preserving normal text, punctuation, and Unicode characters.
    """
    if value is None:
        return None
    if not isinstance(value, str):
        return value

    # Remove <script>...</script> completely
    cleaned = _SCRIPT_RE.sub('', value)
    # Remove dangerous executable/embed HTML tags
    cleaned = _TAG_RE.sub('', cleaned)
    # Strip event handlers like onclick=, onerror=, onload=
    cleaned = _EVENT_RE.sub('', cleaned)
    # Strip javascript: pseudo-protocol
    cleaned = _JS_PROTOCOL_RE.sub('', cleaned)
    # Strip data:text/html
    cleaned = _DATA_HTML_RE.sub('', cleaned)

    return cleaned.strip()

def sanitize_for_html_template(value: Optional[str]) -> str:
    """
    Strict HTML entity escaping for dynamic strings injected into HTML-to-PDF templates.
    Escapes &, <, >, \", and '.
    """
    if value is None:
        return ""
    cleaned = sanitize_text(value) or ""
    return html.escape(cleaned, quote=True)

def sanitize_payload(payload: Dict[str, Any], target_fields: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Recursively or selectively sanitizes text fields in request dictionaries.
    """
    sanitized = {}
    default_fields = {"name", "full_name", "customer_name", "address", "shipping_address", 
                      "billing_address", "notes", "remarks", "details", "contact_no", "phone"}
    fields_to_check = set(target_fields) if target_fields else default_fields

    for k, v in payload.items():
        if isinstance(v, str) and (k.lower() in fields_to_check or any(sub in k.lower() for sub in ["name", "address", "note", "remark"])):
            sanitized[k] = sanitize_text(v)
        elif isinstance(v, dict):
            sanitized[k] = sanitize_payload(v, target_fields)
        elif isinstance(v, list):
            sanitized[k] = [
                sanitize_payload(item, target_fields) if isinstance(item, dict)
                else (sanitize_text(item) if isinstance(item, str) else item)
                for item in v
            ]
        else:
            sanitized[k] = v
    return sanitized

def is_ssrf_safe_url(url: str, allowed_domains: Optional[List[str]] = None) -> bool:
    """
    Validates outbound URLs to prevent Server-Side Request Forgery (SSRF) (#44).
    1. Scheme must strictly be 'http' or 'https'.
    2. Host cannot be localhost, loopback, private IPv4/IPv6, or cloud metadata IP (169.254.169.254).
    3. Host must resolve to or match whitelisted domains (*.decentro.tech, *.r2.cloudflarestorage.com).
    """
    if not url or not isinstance(url, str):
        return False

    try:
        parsed = urllib.parse.urlparse(url)
    except Exception:
        return False

    # Check scheme
    if parsed.scheme.lower() not in ("http", "https"):
        return False

    host = (parsed.hostname or "").lower().strip()
    if not host:
        return False

    # Block localhost and obvious internal aliases
    if host in ("localhost", "127.0.0.1", "0.0.0.0", "::1", "metadata.google.internal"):
        return False

    # Check if host is an IP address
    try:
        ip = ipaddress.ip_address(host)
        # Block private, loopback, link-local, multicast, or reserved IPs
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            return False
        # Block AWS / Cloud Instance Metadata Service (IMDS) IP
        if str(ip) == "169.254.169.254":
            return False
    except ValueError:
        # Host is a domain name, not an IP address
        pass

    whitelist = allowed_domains or settings.ALLOWED_OUTBOUND_DOMAINS
    # Check if host matches or is a subdomain of any whitelisted domain
    for allowed in whitelist:
        allowed_clean = allowed.lower().lstrip("*.").strip()
        if host == allowed_clean or host.endswith("." + allowed_clean):
            return True

    return False

def assert_ssrf_safe_url(url: str, allowed_domains: Optional[List[str]] = None) -> None:
    """
    Asserts that a URL is SSRF-safe; raises ValueError if unsafe or blocked.
    """
    if not is_ssrf_safe_url(url, allowed_domains):
        raise ValueError(
            f"SSRF Protection: Outbound connection to '{url}' is blocked. "
            f"Destination domain must be whitelisted (*.decentro.tech, *.r2.cloudflarestorage.com)."
        )
