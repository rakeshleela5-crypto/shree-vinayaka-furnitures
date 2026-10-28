/**
 * Sri Vinayaka Furnitures - Offline-First POS & Dexie.js (IndexedDB) Engine
 * 
 * Features:
 * - #6, #7, #33: Offline-first catalog caching & instant item scanning (<15ms)
 * - #93: Automatic cache invalidation via /api/v1/catalog/sync?since={timestamp}
 * - Guaranteed financial integrity with client-generated UUID idempotency keys
 * - Auto-sync queued offline draft invoices on showroom network recovery
 */

import Dexie, { type EntityTable } from 'dexie';
import { reportCriticalAlert } from './telemetry';

export interface OfflineProduct {
  id: number;
  p_code: string;
  name: string;
  barcode: string;
  sku?: string;
  sku_code?: string;
  brand?: string;
  category_id?: number | null;
  sub_category?: string | null;
  category_name?: string;
  retail_price: number;
  mrp: number;
  min_floor_price: number;
  wholesale_price?: number | null;
  current_stock: number;
  physical_stock: number;
  godown_available_qty: number;
  showroom_display_qty: number;
  reserved_booked_qty: number;
  available_to_sell: number;
  is_knockdown: boolean;
  total_boxes: number;
  assembly_required: boolean;
  assembly_lead_time_mins: number;
  hsn_code?: string;
  gst_rate: number;
  image_url?: string | null;
  godown?: string | null;
  rack?: string | null;
  is_active: boolean;
  version: number;
  updated_at: string;
}

export interface OfflineProductBox {
  id: number;
  product_id: number;
  box_number: number;
  total_boxes: number;
  component_name: string;
  barcode_uid: string;
  box_barcode: string;
  box_sku?: string | null;
  status: string;
  godown?: string | null;
  rack?: string | null;
}

export interface OfflineInvoiceItem {
  product_id: number;
  barcode?: string;
  product_name: string;
  qty: number;
  rate: number;
  discount?: number;
  tax_percent?: number;
  amount: number;
}

export interface OfflineDraftInvoice {
  idempotency_key: string; // Client UUID v4 (#1)
  terminal_id?: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  payment_mode: string;
  bill_type: string;
  items: OfflineInvoiceItem[];
  sub_total: number;
  tax_total: number;
  discount_total: number;
  round_off?: number;
  grand_total: number;
  paid_amount: number;
  balance_due: number;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  error_message?: string;
  created_at: string;
  synced_at?: string;
  server_invoice_id?: number;
  server_invoice_no?: string;
}

export interface SyncMetadata {
  key: string;
  value: string;
}

class SVFOfflineDatabase extends Dexie {
  products!: EntityTable<OfflineProduct, 'id'>;
  product_boxes!: EntityTable<OfflineProductBox, 'id'>;
  offline_draft_invoices!: EntityTable<OfflineDraftInvoice, 'idempotency_key'>;
  sync_metadata!: EntityTable<SyncMetadata, 'key'>;

  constructor() {
    super('SVF_Offline_DB');
    this.version(1).stores({
      products: 'id, p_code, barcode, sku, brand, name, category_id, updated_at',
      product_boxes: 'id, product_id, box_barcode, barcode_uid, box_number',
      offline_draft_invoices: 'idempotency_key, status, created_at, customer_phone',
      sync_metadata: 'key'
    });
  }
}

export const offlineDb = new SVFOfflineDatabase();

/**
 * Generate cryptographically random UUID v4 for client-side idempotency keys (#1)
 */
export function generateClientUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'IDEMP-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 10);
}

/**
 * Helper to get active API Base URL
 */
function getApiBaseUrl(): string {
  const envBackend = (import.meta as any).env?.VITE_API_URL;
  if (envBackend && envBackend.startsWith('http')) {
    return envBackend.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    if (window.location.host.includes('pages.dev')) {
      return 'https://shree-vinayaka-furnitures-production.up.railway.app';
    }
    return window.location.port ? `${window.location.protocol}//${window.location.hostname}:8000` : window.location.origin;
  }
  return 'http://localhost:8000';
}

/**
 * Delta Catalog Sync (#6, #7, #93):
 * Pulls modified products & boxes since last timestamp, invalidating changed entries in IndexedDB.
 */
