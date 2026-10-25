import random
from locust import HttpUser, task, between

class ShowroomERPUser(HttpUser):
    """
    Simulates high-concurrency showroom staff behavior:
      - Authenticating as cashier
      - High-frequency barcode scanning & SKU queries
      - Real-time dashboard ledger inspection
      - Concurrent invoice validation & settlement checks
    """
    # Simulates staff clicking around every 1 to 3 seconds
    wait_time = between(1, 3)

    def on_start(self):
        """Authenticate and store JWT token on virtual user startup."""
        response = self.client.post("/api/auth/login", json={
            "username": "test_cashier",
            "password": "staging_password"
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            if token:
                self.client.headers.update({"Authorization": f"Bearer {token}"})

    @task(4)
    def search_inventory_and_barcodes(self):
        """High-frequency action: scanning barcodes or searching SKUs."""
        sku_query = random.choice(["TEAK-BED", "SOFA-3S", "WARDROBE", "GODREJ", "TABLE", "CHAIR"])
        self.client.get(f"/api/inventory/search?q={sku_query}", name="/api/inventory/search")

    @task(2)
    def view_dashboard_ledger(self):
        """Medium-frequency action: loading daily sales and pending dues."""
        self.client.get("/api/reports/daily-summary", name="/api/reports/daily-summary")

    @task(1)
    def create_draft_invoice_check(self):
        """Critical write path: testing DB transaction throughput."""
        payload = {
            "customer_name": "Load Test Customer",
            "items": [{"sku_id": 101, "qty": 1, "price": 45000}],
            "payment_mode": "UPI_UTR",
            "utr_reference": f"UTR{random.randint(10000000, 99999999)}"
        }
        # Point this to a staging endpoint or dry-run route
        self.client.post("/api/billing/validate-invoice", json=payload, name="/api/billing/validate-invoice")
