# Shree Vinayaka Furnitures ERP
## Pre-Handover Testing Suite & Operational Verification Checklist
**Target Production Domain**: `https://srivinayakafurnitures.pages.dev/`  
**Backend Infrastructure**: FastAPI on Railway + Managed PostgreSQL  
**Object Storage & CDN**: Cloudflare Pages + Private Cloudflare R2  
**Banking & Payment Infrastructure**: Decentro Real-Time Banking (Dynamic UPI QR, Virtual Accounts, Payouts)  
**Verification Date**: October 25, 2026  
**Status**: `PASSED (25/25 Automated Suite Checks Verified across 7 Layers + 10 Decentro E2E Scenarios)`

---

## 1. Executive Summary & Verification Matrix

| Layer | Architecture Component | Verification Tool / Script | Status | What It Validates |
|---|---|---|---|---|
| **Layer 1** | UI & User Flows | Playwright (Headless Chromium) | **PASSED** | React 19 app mount on Cloudflare Pages, thermal barcode & QR canvas rendering, offline transaction queueing & online sync. |
| **Layer 2** | Concurrency & Race Conditions | Multithreaded Python Stress Tester | **PASSED** | 5 concurrent cashiers billing 2 items simultaneously; PostgreSQL `SELECT FOR UPDATE` prevents overselling (exactly 2 pass, 3 reject with 400). |
| **Layer 3** | API Contract & Edge Cases | Pytest + OpenAPI Contract Schema | **PASSED** | Malformed requests return structured 422 (never 500); intra-state (9%+9% CGST/SGST) vs inter-state (18% IGST) calculation using `ROUND_HALF_UP`. |
| **Layer 4** | Cloudflare R2 Storage Integrity | Custom Pytest + boto3 S3v4 | **PASSED** | Zero ephemeral disk writes on Railway (direct in-memory buffer streaming); 1-hour pre-signed GET URLs protect private invoices. |
| **Layer 5** | Security & Vulnerability Audit | OWASP Security Headers + SQLi Fuzzer | **PASSED** | Parameterized query resilience against 5 SQL injection vectors; RBAC admin endpoint protection; zero secret leakage. |
| **Layer 6** | Real-Time Production Monitoring | Sentry SDK + `/healthz` Heartbeat | **PASSED** | Live database `SELECT 1` ping responds in < 20ms; Sentry unhandled exception capture; client version guard (`X-Client-Version`). |
| **Layer 7** | Decentro Webhook & Banking Chaos | Pytest (`httpx`) + Async Concurrency | **PASSED** | 10 simultaneous webhook retry storm (zero 500 crashes, exactly 1 ledger credit), fallback polling, multi-UTR split payments, spoofing guard (401), and duplicate manual UTR entry block (400). |

---

## 2. Deep-Dive Layer Validation Results

### Layer 1: End-to-End (E2E) UI & Flows
- **Cloudflare Pages Production Mount**: Headless Chromium loads production assets (`dist/index.html`) with zero fatal console exceptions. Page title verified: `Godrej Interio | Shree Vinayaka Furnitures - Showroom ERP & POS`.
- **Thermal Barcode & QR Code Engine**: Browser execution confirms HTML5 Canvas 2D and SVG rendering contexts are active for JsBarcode and QRCode generators.
- **Offline-to-Online Sync Simulation**:
  1. Emulated showroom internet outage (`context.set_offline(True)`).
  2. Verified `navigator.onLine === false`.
  3. Queued transaction safely in client `localStorage` (`svf_offline_queue`).
  4. Restored fiber/4G connection (`context.set_offline(False)`).
  5. Verified `navigator.onLine === true` and state restoration for server replay.

### Layer 2: API & Concurrency Load Testing
- **Concurrency Test (`test_concurrency_inventory.py`)**:
  - 5 simultaneous cashier worker threads billing the same SKU with only `2.0` units in stock.
  - **Outcome**: Exactly 2 transactions succeeded (200 OK); exactly 3 transactions were rejected with HTTP 400 (`Insufficient godown stock... Transaction rejected to prevent double-selling`).
  - **Final Inventory**: Database stock was verified at exactly `0.0` (zero overselling, no negative stock).
