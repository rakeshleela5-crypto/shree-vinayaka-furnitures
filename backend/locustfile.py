import random
from locust import HttpUser, task, between

class ShowroomERPRushUser(HttpUser):
    """
    Simulates high-concurrency showroom staff during peak festival / rush hours:
      - Continuous barcode scanning & SKU queries (fast response < 50ms)
      - Customer ledger lookup & Khata balance check
      - Next sequential GST invoice number reservations
      - Day-end cash drawer / Z-report health checks
    """
    wait_time = between(0.1, 0.5) # Fast showroom POS terminal pace

    @task(5)
    def barcode_scan_and_sku_lookup(self):
        """High-frequency action: scanning barcodes on showroom floor."""
        query = random.choice(["TEAK", "SOFA", "BED", "TABLE", "CHAIR", "ROYAL", "WARDROBE", "1"])
        self.client.get(f"/api/v1/products/?query={query}&limit=10", name="/api/v1/products/?query=[sku]")

    @task(3)
    def customer_khata_lookup(self):
        """Medium-frequency action: pulling customer credit balance & phone search."""
        self.client.get("/api/v1/customers/?limit=10", name="/api/v1/customers/?limit=10")

    @task(2)
    def next_invoice_sequence_probe(self):
        """POS counter action: getting real-time atomic GST invoice sequence."""
        self.client.get("/api/v1/sales/next-invoice-no?prefix=SVF", name="/api/v1/sales/next-invoice-no")

    @task(2)
    def inventory_low_stock_audit(self):
        """Warehouse action: querying real-time low-stock items."""
        self.client.get("/api/v1/inventory/low-stock?threshold=5", name="/api/v1/inventory/low-stock")

    @task(1)
    def health_heartbeat(self):
        """Continuous uptime ping monitoring probe."""
        self.client.get("/healthz", name="/healthz")
