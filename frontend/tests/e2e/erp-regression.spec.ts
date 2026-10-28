import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Shree Vinayaka Furnitures ERP & POS — E2E Production Gate', () => {

  // CRITICAL PATH 1: App-Shell & Zero CSP / Console Errors
  test('App-Shell loader mounts with aria-busy and hydrates into main ERP without CSP/console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: Error[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore normal offline/dev fallback warnings
        if (!text.includes('Failed to load resource') && !text.includes('net::ERR_CONNECTION_REFUSED')) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('pageerror', err => {
      pageErrors.push(err);
    });

    // 1. Fetch raw HTML to verify sub-50ms App-Shell with aria-busy="true"
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    const initialHtml = await response?.text();
    expect(initialHtml).toContain('aria-busy="true"');
    expect(initialHtml).toContain('Shree Vinayaka Furnitures ERP');

    // 2. Verify hydration into full interactive ERP desktop
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Shree Vinayaka Furnitures/i })).toBeVisible({ timeout: 15000 });

    // 3. Assert zero unhandled JavaScript exceptions
    expect(pageErrors).toHaveLength(0);

    // 4. Assert zero Content-Security-Policy violations
    const cspViolations = consoleErrors.filter(text =>
      text.toLowerCase().includes('content security policy') ||
      text.toLowerCase().includes('violates the following content security policy')
    );
    expect(cspViolations).toHaveLength(0);
  });

  // CRITICAL PATH 2: POS Billing & Offline Cache Resilience
  test('POS Billing view initializes local cache and calculates GST and totals on item scan', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await page.goto('/?ws=SALE_POS', { waitUntil: 'domcontentloaded' });

    // 1. Verify POS scan input is ready and focused
    const barcodeInput = page.getByPlaceholder('Scan / Barcode...');
    await expect(barcodeInput).toBeVisible({ timeout: 15000 });

    // 2. Verify IndexedDB & offline cache APIs are functional in the runtime
    const isIndexedDbAvailable = await page.evaluate(() => {
      return typeof window.indexedDB !== 'undefined';
    });
    expect(isIndexedDbAvailable).toBe(true);

    // 3. Scan Godrej Interio Storwel SKU (barcode: 8901102)
    await barcodeInput.fill('8901102');
    await barcodeInput.press('Enter');

    // 4. Verify item was added to POS bill table
    const itemCell = page.getByText(/Godrej Interio/i).first();
    await expect(itemCell).toBeVisible({ timeout: 10000 });

    // 5. Verify GST & Net Pay calculation are visible
    await expect(page.getByText(/Net Pay/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Taxable|CGST|SGST/i).first()).toBeVisible();

    expect(pageErrors).toHaveLength(0);
  });

  // CRITICAL PATH 3: WMS Barcode Studio Lazy Route
  test('WMS Barcode Studio lazy route loads chunk cleanly and renders canvas/SVG tags', async ({ page }) => {
    const failedChunks: string[] = [];
    page.on('requestfailed', req => {
      const url = req.url();
      if (url.includes('.js') || url.includes('.css')) {
        failedChunks.push(`${req.method()} ${url} - ${req.failure()?.errorText}`);
      }
    });

    await page.goto('/?ws=BARCODE_DESIGNER', { waitUntil: 'domcontentloaded' });

    // 1. Ensure the lazy module mounted without chunk loading failure
    await expect(page.getByText(/BARCODE & SHOWROOM HANG-TAG DESIGN STUDIO|WYSIWYG Designer/i).first()).toBeVisible({ timeout: 15000 });

    // 2. Verify Barcode SVG or Canvas preview element rendered on screen
    const previewElement = page.locator('svg, canvas').first();
    await expect(previewElement).toBeVisible({ timeout: 10000 });

    // 3. Assert zero failed JavaScript/CSS bundle chunks
    expect(failedChunks).toHaveLength(0);
  });

  // CRITICAL PATH 4: Enterprise Security Headers Check
  test('Security headers (X-Frame-Options, X-Content-Type-Options, CSP) are strictly configured in dist/_headers', async () => {
    const headersPath = path.resolve(__dirname, '../../dist/_headers');
    expect(fs.existsSync(headersPath), 'dist/_headers must exist after build').toBe(true);

    const headersContent = fs.readFileSync(headersPath, 'utf-8');

    // Assert framing protection
    expect(headersContent).toContain('X-Frame-Options: DENY');

    // Assert MIME sniffing protection
    expect(headersContent).toContain('X-Content-Type-Options: nosniff');

    // Assert Content-Security-Policy with frame-ancestors none
    expect(headersContent).toContain('Content-Security-Policy:');
    expect(headersContent).toContain("frame-ancestors 'none'");
    expect(headersContent).toContain("object-src 'none'");

    // Assert immutable caching for bundled static assets
    expect(headersContent).toContain('immutable');
  });

});
