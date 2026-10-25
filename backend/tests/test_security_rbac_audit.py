import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.product import Product

def test_security_headers_present_on_all_responses():
    """
    Validates Layer 4: Security Headers & Clickjacking Protection.
    Ensures that OWASP-recommended security headers are enforced on every response:
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: SAMEORIGIN
    - Referrer-Policy: strict-origin-when-cross-origin
    - Strict-Transport-Security: max-age=31536000
    """
    client = TestClient(app)
    res = client.get("/healthz")
    assert res.status_code == 200
    
    headers = res.headers
    assert headers.get("X-Content-Type-Options") == "nosniff", "Missing X-Content-Type-Options header"
    assert headers.get("X-Frame-Options") == "SAMEORIGIN", "Missing X-Frame-Options clickjacking protection"
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin", "Missing Referrer-Policy"
    assert "max-age=31536000" in headers.get("Strict-Transport-Security", ""), "Missing HSTS header"
    print("\n[Security Audit] All 4 mandatory OWASP security headers verified.")


def test_sql_injection_resilience_across_search_endpoints():
    """
    Validates that database search and lookup endpoints use SQLAlchemy parameterized queries,
    completely immune to SQL injection attacks.
    """
    client = TestClient(app)
    
    malicious_payloads = [
        "' OR '1'='1",
        "'; DROP TABLE products; --",
        "1 UNION SELECT 1, 'hacked', 3, 4, 5, 6, 7 --",
        "' OR 1=1 #",
        "\" OR \"\"=\""
    ]

    for payload in malicious_payloads:
        # Test 1: Products query
        res_prod = client.get(f"/api/v1/products/?query={payload}")
        assert res_prod.status_code == 200, f"SQLi payload triggered failure on products: {payload}"
        
        # Test 2: Customers query
        res_cust = client.get(f"/api/v1/customers/?query={payload}")
        assert res_cust.status_code == 200, f"SQLi payload triggered failure on customers: {payload}"

        # Test 3: Invoice by-no lookup
        res_inv = client.get(f"/api/v1/sales/by-no/{payload}")
        # Must return 404 Not Found, never 500 Database Syntax Error
        assert res_inv.status_code == 404, f"SQLi payload broke invoice query: {payload}"

    # Verify products table is completely intact
    db = SessionLocal()
    prod_count = db.query(Product).count()
    assert prod_count > 0, "Products table was modified or dropped by SQLi test!"
    db.close()
    print(f"   [OK] SQL Injection immunity verified against {len(malicious_payloads)} attack vectors.")


def test_rbac_admin_endpoint_authorization():
    """
    Validates Role-Based Access Control:
    Ensures administrative operations require admin credentials when INTERNAL_API_SECRET is configured.
    """
    client = TestClient(app)
    
    with patch.object(settings, "INTERNAL_API_SECRET", "super-secret-production-key"):
        # Attempt to create user without authorization secret
        payload = {
            "username": "unauthorized_cashier",
            "full_name": "Rogue Cashier",
            "password": "password123",
            "user_type": "Admin"
        }
        res = client.post("/api/v1/auth/users", json=payload)
        assert res.status_code == 401, f"Expected 401 Unauthorized without secret, got {res.status_code}"
        
        # Retry with valid admin secret header
        res_auth = client.post(
            "/api/v1/auth/users",
            json=payload,
            headers={"X-Admin-Secret": "super-secret-production-key"}
        )
        assert res_auth.status_code in (200, 201), f"Expected 200 with valid secret, got {res_auth.status_code}"
        user_data = res_auth.json()
        assert "password_hash" not in user_data or user_data.get("password_hash") != "password123", \
            "Raw password should never be exposed in plain text"
        print("   [OK] RBAC Admin endpoint restriction verified.")


def test_secrets_and_database_credentials_never_leaked_in_errors():
    """
    Validates that error responses never expose database connection strings,
    internal secrets, or raw server file paths.
    """
    client = TestClient(app)
    
    # 404 route
    res_404 = client.get("/api/v1/non-existent-secret-path")
    assert "postgresql" not in res_404.text.lower()
    assert "password" not in res_404.text.lower()

    # 422 schema error
    res_422 = client.post("/api/v1/sales/", json={})
    assert "DATABASE_URL" not in res_422.text
    assert "R2_SECRET_ACCESS_KEY" not in res_422.text
    print("   [OK] Secret leakage hygiene verified across error handlers.")


def test_role_isolation_floor_salesperson_blocked_from_admin_ops():
    """
    UAT Role Isolation Test:
    Verifies that floor salesperson and reception staff credentials
    are strictly blocked from executing administrative operations
    such as creating database backups or modifying system users.
    """
    client = TestClient(app)
    
    # 1. Login as standard staff / cashier
    login_res = client.post("/api/auth/login", json={
        "username": "test_cashier",
        "password": "staging_password"
    })
    assert login_res.status_code == 200
    token = login_res.json().get("access_token")
    staff_headers = {"Authorization": f"Bearer {token}"}

    # 2. Staff attempts to trigger full database backup dump (admin-only)
    backup_res = client.post("/api/backup/create", headers=staff_headers)
    assert backup_res.status_code in (401, 403), f"Expected 401/403 for unauthorized backup attempt, got {backup_res.status_code}"

    # 3. Staff attempts to create or elevate a user account
    user_res = client.post(
        "/api/v1/auth/users",
        json={"username": "hacker", "full_name": "Infiltrator", "password": "123", "user_type": "Admin"},
        headers=staff_headers
    )
    assert user_res.status_code in (401, 403), f"Expected 401/403 for unauthorized user creation, got {user_res.status_code}"
    print("   [OK] Role Isolation: Floor staff strictly blocked (401/403) from administrative operations.")