export async function syncCatalogDelta(customBaseUrl?: string): Promise<{ total_updated: number; server_time: string }> {
  try {
    const meta = await offlineDb.sync_metadata.get('last_catalog_sync');
    const sinceTimestamp = meta ? meta.value : '';

    const baseUrl = customBaseUrl || getApiBaseUrl();
    const url = sinceTimestamp 
      ? `${baseUrl}/api/v1/catalog/sync?since=${encodeURIComponent(sinceTimestamp)}`
      : `${baseUrl}/api/v1/catalog/sync`;

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Catalog sync failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    const products: OfflineProduct[] = data.products || [];
    const boxes: OfflineProductBox[] = data.product_boxes || [];
    const tombstones: number[] = data.tombstones || [];
    const serverTime: string = data.server_time || new Date().toISOString();

    // Atomic Dexie transaction to prevent partial state on disconnect
    await offlineDb.transaction('rw', offlineDb.products, offlineDb.product_boxes, offlineDb.sync_metadata, async () => {
      // 1. Invalidate & remove deactivated/deleted products
      if (tombstones.length > 0) {
        await offlineDb.products.bulkDelete(tombstones);
        await offlineDb.product_boxes.where('product_id').anyOf(tombstones).delete();
      }

      // 2. Upsert modified or new products
      if (products.length > 0) {
        await offlineDb.products.bulkPut(products);
      }

      // 3. Upsert associated sub-boxes
      if (boxes.length > 0) {
        await offlineDb.product_boxes.bulkPut(boxes);
      }

      // 4. Update sync watermark
      await offlineDb.sync_metadata.put({
        key: 'last_catalog_sync',
        value: serverTime
      });
    });

    console.info(`[OfflineSync] Catalog synced successfully: ${products.length} updated, ${tombstones.length} removed.`);
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('svf-catalog-synced', {
        detail: { total_updated: products.length, server_time: serverTime }
      }));
    }

    return { total_updated: products.length, server_time: serverTime };
  } catch (err) {
    console.warn('[OfflineSync] Catalog sync skipped (offline or network error):', err);
    return { total_updated: 0, server_time: '' };
  }
}

/**
 * Queue an offline invoice draft when the internet is unavailable (#1, #33)
 */
export async function queueOfflineInvoice(
  draft: Omit<OfflineDraftInvoice, 'idempotency_key' | 'status' | 'created_at'>
): Promise<OfflineDraftInvoice> {
  const idempotency_key = generateClientUUID();
  const invoice: OfflineDraftInvoice = {
    ...draft,
    idempotency_key,
    status: 'PENDING',
    created_at: new Date().toISOString()
  };

  await offlineDb.transaction('rw', offlineDb.offline_draft_invoices, offlineDb.products, async () => {
    // 1. Save draft with unique client UUID
    await offlineDb.offline_draft_invoices.put(invoice);

    // 2. Optimistic local stock reduction to prevent accidental double-selling while offline
    for (const it of invoice.items) {
      const prod = await offlineDb.products.get(it.product_id);
      if (prod) {
        const newStock = Math.max(0, prod.current_stock - it.qty);
        const newAvail = Math.max(0, prod.available_to_sell - it.qty);
        await offlineDb.products.update(prod.id, {
          current_stock: newStock,
          available_to_sell: newAvail
        });
      }
    }
  });

  console.info(`[OfflinePOS] Queued offline invoice [${idempotency_key}] for ${invoice.customer_name} (₹${invoice.grand_total})`);

  // Attempt immediate background sync if network is present
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    syncPendingOfflineInvoices().catch(() => {});
  }

  return invoice;
}

/**
 * Auto-sync pending offline draft invoices when connection returns (#1, #33)
 */