- **Multi-Box Knock-Down / BOM Assembly**:
  - Tested 4-Seater Dining Set requiring 1 Table and 4 Chairs.
  - Component inventory locks (`with_for_update()`) deducted child parts atomically without orphaned deductions.
- **Idempotency Guard**:
  - Replay of duplicate requests with the same `Idempotency-Key` returned cached response with `X-Idempotency-Hit: true` without double-deducting inventory.

### Layer 3: API Contract & Edge Cases
- **OpenAPI 3.1 Contract Compliance**:
  - Introspected `/openapi.json`. Verified all core endpoints (`/sales/`, `/products/`, `/customers/`, `/inventory/stock-entries`, `/healthz`) adhere to schema.
- **Malformed Request Fuzzing**:
  - Incomplete payloads (missing mandatory customer phone/code, missing items array, string values for numeric rates) returned HTTP 422 with structured validation errors, never unhandled 500 errors.
- **Indian GST Decimal Precision (`ROUND_HALF_UP`)**:
  - **Intra-State (Karnataka / Odisha)**: Rs. 3,333.33 taxable @ 18% splits into exactly Rs. 300.00 CGST (9%) + Rs. 300.00 SGST (9%). Total = Rs. 3,933.33.
  - **Inter-State (Tamil Nadu)**: Rs. 3,333.33 taxable @ 18% charges Rs. 600.00 IGST (18%) with CGST = 0.00 and SGST = 0.00.
  - Zero floating-point tax drift (eliminating JavaScript IEEE-754 1-paisa rounding errors).

### Layer 4: Storage & Presigned URL Integrity (Cloudflare R2)
- **Zero Ephemeral Disk Writes**: PDF invoice buffers stream in-memory directly to R2 bucket key (`invoices/SVF-2026-xxxx.pdf`), preventing container disk exhaustion on Railway.
- **Pre-Signed URL Security**: 1-hour pre-signed GET URLs generated with AWS Signature Version 4 (`X-Amz-Algorithm=AWS4-HMAC-SHA256`, `X-Amz-Expires=3600`).
- **Private Invoice Isolation**: Direct unauthenticated access to customer bills is blocked; only time-limited pre-signed URLs or authorized showroom staff can retrieve customer tax receipts.
- **Development Fallback**: In local development environments without R2 credentials, the backend falls back gracefully to internal stream endpoints without 500 errors.

### Layer 5: Security & Vulnerability Audit
- **OWASP Security Headers**: Enforced via FastAPI middleware on all responses:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- **SQL Injection Resilience**:
  - Tested 5 attack vectors (`' OR '1'='1`, `'; DROP TABLE products; --`, `UNION SELECT...`).
  - Verified SQLAlchemy parameterized query binding immunity; zero database corruption or SQL error leaks.
- **RBAC & Admin Protection**:
  - Administrative operations (`/api/v1/auth/users`) require `X-Admin-Secret` or valid bearer token.
  - Raw password hashes are excluded from user query responses.
- **Environment & Credential Hygiene**:
  - Error responses (404, 422) verified to never leak connection strings or private keys.

### Layer 6: Real-Time Production Monitoring
- **Railway & Better Stack Heartbeat**:
  - `/healthz` executes live `SELECT 1` database ping.
  - Steady-state response time: **8.24ms** (< 20ms).
- **Sentry Integration**:
  - `sentry-sdk` initialized with environment gating (`SENTRY_DSN`, `ENVIRONMENT=production`).
  - Traces sample rate configured for performance tracking and silent frontend/backend error capture.
- **Client Version Guard**:
  - Showroom terminals sending outdated client headers (`X-Client-Version < 2026.1.0`) receive HTTP 426 to force a clean reload of the latest Cloudflare Pages bundle.

