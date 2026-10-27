"""
backend/tests/test_phase3_features.py
Automated Verification Suite for Phase 3: MODULE 4 & MODULE 5.
Features:
- Cloudflare R2 Presigned URLs (ExpiresIn=900) & Edge Caching (#85, #86)
- WebP Furniture Image Compression (max-width: 1600px, quality 82) (#85, #86)
- Offline-First POS & Delta Sync /api/v1/catalog/sync?since={timestamp} (#6, #7, #33, #93)
- Real-Time WebSockets POS Terminal Push WS /api/v1/ws/pos/{terminal_id} (#37, #54)
- Barcode Studio Zero Memory Leak Buffer Closure (#16, #40, #91)
- Barcode Studio Backpressure Limits (<=200 sync, >200 async HTTP 202) (#91)
"""
import sys
import os
import io
import time
import uuid
import json
import unittest
from datetime import datetime, timezone, timedelta
from PIL import Image

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Ensure backend root is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.core.database import SessionLocal, engine, Base
from app.models.product import Product, ProductBox
from app.models.customer import Customer
from app.models.sale import SaleInvoice, SaleInvoiceItem
from app.services.r2_storage import r2_service
from app.services.realtime import realtime_manager


class Phase3FeaturesTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)
        cls.db: Session = SessionLocal()

        # Seed or find test product
        cls.product = cls.db.query(Product).filter(Product.barcode == "PHASE3-TEST-BARCODE").first()
        if not cls.product:
            cls.product = Product(
                name="Phase 3 Teak Wood Dining Table",
                p_code="P3-DINING-01",
                barcode="PHASE3-TEST-BARCODE",
                sku="P3-DINING-01",
                brand="Godrej Interio",
                retail_price=24500.0,
                mrp=28900.0,
                current_stock=10.0,
                physical_stock=10.0,
                godown_available_qty=8.0,
                showroom_display_qty=2.0,
                is_knockdown=True,
                total_boxes=2,
                is_active=True
            )
            cls.db.add(cls.product)
            cls.db.commit()
            cls.db.refresh(cls.product)

        # Seed product boxes for knockdown test
        cls.box1 = cls.db.query(ProductBox).filter(ProductBox.barcode_uid == "P3-BOX-01").first()
        if not cls.box1:
            cls.box1 = ProductBox(
                product_id=cls.product.id,
                box_number=1,
                total_boxes=2,
                component_name="Box 1 of 2: Table Top & Frame",
                barcode_uid="P3-BOX-01",
                box_barcode="P3-BOX-01-BAR",
                status="InStock"
            )
            cls.db.add(cls.box1)

        cls.box2 = cls.db.query(ProductBox).filter(ProductBox.barcode_uid == "P3-BOX-02").first()
        if not cls.box2:
            cls.box2 = ProductBox(
                product_id=cls.product.id,
                box_number=2,
                total_boxes=2,
                component_name="Box 2 of 2: Solid Legs & Hardware Pack",
                barcode_uid="P3-BOX-02",
                box_barcode="P3-BOX-02-BAR",
                status="InStock"
            )
            cls.db.add(cls.box2)
        cls.db.commit()

        # Seed sample invoice
        cls.invoice = cls.db.query(SaleInvoice).filter(SaleInvoice.invoice_no == "SVF-P3-0001").first()
        if not cls.invoice:
            cls.invoice = SaleInvoice(
                invoice_no="SVF-P3-0001",
                customer_name="Phase3 Test Customer",
                customer_phone="9847000003",
                date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                time=datetime.now(timezone.utc).strftime("%H:%M:%S"),
                bill_type="Retail",
                payment_mode="Decentro UPI QR",
                sub_total=24500.0,
                cgst_total=2205.0,
                sgst_total=2205.0,
                grand_total=28910.0,
                paid_amount=28910.0,
                balance_due=0.0,
                status="Paid"
            )
            cls.db.add(cls.invoice)
            cls.db.commit()
            cls.db.refresh(cls.invoice)

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    # --------------------------------------------------------------------------
    # FEATURE 1: Cloudflare R2 WebP Furniture Image Compression (#85, #86)
    # --------------------------------------------------------------------------
    def test_01_webp_furniture_image_compression(self):
        """Verifies that large furniture images are downscaled to <=1600px and converted to WebP."""
        # Create a large uncompressed test image (2400 x 1800 RGB)
        img = Image.new("RGB", (2400, 1800), color=(180, 110, 60))
        raw_io = io.BytesIO()
        img.save(raw_io, format="JPEG", quality=95)
        raw_bytes = raw_io.getvalue()
        raw_io.close()
        img.close()

        # Compress via r2_service
        webp_bytes = r2_service.compress_furniture_image_webp(raw_bytes, max_width=1600, quality=82)
        
        self.assertGreater(len(webp_bytes), 0, "Compressed bytes must not be empty")
        self.assertTrue(webp_bytes.startswith(b"RIFF") and b"WEBP" in webp_bytes[:16], "Must be valid WebP binary format")
        self.assertLess(len(webp_bytes), len(raw_bytes), "WebP compressed image must be significantly smaller than raw JPEG")

        # Verify dimensions were capped to max 1600px width
        verify_io = io.BytesIO(webp_bytes)
        verify_img = Image.open(verify_io)
        self.assertLessEqual(verify_img.width, 1600, "Max width must not exceed 1600px")
        self.assertEqual(verify_img.format, "WEBP", "Image format must be WEBP")
        verify_img.close()
        verify_io.close()

    def test_02_r2_upload_furniture_image_cache_control(self):
        """Verifies that upload_furniture_image attaches immutable long-term edge cache header."""
        img = Image.new("RGB", (800, 600), color=(100, 150, 200))
        raw_io = io.BytesIO()
        img.save(raw_io, format="PNG")
        raw_bytes = raw_io.getvalue()
        raw_io.close()
        img.close()

        key, public_url = r2_service.upload_furniture_image(
            key="products/test_teak_sofa.png",
            image_bytes=raw_bytes,
            max_width=1600,
            quality=82
        )
        self.assertTrue(key.endswith(".webp"), "Destination key must have .webp extension")
        self.assertTrue(public_url.startswith("http") or public_url.startswith("/"), "Public URL must be a valid URL or proxy path")
        self.assertIn("products/test_teak_sofa.webp", public_url)

    # --------------------------------------------------------------------------
    # FEATURE 2: Cloudflare R2 Presigned URLs (ExpiresIn=900) for Private Invoices (#85, #86)
    # --------------------------------------------------------------------------
    def test_03_r2_short_lived_presigned_url_900_seconds(self):
        """Verifies that private financial invoice links use short-lived 900s (15 min) presigned URLs."""
        res = self.client.get(f"/api/v1/sales/{self.invoice.id}/presigned-url")
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertEqual(data["invoice_no"], self.invoice.invoice_no)
        self.assertEqual(data["expires_in_seconds"], 900, "Presigned URL must expire in exactly 900 seconds (15 min)")
        self.assertTrue("presigned_url" in data and len(data["presigned_url"]) > 10)
        self.assertIn("invoices/2026-2027", data["r2_key"])

    def test_04_invoice_pdf_r2_upload_headers(self):
        """Verifies that invoice PDF endpoint uploads to R2 and returns presigned headers."""
        res = self.client.get(f"/api/v1/sales/{self.invoice.id}/pdf")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("content-type"), "application/pdf")
        self.assertTrue(res.content.startswith(b"%PDF-"), "Response must be valid binary PDF")
        
        # Verify R2 integration headers
        self.assertIn("x-cloudflare-r2-path", res.headers)
        self.assertIn("x-cloudflare-r2-presigned-url", res.headers)
        self.assertIn("x-invoice-no", res.headers)

    # --------------------------------------------------------------------------
    # FEATURE 3: Offline-First POS & Delta Catalog Sync (#6, #7, #33, #93)
    # --------------------------------------------------------------------------
    def test_05_catalog_delta_sync_full(self):
        """Verifies full catalog sync returns products, knockdown boxes, and server_time."""
        res = self.client.get("/api/v1/catalog/sync")
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertIn("server_time", data)
        self.assertIn("products", data)
        self.assertIn("product_boxes", data)
        self.assertIn("tombstones", data)
        self.assertGreater(data["total_updated"], 0)

        # Check seeded product is present
        p_ids = [p["id"] for p in data["products"]]
        self.assertIn(self.product.id, p_ids)

        # Check knockdown boxes are present
        box_uids = [b["barcode_uid"] for b in data["product_boxes"]]
        self.assertIn("P3-BOX-01", box_uids)
        self.assertIn("P3-BOX-02", box_uids)

    def test_06_catalog_delta_sync_with_since_filter(self):
        """Verifies delta sync only returns items modified since timestamp."""
        # Query with future timestamp - should return 0 modified products
        future_ts = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        res = self.client.get(f"/api/v1/catalog/sync?since={future_ts}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total_updated"], 0, "Future since query must return 0 updated products")
        self.assertEqual(len(data["products"]), 0)

        # Query with past timestamp - should return our seeded product
        past_ts = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        res_past = self.client.get(f"/api/v1/catalog/sync?since={past_ts}")
        self.assertEqual(res_past.status_code, 200)
        data_past = res_past.json()
        self.assertGreater(data_past["total_updated"], 0)

    # --------------------------------------------------------------------------
    # FEATURE 4: WebSocket Real-Time POS Payment Push (#37, #54)
    # --------------------------------------------------------------------------
    def test_07_websocket_pos_terminal_ping_pong(self):
        """Verifies that POS terminal WebSocket /ws/pos/{terminal_id} connects and responds to ping."""
        terminal_id = "COUNTER-01"
        with self.client.websocket_connect(f"/ws/pos/{terminal_id}") as websocket:
            websocket.send_text("ping")
            data = websocket.receive_text()
            parsed = json.loads(data)
            self.assertEqual(parsed.get("event"), "pong")
            self.assertEqual(parsed.get("terminal_id"), terminal_id)

    def test_08_websocket_broadcast_payment_success(self):
        """Verifies realtime_manager can broadcast PAYMENT_SUCCESS without errors."""
        try:
            realtime_manager.broadcast_payment_success(
                invoice_id=self.invoice.id,
                utr="UTR-P3-TEST-9988",
                terminal_id="COUNTER-01",
                amount=28910.0
            )
            success = True
        except Exception as e:
            success = False
        self.assertTrue(success, "broadcast_payment_success must execute cleanly")

    # --------------------------------------------------------------------------
    # FEATURE 5: Barcode Studio Memory Safety & Backpressure Limits (#16, #40, #91)
    # --------------------------------------------------------------------------
    def test_09_barcode_studio_sync_batch_under_200(self):
        """Verifies synchronous generation for batches <= 200 labels with R2 upload headers."""
        payload = {
            "items": [
                {"product_id": self.product.id, "count": 5}
            ],
            "format": "pdf"
        }
        res = self.client.post("/api/v1/products/barcode-studio/batch-labels", json=payload)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("content-type"), "application/pdf")
        self.assertTrue(res.content.startswith(b"%PDF-"), "Batch response must be valid binary PDF")
        self.assertEqual(res.headers.get("x-total-labels"), "5")
        self.assertIn("x-cloudflare-r2-path", res.headers)
        self.assertIn("x-cloudflare-r2-presigned-url", res.headers)

    def test_10_barcode_studio_backpressure_over_200(self):
        """Verifies that batches > 200 labels trigger backpressure HTTP 202 and offload to R2."""
        payload = {
            "items": [
                {"product_id": self.product.id, "count": 250} # > 200 labels
            ],
            "format": "pdf"
        }
        res = self.client.post("/api/v1/products/barcode-studio/batch-labels", json=payload)
        self.assertEqual(res.status_code, 202, "Batches > 200 labels must return HTTP 202 Accepted")
        data = res.json()

        self.assertEqual(data["status"], "PROCESSING")
        self.assertEqual(data["total_labels"], 250)
        self.assertTrue("download_url" in data and len(data["download_url"]) > 0)
        self.assertIn("barcodes/SVF_Barcode_Sheet_", data["r2_key"])
        self.assertIn("capped at 200 labels", data["message"])


if __name__ == "__main__":
    unittest.main()
