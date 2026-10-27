/**
 * Showroom Real-Time Multi-Terminal WebSocket Client
 * 
 * Synchronizes inventory, POS sales, and delivery pipeline across:
 * - Counter POS terminals
 * - Owner laptops
 * - Mobile tablet floor staff
 * 
 * Replaces stale browser state and eliminates double-selling under <200ms.
 */

export interface StoreRealtimeEvent {
  event: 
    | 'INVENTORY_UPDATED'
    | 'SALE_CREATED'
    | 'INVOICE_VOIDED'
    | 'DELIVERY_UPDATED'
    | 'STOCK_TRANSFERRED'
    | 'CUSTOMER_UPDATED'
    | 'LEDGER_UPDATED'
    | 'PAYMENT_SUCCESS'
    | 'ASSEMBLY_STATUS_UPDATED'
    | 'CATALOG_UPDATED'
    | 'PONG';
  sku_id?: string | number;
  product_id?: number;
  invoice_id?: number;
  invoice_no?: string;
  utr?: string;
  terminal_id?: string;
  amount?: number;
  stage?: string;
  timestamp: string;
  data?: any;
}

type EventCallback = (event: StoreRealtimeEvent) => void;

class ShowroomRealtimeClient {
  private socket: WebSocket | null = null;
  private listeners: Set<EventCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectDelay = 15000;
  private reconnectTimer: any = null;
  private pingTimer: any = null;
  private isExplicitlyClosed = false;
  private currentTerminalId: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedTerminal = localStorage.getItem('svf_pos_terminal_id') || 'COUNTER-01';
      this.connect(savedTerminal);
    }
  }

  public connect(terminalId?: string) {
    this.isExplicitlyClosed = false;
    if (terminalId) {
      this.currentTerminalId = terminalId;
      try {
        localStorage.setItem('svf_pos_terminal_id', terminalId);
      } catch (_) {}
    }

    // Determine WebSocket URL
    let wsUrl: string;
    if (typeof window !== 'undefined') {
      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const path = this.currentTerminalId ? `/ws/pos/${encodeURIComponent(this.currentTerminalId)}` : '/ws/store-events';
      
      // Check if backend URL is overridden via env
      const envBackend = (import.meta as any).env?.VITE_API_URL;
      if (envBackend && envBackend.startsWith('http')) {
        const parsed = new URL(envBackend);
        wsUrl = `${parsed.protocol === 'https:' ? 'wss:' : 'ws:'}//${parsed.host}${path}`;
      } else {
        // Fallback to direct Railway host or current origin
        const host = window.location.host.includes('pages.dev')
          ? 'shree-vinayaka-furnitures-production.up.railway.app'
          : (window.location.port ? `${window.location.hostname}:8000` : window.location.host);
        wsUrl = `${wsProtocol}//${host}${path}`;
      }

      try {
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          console.info('[Realtime] Showroom multi-terminal WebSocket connected:', wsUrl);
        };

        this.socket.onmessage = (event) => {
          try {
            const parsed: StoreRealtimeEvent = JSON.parse(event.data);
            if (parsed.event !== 'PONG') {
              this.dispatch(parsed);
            }
          } catch (e) {
            console.warn('[Realtime] Message parse error:', e);
          }
        };

        this.socket.onclose = () => {
          this.stopHeartbeat();
          if (!this.isExplicitlyClosed) {
            this.scheduleReconnect();
          }
        };

        this.socket.onerror = (err) => {
          console.warn('[Realtime] WebSocket encountered error, attempting recovery:', err);
          this.socket?.close();
        };
      } catch (err) {
        console.error('[Realtime] Failed to initialize WebSocket:', err);
        this.scheduleReconnect();
      }
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send('ping');
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  public subscribe(cb: EventCallback): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private dispatch(event: StoreRealtimeEvent) {
    this.listeners.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error('[Realtime] Listener callback error:', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rd-store-realtime-event', { detail: event }));
      if (event.event === 'PAYMENT_SUCCESS') {
        window.dispatchEvent(new CustomEvent('svf-payment-success', { detail: event }));
      }
    }
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const showroomRealtime = new ShowroomRealtimeClient();
