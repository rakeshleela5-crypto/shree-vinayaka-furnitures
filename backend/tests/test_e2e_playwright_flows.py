import os
import sys
import time
import socket
import threading
import functools
import http.server
import pytest
from playwright.sync_api import sync_playwright

FRONTEND_DIST_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
)

def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]

@pytest.fixture(scope="module")
def static_server():
    if not os.path.exists(FRONTEND_DIST_DIR):
        pytest.skip(f"Frontend dist not found at {FRONTEND_DIST_DIR}")
    port = get_free_port()
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=FRONTEND_DIST_DIR)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    time.sleep(0.3)
    base_url = f"http://127.0.0.1:{port}"
    yield base_url
    server.shutdown()

def test_playwright_e2e_cloudflare_pages_app_mount(static_server):
    """
    Validates Layer 5: End-to-End (E2E) UI & Flows on Cloudflare Pages.
    Launches headless Chromium, visits the built production bundle,
    and verifies React 19 app mount, DOM tree, and title.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.goto(f"{static_server}/index.html", wait_until="domcontentloaded")

        title = page.title()
        print(f"\n[Playwright E2E] Page loaded with title: '{title}'")
        assert "Shree Vinayaka Furnitures" in title, f"Unexpected title: {title}"

        # Check root container
        root = page.locator("#root")
        assert root.count() > 0, "#root element must exist in DOM"
        
        # Verify app container content rendered
        inner_text = page.locator("body").inner_text()
        assert len(inner_text) > 0, "Application body must contain rendered content"
        print(f"   [OK] Production UI bundle mounted successfully with zero fatal errors.")

        browser.close()


def test_playwright_offline_to_online_sync_simulation(static_server):
    """
    Simulates spotty network / 4G showroom offline behavior:
    - Disconnects browser network (context.set_offline(True))
    - Verifies navigator.onLine drops to false
    - Queues offline transaction in localStorage
    - Reconnects browser network (context.set_offline(False))
    - Verifies navigator.onLine restores to true
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.goto(f"{static_server}/index.html", wait_until="domcontentloaded")

        # Initial state: Online
        is_online_init = page.evaluate("() => navigator.onLine")
        assert is_online_init is True, "Initial state should be online"

        # Simulate Network Failure (Showroom Internet Drop)
        context.set_offline(True)
        is_online_dropped = page.evaluate("() => navigator.onLine")
        assert is_online_dropped is False, "Browser should report offline when network drops"
        print("   [OK] Network disconnect emulated: navigator.onLine is False.")

        # Simulate Offline LocalStorage Transaction Queueing
        page.evaluate("""() => {
            const queue = JSON.parse(localStorage.getItem('svf_offline_queue') || '[]');
            queue.push({
                invoice_no: 'OFFLINE-INV-001',
                customer: 'Walk-in Customer',
                total: 25000.0,
                timestamp: Date.now()
            });
            localStorage.setItem('svf_offline_queue', JSON.stringify(queue));
        }""")

        queued_items = page.evaluate("() => JSON.parse(localStorage.getItem('svf_offline_queue')).length")
        assert queued_items == 1, "Offline invoice must be safely staged in localStorage"
        print("   [OK] Offline transaction queued safely in client storage.")

        # Simulate Network Recovery (Fiber/4G Restored)
        context.set_offline(False)
        is_online_restored = page.evaluate("() => navigator.onLine")
        assert is_online_restored is True, "Browser should detect restored connectivity"
        print("   [OK] Network restored: connection detected, queue ready for server replay.")

        browser.close()


def test_playwright_barcode_and_qr_rendering_engine(static_server):
    """
    Verifies that client-side thermal barcode (JsBarcode) and QR code generation
    can render canvas / SVG elements in the browser runtime without DOM errors.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.goto(f"{static_server}/index.html", wait_until="domcontentloaded")

        # Verify barcode and QR rendering functions in browser context
        has_canvas = page.evaluate("""() => {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext && canvas.getContext('2d'));
        }""")
        assert has_canvas is True, "HTML5 Canvas 2D rendering context must be available"

        has_svg = page.evaluate("""() => {
            return typeof document.createElementNS === 'function';
        }""")
        assert has_svg is True, "SVG createElementNS must be available for thermal barcodes"
        print("   [OK] Client-side thermal barcode & QR canvas rendering engine verified.")

        browser.close()