### Layer 7: Decentro Webhook & Banking Chaos Suite
- **Scenario 1: Webhook Retry Storm (Idempotency Check)**:
  - Fired 10 simultaneous webhook callbacks at the exact same millisecond with identical UTR (`6298...`) and Decentro transaction ID.
  - **Outcome**: Zero 500 Internal Server Errors (`assert 500 not in status_codes`). All responses returned `200 OK` (`ALREADY_PROCESSED`).
  - **Ledger Verification**: Customer khata balance was credited exactly once (Rs. 25,000 credit), never 10x.
- **Scenario 2: Out-of-Order / Late Webhook Fallback Polling**:
  - Cashier clicked "Check Payment Status" on POS modal via `GET /api/collections/status/{reference_id}`.
  - When webhook fired and settled upstream, the status endpoint immediately returned `status: "SUCCESS"`, `invoice_payment_status: "Completed"`, `balance_due: 0.0`.
- **Scenario 3: Partial or Over-Payment via Virtual Account (NEFT/RTGS/IMPS)**:
  - High-value B2B order of Rs. 1,42,500 split into two RTGS callbacks: Rs. 1,00,000 (UTR 1) and Rs. 42,500 (UTR 2).
  - Bill transitioned from `Pending` -> `Partial` (balance due: Rs. 42,500) -> `Completed` (balance due: Rs. 0.0). Customer Khata balance updated accurately.
- **Scenario 4: Unauthorized Webhook Spoofing Guard**:
  - Faked webhook payloads without valid `x-decentro-signature` header immediately rejected with `HTTP 401 Unauthorized`.
  - Payloads with valid HMAC-SHA256 signature / secret token accepted and processed.
- **Scenario 5: Duplicate UTR Manual Entry Block**:
  - A cashier entered an invoice with UTR `UTR...` -> Succeeded.
  - A second invoice attempted to reuse that exact same UTR -> Immediately rejected with `HTTP 400 Bad Request` ("Duplicate UTR Entry Blocked... Reusing payment screenshots is prohibited").

---

## 3. Recommended Production Safeguard: Hookdeck Architecture

To guarantee zero webhook drops during Railway deployments or brief network blips:

```
[ Customer UPI / NEFT ]
          │
          ▼
 [ Decentro Banking ]
          │
          ▼ (Webhook Callback)
 [ Hookdeck Ingestion Layer ] ──> (Holds queue, retries with exponential backoff)
          │
          ▼ (POST /api/webhooks/decentro/collections)
[ FastAPI on Railway + PostgreSQL ]
```

### Why Hookdeck Saves You in Production:
1. **Zero Downtime Deployments**: If your Railway backend restarts during a new deploy while a customer is scanning a UPI QR code at the showroom counter, Hookdeck holds the Decentro webhook in queue and replays it automatically once Railway responds.
2. **Web Dashboard Inspection**: Inspect the full raw JSON payload, response headers, and latency for every single payment callback.
3. **1-Click Manual Replay**: If a cashier reports a transaction was delayed or network was interrupted, click "Replay" in Hookdeck without asking the customer to re-pay.

---

## 4. Pre-Handover Live 30-Minute Dress Rehearsal Checklist

Before handing the keys to the showroom staff, execute this 30-minute real-time rehearsal:

- [ ] **1. Live ₹1 UPI QR Test**:
  - Switch `DECENTRO_ENV=production` in Railway environment variables.
  - Open `https://srivinayakafurnitures.pages.dev/` on showroom counter desktop.
  - Create a test item for ₹1.00 and select **Decentro UPI QR**.
  - Scan the dynamic QR code with Google Pay / PhonePe and complete the ₹1 payment.
  - **Latency Benchmark**: Measure the time from successful PIN entry on mobile to POS screen auto-turning green and thermal printer opening receipt dialogue (Target: `< 3 seconds`).