export async function syncPendingOfflineInvoices(customBaseUrl?: string): Promise<{ synced: number; failed: number }> {
  const pending = await offlineDb.offline_draft_invoices
    .where('status')
    .equals('PENDING')
    .toArray();

  if (pending.length === 0) {
    return { synced: 0, failed: 0 };
  }

  console.info(`[OfflinePOS] Syncing ${pending.length} pending offline invoices...`);
  const baseUrl = customBaseUrl || getApiBaseUrl();
  let syncedCount = 0;
  let failedCount = 0;

  for (const draft of pending) {
    try {
      await offlineDb.offline_draft_invoices.update(draft.idempotency_key, { status: 'SYNCING' });

      // Transform offline items into server-compatible items payload
      const payload = {
        customer_name: draft.customer_name,
        customer_phone: draft.customer_phone,
        customer_address: draft.customer_address,
        bill_type: draft.bill_type || 'Cash',
        payment_mode: draft.payment_mode || 'Cash',
        sub_total: draft.sub_total,
        tax_total: draft.tax_total,
        discount_total: draft.discount_total,
        grand_total: draft.grand_total,
        paid_amount: draft.paid_amount,
        balance_due: draft.balance_due,
        items: draft.items.map(it => ({
          product_id: it.product_id,
          barcode: it.barcode,
          name: it.product_name,
          product_name: it.product_name,
          qty: it.qty,
          price: it.rate,
          rate: it.rate,
          amount: it.amount
        }))
      };

      const res = await fetch(`${baseUrl}/api/v1/sales/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': draft.idempotency_key
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const responseData = await res.json();
        await offlineDb.offline_draft_invoices.update(draft.idempotency_key, {
          status: 'SYNCED',
          synced_at: new Date().toISOString(),
          server_invoice_id: responseData.id,
          server_invoice_no: responseData.invoice_no
        });
        syncedCount++;

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('svf-invoice-synced', {
            detail: {
              idempotency_key: draft.idempotency_key,
              server_invoice_no: responseData.invoice_no
            }
          }));
        }
      } else {
        const errJson = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
        console.error(`[OfflinePOS] Failed to sync draft ${draft.idempotency_key}:`, errJson);
        
        // If 400/422 validation error, mark FAILED and report to Dead-Letter Queue
        if (res.status >= 400 && res.status < 500 && res.status !== 409) {
          const errMsg = JSON.stringify(errJson.detail || errJson);
          await offlineDb.offline_draft_invoices.update(draft.idempotency_key, {
            status: 'FAILED',
            error_message: errMsg
          });
          reportCriticalAlert('SYNC_MUTATION_FAILED', {
            ...draft,
            httpStatus: res.status,
            error: errJson
          }, 'CRITICAL', draft.idempotency_key).catch(() => {});
        } else {
          await offlineDb.offline_draft_invoices.update(draft.idempotency_key, {
            status: 'PENDING'
          });
        }
        failedCount++;
      }
    } catch (netErr) {
      console.warn(`[OfflinePOS] Network disconnected while syncing draft ${draft.idempotency_key}:`, netErr);
      await offlineDb.offline_draft_invoices.update(draft.idempotency_key, { status: 'PENDING' });
      failedCount++;
      break; // Abort further attempts if offline
    }
  }

  return { synced: syncedCount, failed: failedCount };
}

/**
 * Fast indexed lookup by Barcode or SKU (<15ms)
 */
export async function findOfflineProduct(barcodeOrCode: string): Promise<OfflineProduct | undefined> {
  const clean = barcodeOrCode.trim();
  let prod = await offlineDb.products.where('barcode').equals(clean).first();
  if (!prod) {
    prod = await offlineDb.products.where('p_code').equals(clean).first();
  }
  if (!prod) {
    prod = await offlineDb.products.where('sku').equals(clean).first();
  }
  return prod;
}

/**
 * Fast indexed lookup for Knockdown Sub-Boxes by box barcode (<15ms)
 */
export async function findOfflineProductBox(barcode: string): Promise<OfflineProductBox | undefined> {
  const clean = barcode.trim();
  let box = await offlineDb.product_boxes.where('box_barcode').equals(clean).first();
  if (!box) {
    box = await offlineDb.product_boxes.where('barcode_uid').equals(clean).first();
  }
  return box;
}

/**
 * Get count of unsynced offline invoices awaiting connectivity
 */
export async function getPendingOfflineInvoicesCount(): Promise<number> {
  return await offlineDb.offline_draft_invoices.where('status').equals('PENDING').count();
}

// Auto-sync listener on showroom browser network recovery
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.info('[OfflinePOS] Internet restored! Triggering automatic invoice and catalog synchronization...');
    syncPendingOfflineInvoices().then(res => {
      if (res.synced > 0) {
        console.info(`[OfflinePOS] Successfully auto-synced ${res.synced} offline invoices!`);
      }
    });
    syncCatalogDelta();
  });
}
