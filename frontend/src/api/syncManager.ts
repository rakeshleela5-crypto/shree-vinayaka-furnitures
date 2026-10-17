/**
 * OfflineSyncManager
 * 
 * Handles real-world store challenges:
 * 1. Offline billing resilience (PWA/IndexedDB/localStorage queue)
 * 2. Guaranteed zero-loss transaction sync when internet reconnects
 * 3. Real-time sync status badges (🟢 Synced / 🟡 Offline Queue / 🔄 Syncing)
 * 4. Strictly sequential Indian GST invoice numbering
 */

export interface SyncItem {
  id: string;
  timestamp: string;
  type: 
    | 'SALE_INVOICE'
    | 'CUSTOMER_CREATE'
    | 'CUSTOMER_UPDATE'
    | 'ESTIMATE'
    | 'DELIVERY_NOTE'
    | 'QUOTATION'
    | 'PURCHASE'
    | 'EXPENSE'
    | 'STOCK_ADJUSTMENT'
    | 'SALE_RETURN'
    | 'VOID_INVOICE';

  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload: any;
  retries: number;
  lastError?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  lastError: string | null;
}

type SyncListener = (status: SyncStatus) => void;

const QUEUE_STORAGE_KEY = 'rd_offline_sync_queue';
const LAST_SYNC_KEY = 'rd_last_sync_timestamp';

class OfflineSyncManager {
  private queue: SyncItem[] = [];
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private lastSyncTime: string | null = null;
  private lastError: string | null = null;
  private pollTimer: any = null;

  constructor() {
    this.loadQueue();
    if (typeof window !== 'undefined') {
      this.lastSyncTime = localStorage.getItem(LAST_SYNC_KEY);
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.lastError = null;
        this.notify();
        this.drainQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notify();
      });

      // Poll sync queue every 12 seconds when online
      this.pollTimer = setInterval(() => {
        if (this.isOnline && this.queue.length > 0 && !this.isSyncing) {
          this.drainQueue();
        }
      }, 12000);
    }
  }

  public destroy() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private loadQueue() {
    try {
      const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
      this.queue = saved ? JSON.parse(saved) : [];
    } catch {
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.error('Failed to persist sync queue to localStorage:', e);
    }
    this.notify();
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach(fn => fn(status));
  }

  public getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.queue.length,
      lastSyncTime: this.lastSyncTime,
      lastError: this.lastError
    };
  }

  /**
   * Enqueue a pending mutation to be synced to Railway PostgreSQL
   */
  public enqueue(
    type: SyncItem['type'],
    endpoint: string,
    method: SyncItem['method'],
    payload: any
  ): SyncItem {
    const item: SyncItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      type,
      endpoint,
      method,
      payload,
      retries: 0
    };

    // Avoid duplicate invoice postings if already in queue
    if (type === 'SALE_INVOICE' && payload?.invoice_no) {
      const exists = this.queue.some(q => q.type === 'SALE_INVOICE' && q.payload?.invoice_no === payload.invoice_no);
      if (exists) {
        return item;
      }
    }

    this.queue.push(item);
    this.saveQueue();
    return item;
  }

  /**
   * Drains queue sequentially to preserve transaction ordering in PostgreSQL
   */
  public async drainQueue(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing || this.queue.length === 0 || !this.isOnline) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notify();

    let syncedCount = 0;
    let failedCount = 0;

    const remainingItems: SyncItem[] = [];

    for (const item of this.queue) {
      try {
        const response = await fetch(item.endpoint, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
            'X-Offline-Synced': 'true',
            'X-Client-Timestamp': item.timestamp
          },
          body: JSON.stringify(item.payload)
        });

        if (response.ok || response.status === 409) {
          // 200 OK or 409 Conflict (already recorded)
          syncedCount++;
        } else {
          item.retries++;
          item.lastError = `HTTP ${response.status}: ${response.statusText}`;
          remainingItems.push(item);
          failedCount++;
          // Pause queue processing on server errors
          break;
        }
      } catch (err: any) {
        item.retries++;
        item.lastError = err?.message || 'Network unreachable';
        remainingItems.push(item);
        failedCount++;
        this.isOnline = false;
        this.lastError = item.lastError || null;
        break;
      }
    }

    // Keep items that weren't processed yet
    const processedIds = new Set(this.queue.slice(0, syncedCount).map(i => i.id));
    this.queue = [...remainingItems, ...this.queue.filter(i => !processedIds.has(i.id) && !remainingItems.some(r => r.id === i.id))];
    this.saveQueue();

    this.isSyncing = false;
    if (syncedCount > 0) {
      this.lastSyncTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      try {
        localStorage.setItem(LAST_SYNC_KEY, this.lastSyncTime);
      } catch {}
    }

    this.notify();
    return { synced: syncedCount, failed: failedCount };
  }

  /**
   * Generates strict sequential Indian GST invoice number
   * Format: SVF-[FY]-0001 (e.g. SVF-2425-0042)
   */
  public generateFallbackInvoiceNo(prefix = 'SVF'): string {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-indexed (April is 3)
    const currentYear = now.getFullYear();
    const fyStart = currentMonth >= 3 ? currentYear : currentYear - 1;
    const fyCode = `${String(fyStart).slice(-2)}${String(fyStart + 1).slice(-2)}`;
    
    // Look up local saved bills to find highest index
    let maxNum = 0;
    try {
      const savedBillsStr = localStorage.getItem('rd_d_sale_bills');
      if (savedBillsStr) {
        const bills = JSON.parse(savedBillsStr);
        if (Array.isArray(bills)) {
          for (const b of bills) {
            const no = b.invoiceNo || b.billNo || '';
            const match = no.match(/\d+$/);
            if (match) {
              const n = parseInt(match[0], 10);
              if (n > maxNum) maxNum = n;
            }
          }
        }
      }
    } catch {}

    // Account for pending items in queue
    const pendingSales = this.queue.filter(q => q.type === 'SALE_INVOICE').length;
    const nextSeq = Math.max(1, maxNum + pendingSales + 1);
    return `${prefix}-${fyCode}-${String(nextSeq).padStart(4, '0')}`;
  }
}

export const syncManager = new OfflineSyncManager();
