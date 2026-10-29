from app.main import app
import json

schema = app.openapi()
paths = schema.get("paths", {})
print(f"Total OpenAPI Endpoint Paths registered: {len(paths)}")

total_methods = 0
prefixes_count = {}

for path, methods_dict in sorted(paths.items()):
    for method in methods_dict.keys():
        if method.lower() in ["get", "post", "put", "patch", "delete"]:
            total_methods += 1
            # categorize prefix
            parts = path.strip("/").split("/")
            prefix = "/" + "/".join(parts[:3]) if len(parts) >= 3 else "/" + "/".join(parts)
            prefixes_count[prefix] = prefixes_count.get(prefix, 0) + 1

print(f"Total API Method Operations registered: {total_methods}")
print("\n=== ENDPOINT BREAKDOWN BY PREFIX ===")
for p, count in sorted(prefixes_count.items()):
    print(f"  {p:<35} : {count} operations")

# Check specifically for newly added endpoints
audit_checks = [
    ("/api/v1/bootstrap/initial-state", "GET"),
    ("/api/v1/discounts/coupons", "GET"),
    ("/api/v1/discounts/gift-vouchers", "GET"),
    ("/api/v1/discounts/quantity-rules", "GET"),
    ("/api/v1/discounts/combo-packs", "GET"),
    ("/api/v1/discounts/eway-bills", "GET"),
    ("/api/v1/discounts/barcode-templates", "GET"),
    ("/api/v1/portal/customer-profile", "GET"),
    ("/api/v1/portal/invoices", "GET"),
    ("/api/v1/sales/payments/split", "POST"),
    ("/api/v1/sales/rubic-checkout", "POST"),
    ("/api/v1/sales/register-bill-wise", "GET"),
    ("/api/v1/sales/invoice-report", "GET"),
    ("/api/v1/products/quick-create", "POST"),
    ("/api/v1/products/bulk", "PUT"),
    ("/api/v1/products/prices/bulk", "PATCH"),
    ("/api/v1/products/stock-in-hand", "GET"),
    ("/api/v1/products/warehouse-breakdown", "GET"),
    ("/api/v1/customers/quick-create", "POST"),
    ("/api/v1/customers/bulk", "POST"),
    ("/api/v1/customers/outstanding-summary", "GET"),
    ("/api/v1/customers/outstanding-report", "GET"),
    ("/api/v1/purchases/dashboard-summary", "GET"),
    ("/api/v1/suppliers/outstanding-summary", "GET"),
    ("/api/v1/accounting/shifts/current", "GET"),
    ("/api/v1/accounting/shifts/close", "POST"),
    ("/api/v1/accounting/bank-statements/reconcile", "POST"),
    ("/api/v1/accounting/reports/trial-balance", "GET"),
    ("/api/v1/accounting/reports/balance-sheet", "GET"),
    ("/api/v1/accounting/reports/pnl", "GET"),
    ("/api/v1/telemetry/hardware/scale-event", "POST"),
    ("/api/v1/telemetry/whatsapp/send-bulk", "POST"),
    ("/api/v1/telemetry/whatsapp/campaigns", "GET")
]

print("\n=== PHASE 2 AUDIT CHECKPOINT VALIDATION ===")
all_passed = True
for path, meth in audit_checks:
    exists = path in paths and meth.lower() in paths[path]
    status_str = "PASSED" if exists else "FAILED"
    if not exists:
        all_passed = False
    print(f"  [{status_str}] {meth:<6} {path}")

print(f"\nAll Phase 2 Audited Endpoints Present: {all_passed}")