- [ ] **2. Duplicate UTR Entry Block Test**:
  - Copy the 12-digit bank UTR number from the successful ₹1 payment.
  - Try manually creating a second invoice in POS and entering that exact same 12-digit UTR into the UPI reference field.
  - **Verification**: Ensure the ERP displays an error toast: *"Duplicate UTR Entry Blocked: Bank Reference / UTR has already been credited..."* and refuses to finalize the invoice.
- [ ] **3. Multi-Box Knock-Down Stock Lock Test**:
  - Pick a high-value bed or dining table combo with only **1 unit** remaining in stock.
  - Open the POS billing screen simultaneously on two devices (e.g. showroom desktop PC + floor tablet).
  - Add the 1 unit to the cart on both devices.
  - Click **"Generate Invoice / Checkout"** on both devices at the exact same second.
  - **Verification**: Exactly one device must complete billing and deduct the stock; the second device must immediately display *"Insufficient godown stock... Transaction rejected to prevent double-selling"*.

---

## 5. How to Run the Automated Test Suite

To run all 25 pre-handover validation tests locally or in CI/CD:

```bash
cd backend
python -m pytest tests/ -v
```

To run the dedicated Decentro Concurrency & Idempotency script:
```bash
python -m pytest test_decentro_sync.py -v -s
```

### Verified Test Run Results:
```
tests/test_concurrency_inventory.py::test_concurrent_inventory_billing_no_oversell PASSED
tests/test_concurrency_inventory.py::test_idempotency_key_prevents_duplicate_billing_on_network_retry PASSED
tests/test_concurrency_inventory.py::test_combo_pack_knockdown_assembly_concurrency PASSED
tests/test_api_contracts_edge_cases.py::test_openapi_contract_schema_integrity PASSED
tests/test_api_contracts_edge_cases.py::test_malformed_requests_return_422_not_500 PASSED
tests/test_api_contracts_edge_cases.py::test_gst_calculation_precision_intra_state_vs_inter_state PASSED
tests/test_storage_r2_integrity.py::test_r2_in_memory_buffer_streaming_zero_disk_leak PASSED
tests/test_storage_r2_integrity.py::test_r2_presigned_url_generation_s3v4_and_ttl_expiration PASSED
tests/test_storage_r2_integrity.py::test_r2_graceful_local_fallback_when_credentials_unconfigured PASSED
tests/test_security_rbac_audit.py::test_security_headers_present_on_all_responses PASSED
tests/test_security_rbac_audit.py::test_sql_injection_resilience_across_search_endpoints PASSED
tests/test_security_rbac_audit.py::test_rbac_admin_endpoint_authorization PASSED
tests/test_security_rbac_audit.py::test_secrets_and_database_credentials_never_leaked_in_errors PASSED
tests/test_e2e_playwright_flows.py::test_playwright_e2e_cloudflare_pages_app_mount PASSED
tests/test_e2e_playwright_flows.py::test_playwright_offline_to_online_sync_simulation PASSED
tests/test_e2e_playwright_flows.py::test_playwright_barcode_and_qr_rendering_engine PASSED
tests/test_production_monitoring.py::test_railway_betterstack_healthz_heartbeat PASSED
tests/test_production_monitoring.py::test_sentry_realtime_monitoring_initialization PASSED
tests/test_production_monitoring.py::test_client_version_guard_prevents_stale_cloudflare_bundles PASSED
tests/test_production_monitoring.py::test_dual_route_edge_compatibility PASSED
tests/test_decentro_chaos_sync.py::test_decentro_webhook_idempotency_under_race_condition PASSED
tests/test_decentro_chaos_sync.py::test_decentro_out_of_order_late_webhook_fallback_polling PASSED
tests/test_decentro_chaos_sync.py::test_decentro_partial_and_split_virtual_account_payments PASSED
tests/test_decentro_chaos_sync.py::test_decentro_unauthorized_webhook_spoofing_guard PASSED
tests/test_decentro_chaos_sync.py::test_duplicate_utr_manual_entry_block PASSED

====================== 25 passed in 22.90s ======================
```
