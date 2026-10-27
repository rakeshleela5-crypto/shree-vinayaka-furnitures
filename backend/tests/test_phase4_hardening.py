"""
backend/tests/test_phase4_hardening.py
End-to-End Test Suite for Phase 4: Module 6 & Module 7
- Security, RBAC & API Hygiene (Features #2, #18, #19, #42, #43, #44, #45, #47, #48, #77)
- Automated Backups, Cron Jobs & Disaster Recovery (Features #41, #61, #67, #69, #74, #76, #97, #98)
"""
import unittest
import time
import os
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import (
    create_access_token,
    decode_access_token,
    create_refresh_token,
    rotate_refresh_token,
    revoke_refresh_token,
    revoke_all_user_tokens,
    get_current_user,
    require_role
)
from app.core.sanitizer import (
    sanitize_text,
    sanitize_for_html_template,
    is_ssrf_safe_url,
    assert_ssrf_safe_url
)
from app.services.feature_flag_service import (
    is_feature_enabled,
    set_feature_flag,
    list_feature_flags,
    clear_flag_cache,
    seed_default_feature_flags
)
from app.services.backup_cron import (
    run_daily_r2_backup,
    prune_old_backups,
    get_fernet_cipher
)
from app.models.user import User, RefreshToken
from app.models.feature_flag import FeatureFlag


