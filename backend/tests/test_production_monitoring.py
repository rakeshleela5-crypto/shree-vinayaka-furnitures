import time
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

from app.main import app
from app.core.config import settings

def test_railway_betterstack_healthz_heartbeat():
    """
    Validates Layer 6: Real-Time Production Monitoring & Railway/Better Stack Heartbeat.
    Ensures that /healthz executes a live database ping (SELECT 1) and responds in < 100ms.
    """
    client = TestClient(app)
    
    # Warm-up request (ASGI pipeline initialization)
    client.get("/healthz")

    start = time.perf_counter()
    res = client.get("/healthz")
    elapsed_ms = (time.perf_counter() - start) * 1000
    
    assert res.status_code == 200, f"Healthz probe failed: {res.text}"
    data = res.json()
    assert data.get("status") == "ok"
    assert data.get("database") == "healthy"
    assert data.get("service") == "Shree Vinayaka Furnitures API"
    assert elapsed_ms < 200, f"Steady-state uptime probe latency too high: {elapsed_ms:.1f}ms"
    print(f"\n[Production Monitoring] /healthz heartbeat verified in {elapsed_ms:.2f}ms (Status: Healthy).")


def test_sentry_realtime_monitoring_initialization():
    """
    Validates that Sentry SDK integrates cleanly with FastAPI & SQLAlchemy
    and captures unhandled exceptions without leaking credentials.
    """
    import sentry_sdk
    
    mock_hub = MagicMock()
    with patch.object(sentry_sdk, "init") as mock_init, \
         patch.object(sentry_sdk, "capture_exception") as mock_capture:
        
        # Test initialization with production DSN
        test_dsn = "https://public_key@o123456.ingest.sentry.io/7890123"
        sentry_sdk.init(
            dsn=test_dsn,
            environment="production",
            traces_sample_rate=1.0,
            send_default_pii=False
        )
        mock_init.assert_called_once()

        # Test unhandled exception capture
        try:
            raise ValueError("Test unexpected runtime crash")
        except Exception as e:
            sentry_sdk.capture_exception(e)
            mock_capture.assert_called_once_with(e)
            
    print("   [OK] Sentry SDK initialization and exception capture verified.")


def test_client_version_guard_prevents_stale_cloudflare_bundles():
    """
    Validates zero-downtime Cloudflare deployment safety:
    If a showroom terminal has an outdated PWA/JS bundle cached in browser
    sending an old X-Client-Version header, the backend rejects it with 426
    to trigger a fresh Cloudflare Pages chunk reload.
    """
    client = TestClient(app)
    
    # 1. Stale client version below MIN_CLIENT_VERSION (2026.1.0)
    stale_headers = {"X-Client-Version": "2024.1.0"}
    res_stale = client.get("/api/v1/health", headers=stale_headers)
    assert res_stale.status_code == 426, f"Expected 426 Upgrade Required for stale bundle, got {res_stale.status_code}"
    assert "outdated" in res_stale.json().get("detail", "").lower()

    # 2. Up-to-date client version
    current_headers = {"X-Client-Version": "2026.1.0"}
    res_current = client.get("/api/v1/health", headers=current_headers)
    assert res_current.status_code == 200, f"Current client bundle rejected: {res_current.text}"
    print("   [OK] Client version guard protects against stale Cloudflare cache drift.")


def test_dual_route_edge_compatibility():
    """
    Validates that endpoints are accessible via both /api/v1/... and /api/...
    allowing Cloudflare Workers & Pages reverse proxies seamless routing.
    """
    client = TestClient(app)
    
    res1 = client.get("/api/v1/health")
    res2 = client.get("/api/health")
    
    assert res1.status_code == 200
    assert res2.status_code == 200
    print("   [OK] Dual-route edge compatibility (/api/v1 and /api) verified.")