class TestPhase4Hardening(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

        # Seed or ensure test users for OWNER, ACCOUNTANT, CASHIER, WAREHOUSE
        cls.roles = ["OWNER", "ACCOUNTANT", "CASHIER", "WAREHOUSE"]
        cls.test_users = {}

        for role in cls.roles:
            uname = f"test_user_{role.lower()}"
            u = cls.db.query(User).filter(User.username == uname).first()
            if not u:
                u = User(
                    username=uname,
                    full_name=f"Test {role} Staff",
                    password_hash="pass123",
                    user_type=role,
                    active=True
                )
                cls.db.add(u)
                cls.db.commit()
                cls.db.refresh(u)
            else:
                u.active = True
                u.user_type = role
                cls.db.commit()
            cls.test_users[role] = u

        # Seed default feature flags
        seed_default_feature_flags(cls.db)

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def setUp(self):
        clear_flag_cache()

    # =========================================================================
    # MODULE 6: JWT ROTATION & RBAC (#47, #48)
    # =========================================================================

    def test_01_short_lived_jwt_access_token_lifecycle(self):
        """Test short-lived (30 mins) JWT Access Token creation, claims, and decoding."""
        user = self.test_users["OWNER"]
        token = create_access_token(user_id=user.id, username=user.username, role=user.user_type)
        self.assertTrue(isinstance(token, str) and len(token) > 30)

        payload = decode_access_token(token)
        self.assertEqual(payload["sub"], str(user.id))
        self.assertEqual(payload["username"], user.username)
        self.assertEqual(payload["role"], "OWNER")
        self.assertEqual(payload["token_type"], "access")
        # Assert default 30-min expiration window
        exp_delta = payload["exp"] - payload["iat"]
        self.assertEqual(exp_delta, 30 * 60)

    def test_02_database_backed_refresh_token_rotation(self):
        """Test 7-day database-backed refresh token issuance, rotation, and old token invalidation."""
        user = self.test_users["CASHIER"]
        raw_refresh_1 = create_refresh_token(db=self.db, user=user, device_info="POS-Terminal-1")
        self.assertTrue(len(raw_refresh_1) > 20)

        # Rotate refresh token
        new_access, new_refresh, returned_user = rotate_refresh_token(db=self.db, raw_token=raw_refresh_1)
        self.assertNotEqual(raw_refresh_1, new_refresh)
        self.assertEqual(returned_user.id, user.id)

        # Verify old refresh token cannot be reused (replay attack prevention)
        with self.assertRaises(Exception):
            rotate_refresh_token(db=self.db, raw_token=raw_refresh_1)

    def test_03_staff_termination_instant_revocation(self):
        """Test that terminating a staff member immediately revokes all their active sessions."""
        term_user = self.db.query(User).filter(User.username == "test_user_warehouse").first()
        # Create active refresh tokens
        tok1 = create_refresh_token(db=self.db, user=term_user)
        tok2 = create_refresh_token(db=self.db, user=term_user)

        # Revoke all tokens on termination
        revoked_count = revoke_all_user_tokens(db=self.db, user_id=term_user.id)
        self.assertGreaterEqual(revoked_count, 2)

        # Attempting to rotate should now fail with 401
        with self.assertRaises(Exception):
            rotate_refresh_token(db=self.db, raw_token=tok1)

    def test_04_granular_rbac_role_dependencies(self):
        """Test require_role enforces OWNER/ACCOUNTANT on sensitive operations while blocking CASHIER/WAREHOUSE."""
        owner = self.test_users["OWNER"]
        accountant = self.test_users["ACCOUNTANT"]
        cashier = self.test_users["CASHIER"]
        warehouse = self.test_users["WAREHOUSE"]

        checker = require_role(["OWNER", "ACCOUNTANT"])

        # OWNER and ACCOUNTANT must succeed
        self.assertEqual(checker(owner).user_type, "OWNER")
        self.assertEqual(checker(accountant).user_type, "ACCOUNTANT")

        # CASHIER and WAREHOUSE must raise 403 Forbidden
        with self.assertRaises(Exception) as ctx_cashier:
            checker(cashier)
        self.assertEqual(ctx_cashier.exception.status_code, 403)

        with self.assertRaises(Exception) as ctx_warehouse:
            checker(warehouse)
        self.assertEqual(ctx_warehouse.exception.status_code, 403)

    # =========================================================================
    # MODULE 6: INPUT SANITIZATION, RATE LIMITING & CORS (#2, #18, #42, #43, #44)
    # =========================================================================

    def test_05_xss_input_sanitization(self):
        """Test customer names, addresses, and notes are sanitized against XSS."""
        malicious_name = 'Sri Vinayaka <script>alert("Hacked")</script> Furnitures'
        clean_name = sanitize_text(malicious_name)
        self.assertEqual(clean_name, "Sri Vinayaka  Furnitures")
        self.assertNotIn("<script>", clean_name)

        malicious_note = '<iframe src="evil.com"></iframe>Urgent delivery <img src=x onerror="stealCookies()">'
        clean_note = sanitize_text(malicious_note)
        self.assertEqual(clean_note, "Urgent delivery")
        self.assertNotIn("onerror", clean_note)
        self.assertNotIn("iframe", clean_note)

        # HTML entity escaping for PDF templates
        escaped_html = sanitize_for_html_template('Godrej Interio & "Woodcraft" <Standard>')
        self.assertEqual(escaped_html, "Godrej Interio &amp; &quot;Woodcraft&quot; &lt;Standard&gt;")

    def test_06_ssrf_whitelisted_domains_guard(self):
        """Test outbound SSRF validator permits only whitelisted domains (*.decentro.tech, *.r2.cloudflarestorage.com)."""
        # Allowed legitimate destinations
        self.assertTrue(is_ssrf_safe_url("https://in.decentro.tech/v2/banking/transfer"))
        self.assertTrue(is_ssrf_safe_url("https://staging.decentro.tech/v2/payments"))
        self.assertTrue(is_ssrf_safe_url("https://account123.r2.cloudflarestorage.com/svf-store-backups"))

        # Blocked SSRF attack targets
        self.assertFalse(is_ssrf_safe_url("http://localhost:8000/internal-secrets"))
        self.assertFalse(is_ssrf_safe_url("http://127.0.0.1:5432/admin"))
        self.assertFalse(is_ssrf_safe_url("http://169.254.169.254/latest/meta-data/"))  # AWS IMDS
        self.assertFalse(is_ssrf_safe_url("http://10.0.0.1/private-network"))
        self.assertFalse(is_ssrf_safe_url("https://evil-attacker.com/steal-keys"))

        with self.assertRaises(ValueError):
            assert_ssrf_safe_url("http://169.254.169.254/credentials")

    def test_07_cors_origins_configuration(self):
        """Test that CORS configuration strictly matches Cloudflare Pages production domain and dev localhost."""
        origins = settings.cors_origins_list
        self.assertIn("https://srivinayakafurnitures.pages.dev", origins)
        self.assertIn("http://localhost:5173", origins)

    # =========================================================================
    # MODULE 7: HEALTH CHECK, FEATURE FLAGS & BACKUPS (#41, #61, #67, #74, #97)
    # =========================================================================

    def test_08_health_check_probe(self):
        """Test GET /api/v1/health and /health readiness probes return 200 with database latency and R2 status."""
        resp = self.client.get("/api/v1/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("database", data["components"])
        self.assertEqual(data["components"]["database"]["status"], "healthy")
        self.assertGreaterEqual(data["components"]["database"]["latency_ms"], 0.0)
        self.assertIn("storage_r2", data["components"])

        # Verify root probe alias
        root_resp = self.client.get("/health")
        self.assertEqual(root_resp.status_code, 200)

    def test_09_feature_flags_dynamic_toggle_and_60s_cache(self):
        """Test dynamic feature flags with 60-second in-memory TTL cache."""
        # 1. Verify default values
        self.assertTrue(is_feature_enabled("auto_utr_reconciliation", db=self.db))
        self.assertTrue(is_feature_enabled("strict_box_scan_on_dispatch", db=self.db))
        self.assertFalse(is_feature_enabled("decentro_live_mode", db=self.db))

        # 2. Toggle decentro_live_mode to True
        set_feature_flag("decentro_live_mode", True, updated_by="TestOwner", db=self.db)
        # Should reflect immediately via cache
        self.assertTrue(is_feature_enabled("decentro_live_mode", db=self.db))

        # 3. Toggle back to False
        set_feature_flag("decentro_live_mode", False, updated_by="TestOwner", db=self.db)
        self.assertFalse(is_feature_enabled("decentro_live_mode", db=self.db))

    def test_10_automated_backup_fernet_encryption_and_restore_cycle(self):
        """Test automated backup pipeline: dump -> gzip -> Fernet encrypt -> verify decrypt -> restore dry-run."""
        # 1. Execute backup
        backup_result = run_daily_r2_backup()
        self.assertEqual(backup_result["status"], "success")
        self.assertTrue(backup_result["backup_key"].startswith("backups/db/svf_backup_"))
        self.assertGreater(backup_result["size_bytes"], 0)

        # 2. Verify Fernet decryption cycle
        cipher = get_fernet_cipher()
        from app.services.r2_storage import r2_storage
        encrypted_data = r2_storage.download_bytes(backup_result["backup_key"])
        decrypted_compressed = cipher.decrypt(encrypted_data)
        import gzip
        decompressed_dump = gzip.decompress(decrypted_compressed)
        self.assertGreater(len(decompressed_dump), 0)

        # 3. Execute restore script dry-run
        import subprocess
        restore_script = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts", "restore_from_r2.py")
        res = subprocess.run(
            ["python", restore_script, "--backup-key", backup_result["backup_key"], "--dry-run"],
            capture_output=True,
            text=True
        )
        combined_output = (res.stdout or "") + (res.stderr or "")
        self.assertIn("DISASTER RECOVERY COMPLETED SUCCESSFULLY", combined_output)


if __name__ == "__main__":
    unittest.main()
