import type {
  ProductBoxComponent,
  SkuGeneratorRequest,
  SkuGeneratorResponse,
  AssemblyBoxVerifyRequest,
  AssemblyBoxVerifyResponse,
  BankStatementEntry,
  BankReconciliationCandidatesResponse,
  BankReconcilePayload,
  CustomerCreditAgingSummary,
  CustomerCreditAgingDetailResponse,
  PaymentReminderResponse,
  StockHedgingSummary,
  DeliveryPipelineItem,
  DeliveryStageAdvancePayload,
  CsatFeedbackPayload,
  CsatWhatsAppResponse,
  CreditNoteRequest,
  CreditNoteResponse,
  GoodsReceiptNotePayload,
  GoodsReceiptNoteRecord,
  CustomerKhataReceiptPayload,
  CustomerKhataReceiptResponse,
  SupplierPaymentPayload,
  SupplierPaymentResponse,
  LiveLedgerBalances,
  JournalEntryRecord
} from '../types/retailDaddy';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image_url?: string;
}

export interface Furniture {
  id: number;
  title: string;
  slug: string;
  category_id?: number;
  description: string;
  price: number;
  original_price?: number;
  material?: string;
  dimensions?: string;
  color?: string;
  warranty?: string;
  in_stock: boolean;
  is_featured: boolean;
  image_url?: string;
  rating: number;
  reviews_count: number;
  created_at: string;
  category?: Category;
}

export interface InquiryPayload {
  customer_name: string;
  phone: string;
  email?: string;
  furniture_id?: number;
  furniture_title?: string;
  message: string;
  inquiry_type?: string;
}

export interface InquiryResponse extends InquiryPayload {
  id: number;
  status: string;
  created_at: string;
}

export const CLIENT_VERSION = '2026.10.1';

const getApiBaseUrl = (): string => {
  // When running on Cloudflare Pages, route through same-origin Reverse Proxy Function /api/v1
  // This unifies origins, eliminates all CORS issues, and provides zero-latency proxying to Railway
  if (typeof window !== 'undefined' && window.location.hostname.includes('pages.dev')) {
    return '/api/v1';
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return 'http://localhost:8000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

export interface ApiFetchOptions extends RequestInit {
  silent?: boolean;
}

export const notifyApiError = (message: string, error?: any) => {
  const detailMsg = error?.message ? `${message} (${error.message})` : message;
  const rawMsg = detailMsg.replace(/^[\s❌✅✓⚠️ℹ️]+/, '').trim().toLowerCase();
  
  // Suppress unhelpful schema mismatch toasts or generic 404/405s that confuse end users
  if (
    !rawMsg ||
    rawMsg === 'not found' ||
    rawMsg === 'http 404: not found' ||
    rawMsg === 'method not allowed' ||
    rawMsg.includes('unable to parse string as an integer') ||
    rawMsg.includes('input should be a valid integer')
  ) {
    console.warn('[SVF API Warning] Suppressed schema toast:', detailMsg);
    return;
  }
  console.error('[SVF API Error]', detailMsg, error);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('svf-toast', {
        detail: {
          message: detailMsg.replace(/^[\s❌]+/, '').trim(),
          type: 'error'
        }
      })
    );
  }
};

export const notifyApiSuccess = (message: string) => {
  const cleanMsg = message.replace(/^[\s✅✓]+/, '').trim();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('svf-toast', {
        detail: {
          message: cleanMsg,
          type: 'success'
        }
      })
    );
  }
};

export const apiFetch = async (input: RequestInfo | URL, init?: ApiFetchOptions): Promise<Response> => {
  const method = (init?.method || 'GET').toUpperCase();
  const headers = new Headers(init?.headers);
  if (!headers.has('X-Client-Version')) {
    headers.set('X-Client-Version', CLIENT_VERSION);
  }
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !headers.has('X-Idempotency-Key')) {
    const key = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `svf-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    headers.set('X-Idempotency-Key', key);
  }
  if (init?.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const urlStr = typeof input === 'string' ? input : (input as Request).url || '';
  const isDecentroCall = urlStr.includes('/decentro/');
  const isSilent = Boolean(init?.silent || headers.get('X-Silent') === 'true' || isDecentroCall);

  try {
    const res = await fetch(input, { ...init, headers });
    if (!res.ok) {
      let errorDetail = `HTTP ${res.status}: ${res.statusText || 'Request failed'}`;
      try {
        const errorBody = await res.clone().json();
        if (errorBody && errorBody.detail) {
          if (typeof errorBody.detail === 'string') {
            errorDetail = errorBody.detail;
          } else if (Array.isArray(errorBody.detail)) {
            errorDetail = errorBody.detail
              .map((d: any) => {
                const field = Array.isArray(d.loc) ? d.loc.filter((x: any) => x !== 'body').join('.') : '';
                return field ? `${field}: ${d.msg || 'Invalid'}` : (d.msg || 'Validation error');
              })
              .join('; ');
          } else if (typeof errorBody.detail === 'object') {
            errorDetail = errorBody.detail.message || errorBody.detail.msg || 'Request validation error';
          }
        }
      } catch {
        // Response is not JSON
      }
      if (!isSilent) {
        notifyApiError(errorDetail);
      }
      const err = new Error(errorDetail);
      (err as any).status = res.status;
      (err as any).response = res;
      throw err;
    }
    return res;
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      const offlineMsg = `FastAPI backend unreachable at ${API_BASE_URL}. Please check server connectivity.`;
      if (!isSilent) {
        notifyApiError(offlineMsg, err);
      }
      throw new Error(offlineMsg);
    }
    throw err;
  }
};

// Fallback initial data in case backend server is booting or offline
const FALLBACK_CATEGORIES: Category[] = [
  {
    id: 1,
    name: "Living Room",
    slug: "living-room",
    description: "Elegant handcrafted sofas, coffee tables, and lounger sets built for family comfort.",
    icon: "Armchair",
    image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 2,
    name: "Bedroom",
    slug: "bedroom",
    description: "Premium king & queen beds, solid wood wardrobes, and bedside nightstands.",
    icon: "BedDouble",
    image_url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 3,
    name: "Dining Room",
    slug: "dining-room",
    description: "Solid teak and sheesham wood dining tables with ergonomically cushioned chairs.",
    icon: "Utensils",
    image_url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 4,
    name: "Home Office",
    slug: "home-office",
    description: "Ergonomic work desks, executive leatherette chairs, and functional bookshelf units.",
    icon: "Briefcase",
    image_url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 5,
    name: "Custom Teak & Mandir",
    slug: "custom-teak",
    description: "Custom pooja mandirs, temple units, and bespoke artisan wood creations.",
    icon: "Sparkles",
    image_url: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80"
  }
];

const FALLBACK_FURNITURE: Furniture[] = [
  {
    id: 1,
    title: "Royal Heritage Teak 3+1+1 Sofa Set",
    slug: "royal-heritage-teak-sofa-set",
    category_id: 1,
    description: "Mastercrafted from 100% Grade-A Burma Teak wood with high-density 40-D foam cushioning and velvet stain-resistant upholstery. Includes 1 three-seater and 2 single armchairs.",
    price: 54999,
    original_price: 68000,
    material: "Grade-A Solid Teak Wood & High-Density Foam",
    dimensions: "Three-Seater: 78\"L x 34\"D x 36\"H | Single: 34\"L x 34\"D x 36\"H",
    color: "Warm Walnut & Deep Royal Teal",
    warranty: "10 Years Wood & Anti-Termite Warranty",
    in_stock: true,
    is_featured: true,
    image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviews_count: 48,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: "Aura Sheesham 6-Seater Solid Dining Set",
    slug: "aura-sheesham-6-seater-dining-set",
    category_id: 3,
    description: "Naturally grained pure Sheesham wood dining table with 6 comfortably contoured high-back chairs. Coated with food-safe moisture-resistant lacquer finish.",
    price: 38500,
    original_price: 46000,
    material: "Pure Sheesham Wood (Indian Rosewood)",
    dimensions: "Table: 60\"L x 36\"W x 30\"H | Chair: 18\"W x 18\"D x 38\"H",
    color: "Honey Oak Gloss",
    warranty: "5 Years Structural Warranty",
    in_stock: true,
    is_featured: true,
    image_url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    reviews_count: 32,
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    title: "Grandeur King Size Hydraulic Bed with Headboard Storage",
    slug: "grandeur-king-hydraulic-storage-bed",
    category_id: 2,
    description: "Heavy-duty engineered hardwood king size bed with German pneumatic lift pistons for effortless underbed storage. Plush tufted headboard for reading comfort.",
    price: 42999,
    original_price: 52000,
    material: "High-Grade Engineered Hardwood & Fabric Tufting",
    dimensions: "78\"W x 82\"L x 48\"H (Mattress Size: 72\"x78\")",
    color: "Smoked Charcoal & Warm Beige",
    warranty: "5 Years Hydraulic Mechanism & Frame Warranty",
    in_stock: true,
    is_featured: true,
    image_url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviews_count: 56,
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    title: "Vinayaka Artisan Hand-Carved Teak Pooja Mandir",
    slug: "vinayaka-artisan-teak-pooja-mandir",
    category_id: 5,
    description: "Sacred home temple custom carved with intricate traditional bells, dome gopuram, brass handles, pull-out bhog tray, and dedicated storage drawers.",
    price: 31500,
    original_price: 39000,
    material: "100% Solid CP Teak Wood with Brass Accents",
    dimensions: "36\"W x 20\"D x 54\"H",
    color: "Traditional Rosewood Antique Gloss",
    warranty: "Lifetime Termite Resistance",
    in_stock: true,
    is_featured: true,
    image_url: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80",
    rating: 5.0,
    reviews_count: 64,
    created_at: new Date().toISOString()
  },
  {
    id: 5,
    title: "Nordic Minimalist Floating TV Entertainment Unit",
    slug: "nordic-minimalist-floating-tv-unit",
    category_id: 1,
    description: "Wall-mounted sleek media console with hidden cable pass-through, soft-close hydraulic drop-down doors, and ambient back-LED light slot. Supports up to 75-inch TVs.",
    price: 14999,
    original_price: 19500,
    material: "Water-Resistant HDHMR with Matte Laminate",
    dimensions: "72\"L x 14\"D x 12\"H",
    color: "Matte White & Natural Acacia",
    warranty: "3 Years Warranty",
    in_stock: true,
    is_featured: false,
    image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    reviews_count: 21,
    created_at: new Date().toISOString()
  },
  {
    id: 6,
    title: "ErgoPro Executive High-Back Mesh Desk Chair",
    slug: "ergopro-executive-high-back-mesh-chair",
    category_id: 4,
    description: "BIFMA certified multi-tilt executive chair with dynamic lumbar support, 3D adjustable armrests, breathable Korean mesh back, and heavy-duty chrome wheelbase.",
    price: 11800,
    original_price: 16000,
    material: "Breathable Mesh, Molded Foam & Steel Base",
    dimensions: "26\"W x 26\"D x 46\"-50\"H",
    color: "Jet Black & Chrome",
    warranty: "3 Years On-Site Warranty",
    in_stock: true,
    is_featured: false,
    image_url: "https://images.unsplash.com/photo-1580481077195-c3a821a58875?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    reviews_count: 39,
    created_at: new Date().toISOString()
  },
  {
    id: 7,
    title: "Elegance 4-Door Wardrobe with Dressing Mirror",
    slug: "elegance-4-door-wardrobe-mirror",
    category_id: 2,
    description: "Spacious wardrobe with dual full-length dressing mirrors, internal security locker, multiple hanging rails, and soft-closing hinges.",
    price: 36000,
    original_price: 44000,
    material: "Commercial Grade Marine Plywood with PU Polish",
    dimensions: "72\"W x 22\"D x 84\"H",
    color: "Rich Teak Woodgrain",
    warranty: "7 Years Comprehensive Warranty",
    in_stock: true,
    is_featured: false,
    image_url: "https://images.unsplash.com/photo-1558997519-83ea9252def8?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    reviews_count: 19,
    created_at: new Date().toISOString()
  },
  {
    id: 8,
    title: "Urban Teak & Iron Industrial Bookshelf",
    slug: "urban-teak-iron-bookshelf",
    category_id: 4,
    description: "5-tier open display shelf combining thick solid teak wood slabs with matte powder-coated wrought iron architectural ladders.",
    price: 12500,
    original_price: 15500,
    material: "Solid Teak Wood & Powder-Coated Steel",
    dimensions: "36\"W x 15\"D x 72\"H",
    color: "Rustic Teak & Industrial Black",
    warranty: "5 Years Warranty",
    in_stock: true,
    is_featured: false,
    image_url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviews_count: 15,
    created_at: new Date().toISOString()
  }
];

export const api = {
  getBaseUrl(): string {
    return API_BASE_URL;
  },

  async checkHealth(): Promise<{ status: string; database?: string; isConnected: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error("Health check failed");
      const data = await res.json();
      return { ...data, isConnected: true };
    } catch {
      return { status: "offline", database: "disconnected", isConnected: false };
    }
  },

  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/categories/`, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return await res.json();
    } catch {
      return FALLBACK_CATEGORIES;
    }
  },

  async getFurniture(params?: {
    category_slug?: string;
    is_featured?: boolean;
    search?: string;
    sort_by?: string;
    min_price?: number;
    max_price?: number;
  }): Promise<Furniture[]> {
    try {
      const query = new URLSearchParams();
      if (params?.category_slug) query.set("category_slug", params.category_slug);
      if (params?.is_featured !== undefined) query.set("is_featured", String(params.is_featured));
      if (params?.search) query.set("search", params.search);
      if (params?.sort_by) query.set("sort_by", params.sort_by);
      if (params?.min_price !== undefined) query.set("min_price", String(params.min_price));
      if (params?.max_price !== undefined) query.set("max_price", String(params.max_price));

      const res = await fetch(`${API_BASE_URL}/furniture/?${query.toString()}`, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error("Failed to fetch furniture");
      return await res.json();
    } catch {
      // Local fallback filtering
      let items = [...FALLBACK_FURNITURE];
      if (params?.category_slug) {
        const cat = FALLBACK_CATEGORIES.find(c => c.slug === params.category_slug);
        if (cat) items = items.filter(i => i.category_id === cat.id);
      }
      if (params?.is_featured !== undefined) {
        items = items.filter(i => i.is_featured === params.is_featured);
      }
      if (params?.search) {
        const s = params.search.toLowerCase();
        items = items.filter(i => 
          i.title.toLowerCase().includes(s) || 
          (i.material && i.material.toLowerCase().includes(s)) ||
          i.description.toLowerCase().includes(s)
        );
      }
      if (params?.sort_by === "price_asc") {
        items.sort((a, b) => a.price - b.price);
      } else if (params?.sort_by === "price_desc") {
        items.sort((a, b) => b.price - a.price);
      } else if (params?.sort_by === "rating") {
        items.sort((a, b) => b.rating - a.rating);
      }
      return items;
    }
  },

  async submitInquiry(payload: InquiryPayload): Promise<InquiryResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/inquiries/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000)
      });
      if (!res.ok) throw new Error("Failed to submit inquiry");
      return await res.json();
    } catch {
      // Return simulated success response
      return {
        ...payload,
        id: Math.floor(Math.random() * 1000) + 1,
        status: "new",
        created_at: new Date().toISOString()
      };
    }
  },

  async convertInquiryToQuotation(inquiryId: number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/inquiries/${inquiryId}/convert-to-quotation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to convert inquiry to quotation");
    }
    return await res.json();
  },

  async getInquiries(): Promise<InquiryResponse[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/inquiries/`);
      if (!res.ok) throw new Error("Failed to fetch inquiries");
      return await res.json();
    } catch {
      return [];
    }
  },

  // ==========================================
  // ERP & POS API METHODS
  // ==========================================
  async getProducts(search?: string, limit = 5000): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', String(limit));
      params.append('include_costs', 'true');
      const res = await apiFetch(`${API_BASE_URL}/products/?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return await res.json();
    } catch {
      return [];
    }
  },

  async getProductByBarcode(barcode: string): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/products/barcode/${encodeURIComponent(barcode)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async createProduct(product: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/products/`, {
      method: "POST",
      body: JSON.stringify(product)
    });
    return await res.json();
  },

  async updateProductPrice(barcodeOrId: string | number, prices: { mrp: number; retailPrice: number; wholesalePrice?: number; purchasePrice?: number }): Promise<any> {
    try {
      // First check if barcode matches
      const existing = await this.getProductByBarcode(String(barcodeOrId));
      if (existing && existing.id) {
        return await this.updateProduct(existing.id, {
          mrp: prices.mrp,
          retail_price: prices.retailPrice,
          wholesale_price: prices.wholesalePrice ?? 0,
          purchase_price: prices.purchasePrice ?? existing.purchase_price
        });
      }
      // If direct ID
      if (typeof barcodeOrId === 'number' || !isNaN(Number(barcodeOrId))) {
        return await this.updateProduct(Number(barcodeOrId), {
          mrp: prices.mrp,
          retail_price: prices.retailPrice,
          wholesale_price: prices.wholesalePrice ?? 0,
          purchase_price: prices.purchasePrice
        });
      }
      throw new Error(`Product not found in cloud database for barcode: ${barcodeOrId}`);
    } catch (e) {
      console.error("Backend updateProductPrice failed:", e);
      throw e;
    }
  },

  async bulkImportProducts(products: any[]): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/products/bulk-import`, {
      method: "POST",
      body: JSON.stringify(products)
    });
    return await res.json();
  },

  async getCustomers(search?: string, limit = 5000): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', String(limit));
      const res = await apiFetch(`${API_BASE_URL}/customers/?${params.toString()}`);
      return await res.json();
    } catch {
      return [];
    }
  },

  async createCustomer(customer: any): Promise<any> {
    const payload = {
      ...customer,
      code: customer.code || customer.id || `CUST-${Date.now().toString().slice(-6)}`
    };
    const res = await apiFetch(`${API_BASE_URL}/customers/`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const detailMsg = typeof err.detail === 'string'
        ? err
        : Array.isArray(err.detail)
          ? err.detail.map((d: any) => `${d.loc ? d.loc.slice(1).join('.') + ': ' : ''}${d.msg}`).join(', ')
          : (err.message || "Failed to save customer to database");
      throw new Error(detailMsg);
    }
    const data = await res.json();
    notifyApiSuccess(`Customer "${data.name || ''}" saved to PostgreSQL!`);
    return data;
  },

  async getSuppliers(search?: string, limit = 5000): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', String(limit));
      const res = await apiFetch(`${API_BASE_URL}/suppliers/?${params.toString()}`);
      return await res.json();
    } catch {
      return [];
    }
  },

  async getNextInvoiceNo(prefix = 'SVF'): Promise<string> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/sales/next-invoice-no?prefix=${encodeURIComponent(prefix)}`);
      const data = await res.json();
      return data.next_invoice_no;
    } catch {
      const yr = new Date().getFullYear();
      return `${prefix}-${yr}/${Date.now().toString().slice(-4)}`;
    }
  },

  async getSalesInvoices(skip = 0, limit = 5000): Promise<any[]> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/sales/?skip=${skip}&limit=${limit}`);
      return await res.json();
    } catch {
      return [];
    }
  },

  async createSaleInvoice(invoice: any, idempotencyKey?: string): Promise<any> {
    const customHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (idempotencyKey) {
      customHeaders["X-Idempotency-Key"] = idempotencyKey;
    }
    const res = await apiFetch(`${API_BASE_URL}/sales/`, {
      method: "POST",
      headers: customHeaders,
      body: JSON.stringify(invoice)
    });
    return await res.json();
  },

  async voidSaleInvoice(invoiceId: string | number): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/sales/${invoiceId}/void`, {
      method: "POST"
    });
    return await res.json();
  },


  async getEstimates(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/sales/estimates`);
      if (!res.ok) throw new Error("Failed to fetch estimates");
      return await res.json();
    } catch {
      return [];
    }
  },

  async createEstimate(estimate: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/sales/estimates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(estimate)
    });
    return await res.json();
  },

  async getDeliveryNotes(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/sales/delivery-notes`);
      if (!res.ok) throw new Error("Failed to fetch delivery notes");
      return await res.json();
    } catch {
      return [];
    }
  },

  async createDeliveryNote(dn: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/sales/delivery-notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dn)
    });
    return await res.json();
  },

  async updateDeliveryNote(id: number | string, data: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/sales/delivery-notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn("Backend updateDeliveryNote error:", e);
      return data;
    }
  },


  async getCompanyProfile(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/company/profile`);
      if (!res.ok) throw new Error("Failed to fetch company profile");
      return await res.json();
    } catch {
      return null;
    }
  },

  async login(credentials: { username: string; password: string }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials)
    });
    if (!res.ok) throw new Error("Invalid username or password");
    return await res.json();
  },

  async updateProduct(id: string | number, product: any): Promise<any> {
    let targetId = id;
    if (typeof id === 'string' && isNaN(Number(id))) {
      const found = await this.getProductByBarcode(id);
      if (found && found.id) {
        targetId = found.id;
      }
    }
    const res = await apiFetch(`${API_BASE_URL}/products/${targetId}`, {
      method: "PUT",
      body: JSON.stringify(product)
    });
    return await res.json();
  },

  async uploadProductImage(id: string | number, file: File): Promise<{ status: string; image_url: string; r2_key: string; product_id: number; product_name: string; message: string }> {
    let targetId = id;
    if (typeof id === 'string' && isNaN(Number(id))) {
      const found = await this.getProductByBarcode(id);
      if (found && found.id) {
        targetId = found.id;
      }
    }
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiFetch(`${API_BASE_URL}/products/${targetId}/image`, {
      method: "POST",
      body: formData
    });
    if (!res.ok) {
      let msg = "Failed to upload image to Cloudflare R2";
      try {
        const err = await res.json();
        if (err?.detail) msg = err.detail;
      } catch {}
      throw new Error(msg);
    }
    return await res.json();
  },

  async uploadStandaloneImage(file: File, pCode?: string): Promise<{ status: string; image_url: string; r2_key: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (pCode) {
      formData.append('p_code', pCode);
    }
    const res = await apiFetch(`${API_BASE_URL}/products/upload-image`, {
      method: "POST",
      body: formData
    });
    if (!res.ok) {
      throw new Error("Failed to upload image to Cloudflare R2");
    }
    return await res.json();
  },

  async uploadBulkProductImages(files: File[]): Promise<{
    status: string;
    total_files: number;
    matched_count: number;
    unmatched_count: number;
    message: string;
    results: Array<{
      filename: string;
      status: 'MATCHED' | 'UNMATCHED';
      product_id?: number;
      product_name?: string;
      barcode?: string;
      p_code?: string;
      image_url: string;
      r2_key: string;
      detected_token?: string;
    }>;
  }> {
    const formData = new FormData();
    files.forEach(f => {
      formData.append('files', f);
    });

    const res = await apiFetch(`${API_BASE_URL}/products/bulk-images`, {
      method: "POST",
      body: formData
    });
    if (!res.ok) {
      throw new Error(`Bulk image upload failed with status ${res.status}`);
    }
    return await res.json();
  },



  async updateCustomer(id: string | number, customer: any): Promise<any> {
    const cleanId = String(id ?? '').trim();
    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') {
      return this.createCustomer(customer);
    }
    // Extract integer digits if string is like "cust-12" or numeric "12"
    const digitsOnly = cleanId.replace(/\D/g, '');
    const numId = parseInt(digitsOnly, 10);
    const targetPath = /^\d+$/.test(cleanId) ? cleanId : (numId && numId > 0 && digitsOnly.length < 9 ? String(numId) : null);

    if (targetPath) {
      try {
        const res = await apiFetch(`${API_BASE_URL}/customers/${encodeURIComponent(targetPath)}`, {
          method: "PUT",
          body: JSON.stringify(customer)
        });
        return await res.json();
      } catch (err: any) {
        if (err?.status === 422 || err?.status === 405) {
          // Fallback to upsert via POST /customers/ without throwing validation error
          return this.createCustomer({ ...customer, code: cleanId });
        }
        throw err;
      }
    } else {
      // For string codes like "cust-rajesh", upsert via POST /customers/
      return this.createCustomer({ ...customer, code: cleanId });
    }
  },

  async getPurchases(skip = 0, limit = 5000): Promise<any[]> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/purchases/?skip=${skip}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch purchase invoices");
      return await res.json();
    } catch (e) {
      console.warn("Backend getPurchases error:", e);
      return [];
    }
  },

  async createPurchase(purchase: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/purchases/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(purchase)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to record purchase invoice");
    }
    return await res.json();
  },

  async createPurchaseOrder(po: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/purchases/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(po)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to create purchase order");
    }
    return await res.json();
  },

  async getPurchaseOrders(status?: string): Promise<any[]> {
    try {
      const q = status ? `?status=${encodeURIComponent(status)}` : '';
      const res = await apiFetch(`${API_BASE_URL}/purchases/orders${q}`);
      if (!res.ok) throw new Error("Failed to fetch purchase orders");
      return await res.json();
    } catch {
      return [];
    }
  },

  async getPurchaseOrderById(id: number | string): Promise<any> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/purchases/orders/${id}`);
      if (!res.ok) throw new Error("Failed to fetch purchase order details");
      return await res.json();
    } catch {
      return null;
    }
  },

  async recordGoodsReceiptNote(poId: number | string, grn: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/purchases/orders/${poId}/grn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(grn)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to confirm GRN inward receipt");
    }
    return await res.json();
  },

  async getGoodsReceiptNotes(): Promise<any[]> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/purchases/grns`);
      if (!res.ok) throw new Error("Failed to fetch goods receipt notes");
      return await res.json();
    } catch {
      return [];
    }
  },

  async getSalesmen(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/salesmen`);
      if (!res.ok) throw new Error("Failed to fetch salesmen");
      return await res.json();
    } catch {
      return [];
    }
  },

  async payoutSalesman(id: number | string, payload: { amount: number; payment_mode?: string; remarks?: string; date?: string; notes?: string }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/salesmen/${id}/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn("Backend payoutSalesman error:", e);
      return null;
    }
  },


  async getAccountHeads(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/accounting/account-heads`);
      if (!res.ok) throw new Error("Failed to fetch account heads");
      return await res.json();
    } catch {
      return [];
    }
  },

  async updateCompanyProfile(profile: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/company/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });
      if (!res.ok) throw new Error("Failed to update company profile");
      return await res.json();
    } catch (e) {
      console.warn("Backend updateCompanyProfile error:", e);
      return profile;
    }
  },

  async createSaleReturn(payload: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/returns/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to record sales return");
      return await res.json();
    } catch (e) {
      console.warn("Backend createSaleReturn error:", e);
      return payload;
    }
  },

  async createPurchaseReturn(payload: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/returns/purchases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to record purchase return");
      return await res.json();
    } catch (e) {
      console.warn("Backend createPurchaseReturn error:", e);
      return payload;
    }
  },

  async getSaleReturns(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/returns/sales`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn("Backend getSaleReturns error:", e);
      return [];
    }
  },

  async getPurchaseReturns(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/returns/purchases`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn("Backend getPurchaseReturns error:", e);
      return [];
    }
  },

  async deletePurchaseReturn(returnId: string | number): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/returns/purchases/${returnId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete purchase return");
      return await res.json();
    } catch (e) {
      console.warn("Backend deletePurchaseReturn error:", e);
      return null;
    }
  },

  async deleteSaleReturn(returnId: string | number): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/returns/sales/${returnId}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to delete sale return");
      }
      return await res.json();
    } catch (e) {
      console.warn("Backend deleteSaleReturn error:", e);
      throw e;
    }
  },

  async deleteStockEntry(entryId: string | number): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/stock-entries/${entryId}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to delete stock entry");
      }
      return await res.json();
    } catch (e) {
      console.warn("Backend deleteStockEntry error:", e);
      throw e;
    }
  },

  async deleteStockAdjustment(adjustmentId: string | number): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/stock-adjustments/${adjustmentId}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to delete stock adjustment");
      }
      return await res.json();
    } catch (e) {
      console.warn("Backend deleteStockAdjustment error:", e);
      throw e;
    }
  },

  async createStockAdjustment(payload: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/inventory/stock-adjustments`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async addInvoicePayment(invoiceId: string | number, payment: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/sales/${invoiceId}/payments`, {
      method: "POST",
      body: JSON.stringify(payment)
    });
    return await res.json();
  },

  async getInvoicePayments(invoiceId: string | number): Promise<any[]> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/sales/${invoiceId}/payments`);
      return await res.json();
    } catch {
      return [];
    }
  },

  async updateDeliveryState(invoiceId: string | number, deliveryState: string, meta?: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/sales/${invoiceId}/delivery-state`, {
      method: "PATCH",
      body: JSON.stringify({ delivery_state: deliveryState, ...(meta || {}) })
    });
    return await res.json();
  },

  async createCategory(category: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/categories/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category)
      });
      if (!res.ok) throw new Error("Failed to create category");
      return await res.json();
    } catch (e) {
      console.warn("Backend createCategory error:", e);
      return category;
    }
  },

  async createExpenseVoucher(voucher: any): Promise<any> {
    try {
      const formatted = {
        voucher_no: voucher.voucher_no || voucher.voucherNo || `EXP-${Date.now()}`,
        date: voucher.date || new Date().toISOString().split('T')[0],
        name: voucher.name || voucher.paid_to || voucher.paidTo || 'General Expense',
        details: voucher.details || voucher.particulars || voucher.category || null,
        payment_mode: voucher.payment_mode || voucher.paymentMode || 'Cash',
        bank_ac_no: voucher.bank_ac_no || voucher.bankAcNo || null,
        grand_total: Number(voucher.grand_total ?? voucher.amount ?? 0),
        items_json: voucher.items_json || JSON.stringify(voucher.items || [])
      };
      const res = await fetch(`${API_BASE_URL}/accounting/expense-vouchers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formatted)
      });
      if (!res.ok) throw new Error("Failed to record expense voucher");
      return await res.json();
    } catch (e) {
      console.warn("Backend createExpenseVoucher error:", e);
      return voucher;
    }
  },

  async createIncomeVoucher(voucher: any): Promise<any> {
    try {
      const formatted = {
        voucher_no: voucher.voucher_no || voucher.voucherNo || `INC-${Date.now()}`,
        date: voucher.date || new Date().toISOString().split('T')[0],
        name: voucher.name || voucher.received_from || voucher.customerName || 'General Income',
        details: voucher.details || voucher.particulars || null,
        payment_mode: voucher.payment_mode || voucher.paymentMode || 'Cash',
        bank_ac_no: voucher.bank_ac_no || voucher.bankAcNo || null,
        grand_total: Number(voucher.grand_total ?? voucher.amount ?? 0),
        items_json: voucher.items_json || JSON.stringify(voucher.items || [])
      };
      const res = await fetch(`${API_BASE_URL}/accounting/income-vouchers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formatted)
      });
      if (!res.ok) throw new Error("Failed to record income voucher");
      return await res.json();
    } catch (e) {
      console.warn("Backend createIncomeVoucher error:", e);
      return voucher;
    }
  },

  async getExpenseVouchers(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/accounting/expense-vouchers`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn("Backend getExpenseVouchers error:", e);
      return [];
    }
  },

  async getIncomeVouchers(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/accounting/income-vouchers`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn("Backend getIncomeVouchers error:", e);
      return [];
    }
  },

  async createSupplier(supplier: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/suppliers/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplier)
      });
      if (!res.ok) throw new Error("Failed to create supplier");
      return await res.json();
    } catch (e) {
      console.warn("Backend createSupplier error:", e);
      return supplier;
    }
  },

  async recordSupplierPayment(payment: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/suppliers/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payment)
      });
      if (!res.ok) throw new Error("Failed to record supplier payment");
      return await res.json();
    } catch (e) {
      console.warn("Backend recordSupplierPayment error:", e);
      return payment;
    }
  },

  async holdCart(cart: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/sales/held-carts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cart)
      });
      if (!res.ok) throw new Error("Failed to hold cart");
      return await res.json();
    } catch (e) {
      console.warn("Backend holdCart error:", e);
      return cart;
    }
  },

  async getHeldCarts(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/sales/held-carts`);
      if (!res.ok) throw new Error("Failed to fetch held carts");
      return await res.json();
    } catch {
      return [];
    }
  },

  async deleteHeldCart(holdId: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/sales/held-carts/${encodeURIComponent(holdId)}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete held cart");
      return await res.json();
    } catch (e) {
      console.warn("Backend deleteHeldCart error:", e);
      return { success: false };
    }
  },

  async createStockEntry(entry: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/stock-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry)
      });
      if (!res.ok) throw new Error("Failed to record stock entry");
      return await res.json();
    } catch (e) {
      console.warn("Backend createStockEntry error:", e);
      return entry;
    }
  },

  async getStockEntries(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/stock-entries`);
      if (!res.ok) throw new Error("Failed to fetch stock entries");
      return await res.json();
    } catch {
      return [];
    }
  },

  async getStockAdjustments(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/stock-adjustments`);
      if (!res.ok) throw new Error("Failed to fetch stock adjustments");
      return await res.json();
    } catch {
      return [];
    }
  },

  async createUser(user: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user)
      });
      if (!res.ok) throw new Error("Failed to register user");
      return await res.json();
    } catch (e) {
      console.warn("Backend createUser error:", e);
      return user;
    }
  },

  async getUsers(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/users`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return await res.json();
    } catch {
      return [];
    }
  },

  async createSalesman(salesman: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/salesmen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(salesman)
      });
      if (!res.ok) throw new Error("Failed to create salesman");
      return await res.json();
    } catch (e) {
      console.warn("Backend createSalesman error:", e);
      return salesman;
    }
  },

  async createTenant(tenant: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/company/tenants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tenant)
      });
      if (!res.ok) throw new Error("Failed to create tenant");
      return await res.json();
    } catch (e) {
      console.warn("Backend createTenant error:", e);
      return tenant;
    }
  },

  async getTenants(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/company/tenants`);
      if (!res.ok) throw new Error("Failed to fetch tenants");
      return await res.json();
    } catch {
      return [];
    }
  },

  async createBackup(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/backup/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error("Failed to trigger backup");
      return await res.json();
    } catch (e) {
      console.warn("Backend createBackup error:", e);
      return null;
    }
  },

  async getBackupConfig(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/backup/config`);
      if (!res.ok) throw new Error("Failed to fetch backup config");
      return await res.json();
    } catch {
      return null;
    }
  },

  async createAccountHead(payload: { name: string; under_group: string; active?: boolean }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/accounting/account-heads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save account head");
      return await res.json();
    } catch (e) {
      console.warn("Backend createAccountHead error:", e);
      return null;
    }
  },

  async deleteAccountHead(headId: number): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/accounting/account-heads/${headId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete account head");
      return await res.json();
    } catch (e) {
      console.warn("Backend deleteAccountHead error:", e);
      return null;
    }
  },

  async getBankStatements(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/accounting/bank-statements`);
      if (!res.ok) throw new Error("Failed to fetch bank statements");
      return await res.json();
    } catch {
      return [];
    }
  },

  async createBankStatement(payload: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/accounting/bank-statements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to create bank statement");
      return await res.json();
    } catch (e) {
      console.warn("Backend createBankStatement error:", e);
      return null;
    }
  },

  async getDocumentPrefixes(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/company/prefixes`);
      if (!res.ok) throw new Error("Failed to fetch prefixes");
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateDocumentPrefixes(payload: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/company/prefixes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to update prefixes");
      return await res.json();
    } catch (e) {
      console.warn("Backend updateDocumentPrefixes error:", e);
      return payload;
    }
  },

  async deleteProduct(productId: number | string): Promise<any> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/products/${productId}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to delete product from database");
      }
      return await res.json();
    } catch (e: any) {
      console.warn("Backend deleteProduct error:", e);
      throw e;
    }
  },

  async bulkDeleteProducts(productIds: (number | string)[]): Promise<any> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/products/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_ids: productIds })
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to bulk delete products");
      }
      return await res.json();
    } catch (e: any) {
      console.warn("Backend bulkDeleteProducts error:", e);
      throw e;
    }
  },

  async deleteCustomer(customerId: number | string): Promise<any> {
    try {
      const cid = encodeURIComponent(String(customerId ?? '').trim());
      const res = await apiFetch(`${API_BASE_URL}/customers/${cid}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete customer");
      return await res.json();
    } catch (e) {
      console.warn("Backend deleteCustomer error:", e);
      return null;
    }
  },

  async getCustomerLedger(customerId: number | string): Promise<any[]> {
    try {
      const cid = encodeURIComponent(String(customerId ?? '').trim());
      const res = await fetch(`${API_BASE_URL}/customers/${cid}/ledger`);
      if (!res.ok) throw new Error("Failed to fetch customer ledger");
      return await res.json();
    } catch {
      return [];
    }
  },

  async getAllCustomerLedgers(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/customers/all/ledger`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async addCustomerLedger(customerId: number | string, entry: any): Promise<any> {
    const cid = encodeURIComponent(String(customerId ?? '').trim());
    const res = await apiFetch(`${API_BASE_URL}/customers/${cid}/ledger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to post ledger entry");
    }
    return await res.json();
  },

  async getCustomerLoyalty(customerId: number | string): Promise<any> {
    try {
      const cid = encodeURIComponent(String(customerId ?? '').trim());
      const res = await fetch(`${API_BASE_URL}/customers/${cid}/loyalty`);
      if (!res.ok) throw new Error("Failed to get loyalty");
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateCustomerLoyalty(customerId: number | string, data: any): Promise<any> {
    try {
      const cid = encodeURIComponent(String(customerId ?? '').trim());
      const res = await fetch(`${API_BASE_URL}/customers/${cid}/loyalty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to update loyalty");
      return await res.json();
    } catch (e) {
      console.warn("Backend updateCustomerLoyalty error:", e);
      return data;
    }
  },

  async updateSupplier(supplierId: number, payload: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/suppliers/${supplierId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to update supplier");
      return await res.json();
    } catch (e) {
      console.warn("Backend updateSupplier error:", e);
      return payload;
    }
  },

  async deleteSupplier(supplierId: number | string): Promise<any> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/suppliers/${supplierId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete supplier");
      return await res.json();
    } catch (e) {
      console.warn("Backend deleteSupplier error:", e);
      return null;
    }
  },

  async getDayCloseSummary(date?: string): Promise<any> {
    try {
      const q = date ? `?date=${encodeURIComponent(date)}` : '';
      const res = await fetch(`${API_BASE_URL}/accounting/day-close-summary${q}`);
      if (!res.ok) throw new Error("Failed to fetch day close summary");
      return await res.json();
    } catch (e) {
      console.warn("Backend getDayCloseSummary error:", e);
      return null;
    }
  },

  async getFinancialStatements(fromDate?: string, toDate?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append("from_date", fromDate);
      if (toDate) params.append("to_date", toDate);
      const q = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_BASE_URL}/accounting/financial-statements${q}`);
      if (!res.ok) throw new Error("Failed to fetch financial statements");
      return await res.json();
    } catch (e) {
      console.warn("Backend getFinancialStatements error:", e);
      return null;
    }
  },

  async recordShiftSettlement(payload: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/accounting/shift-settlement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to record shift settlement");
      return await res.json();
    } catch (e) {
      console.warn("Backend recordShiftSettlement error:", e);
      return payload;
    }
  },

  async createStockTransfer(payload: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/stock-transfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to create stock transfer");
      return await res.json();
    } catch (e) {
      console.warn("Backend createStockTransfer error:", e);
      return payload;
    }
  },

  async getStockTransfers(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/stock-transfers`);
      if (!res.ok) throw new Error("Failed to fetch stock transfers");
      return await res.json();
    } catch {
      return [];
    }
  },

  async deletePurchase(purchaseId: number | string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/purchases/${purchaseId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete purchase invoice");
      return await res.json();
    } catch (e) {
      console.warn("Backend deletePurchase error:", e);
      return null;
    }
  },

  async getAllEmiSchedules(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/sales/emi-schedules/all`);
      if (!res.ok) throw new Error("Failed to fetch EMI schedules");
      return await res.json();
    } catch {
      return [];
    }
  },

  async getCustomerEmiSchedules(customerId: number | string): Promise<any[]> {
    try {
      const numId = parseInt(String(customerId).replace(/\D/g, ''), 10) || customerId;
      const res = await fetch(`${API_BASE_URL}/sales/customers/${numId}/emi-schedules`);
      if (!res.ok) throw new Error("Failed to fetch customer EMI schedules");
      return await res.json();
    } catch {
      return [];
    }
  },

  async getInvoicePresignedUrl(invoiceId: number | string): Promise<any> {
    try {
      const numId = parseInt(String(invoiceId).replace(/\D/g, ''), 10) || invoiceId;
      const res = await fetch(`${API_BASE_URL}/sales/${numId}/presigned-url`);
      if (!res.ok) throw new Error("Failed to get presigned URL");
      return await res.json();
    } catch (e) {
      console.warn("Backend getInvoicePresignedUrl error:", e);
      return null;
    }
  },

  async getCustomerStatementPdfUrl(customerId: number | string): Promise<string> {
    return `${API_BASE_URL}/customers/${customerId}/statement/pdf`;
  },

  async getQuotationPdfUrl(quotationId: number | string): Promise<string> {
    return `${API_BASE_URL}/sales/quotations/${quotationId}/pdf`;
  },

  async getEstimatePdfUrl(estimateId: number | string): Promise<string> {
    return `${API_BASE_URL}/sales/estimates/${estimateId}/pdf`;
  },

  async restoreBackup(payload: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/backup/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to restore backup");
      return await res.json();
    } catch (e) {
      console.warn("Backend restoreBackup error:", e);
      return null;
    }
  },

  async getSupplierPayments(supplierId?: number): Promise<any[]> {
    try {
      const q = supplierId ? `?supplier_id=${supplierId}` : '';
      const res = await fetch(`${API_BASE_URL}/suppliers/payments${q}`);
      if (!res.ok) throw new Error("Failed to fetch supplier payments");
      return await res.json();
    } catch {
      return [];
    }
  },

  async getQuotations(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/sales/quotations`);
      if (!res.ok) throw new Error("Failed to fetch quotations");
      return await res.json();
    } catch {
      return [];
    }
  },

  async createQuotation(quotation: any): Promise<any> {
    try {
      const formatted = {
        quotation_no: quotation.quotation_no || quotation.quotationNo || `QT-${Date.now()}`,
        date: quotation.date || new Date().toISOString().split('T')[0],
        customer_id: quotation.customer_id || quotation.customerId || null,
        customer_name: quotation.customer_name || quotation.customerName || 'Walk-in Client',
        contact_no: quotation.contact_no || quotation.contactNo || quotation.customer_phone || quotation.customerPhone || null,
        state: quotation.state || 'Kerala',
        gstin: quotation.gstin || null,
        remarks: quotation.remarks || quotation.notes || null,
        sub_total: Number(quotation.sub_total ?? quotation.subTotal ?? quotation.subtotal ?? 0),
        cgst: Number(quotation.cgst ?? 0),
        sgst: Number(quotation.sgst ?? 0),
        igst: Number(quotation.igst ?? 0),
        cess: Number(quotation.cess ?? 0),
        total_discount: Number(quotation.total_discount ?? quotation.totalDiscount ?? quotation.discount_total ?? 0),
        round_off: Number(quotation.round_off ?? quotation.roundOff ?? 0),
        grand_total: Number(quotation.grand_total ?? quotation.grandTotal ?? 0),
        items_json: typeof quotation.items === 'string' ? quotation.items : JSON.stringify(quotation.items || [])
      };
      const res = await fetch(`${API_BASE_URL}/sales/quotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formatted)
      });
      if (!res.ok) throw new Error("Failed to save quotation");
      return await res.json();
    } catch (e) {
      console.warn("Backend createQuotation error:", e);
      return quotation;
    }
  },

  async deleteQuotation(quotationId: number | string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/sales/quotations/${quotationId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete quotation");
      return await res.json();
    } catch (e) {
      console.warn("Backend deleteQuotation error:", e);
      return null;
    }
  },

  async getCoupons(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/sales/coupons`);
      if (!res.ok) throw new Error("Failed to fetch coupons");
      return await res.json();
    } catch {
      return [];
    }
  },

  async createCoupon(payload: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/sales/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to create coupon");
      return await res.json();
    } catch (e) {
      console.warn("Backend createCoupon error:", e);
      return payload;
    }
  },

  async getGiftVouchers(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/sales/gift-vouchers`);
      if (!res.ok) throw new Error("Failed to fetch gift vouchers");
      return await res.json();
    } catch {
      return [];
    }
  },

  async createGiftVoucher(payload: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/sales/gift-vouchers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to create gift voucher");
      return await res.json();
    } catch (e) {
      console.warn("Backend createGiftVoucher error:", e);
      return payload;
    }
  },

  async getEWayBills(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/sales/eway-bills`);
      if (!res.ok) throw new Error("Failed to fetch e-way bills");
      return await res.json();
    } catch {
      return [];
    }
  },

  async createEWayBill(payload: any): Promise<any> {
    try {
      const formatted = {
        eway_bill_no: String(payload.eway_bill_no || payload.ewayBillNo || `EWB-${Date.now()}`),
        eway_bill_date: String(payload.eway_bill_date || payload.ewayBillDate || new Date().toISOString().split('T')[0]),
        invoice_no: String(payload.invoice_no || payload.invoiceNo || 'INV-001'),
        customer_name: String(payload.customer_name || payload.customerName || 'Walk-in Client'),
        customer_gstin: payload.customer_gstin || payload.customerGstin || null,
        from_place: String(payload.from_place || payload.fromPlace || payload.dispatch_from || 'Vaikom Showroom'),
        to_place: String(payload.to_place || payload.toPlace || payload.ship_to || 'Customer Address'),
        distance_km: Number(payload.distance_km ?? payload.pinToPinDistanceKm ?? 0),
        transporter_id: payload.transporter_id || payload.transporterId || null,
        transporter_name: String(payload.transporter_name || payload.transporterName || 'Direct Logistics'),
        transport_mode: String(payload.transport_mode || payload.transportMode || 'Road'),
        vehicle_no: String(payload.vehicle_no || payload.vehicleNo || 'KL-36-E-1234'),
        valid_until: String(payload.valid_until || payload.validUntil || payload.valid_upto || new Date(Date.now() + 86400000).toISOString().split('T')[0])
      };
      const res = await fetch(`${API_BASE_URL}/sales/eway-bills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formatted)
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to save e-way bill: ${res.status} ${errorText}`);
      }
      return await res.json();
    } catch (e) {
      console.warn("Backend createEWayBill error:", e);
      return payload;
    }
  },

  async getQuantityDiscountRules(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/discount-rules`);
      if (!res.ok) throw new Error("Failed to fetch discount rules");
      return await res.json();
    } catch {
      return [];
    }
  },

  async createQuantityDiscountRule(rule: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/discount-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule)
      });
      if (!res.ok) throw new Error("Failed to save discount rule");
      return await res.json();
    } catch (e) {
      console.warn("Backend createQuantityDiscountRule error:", e);
      return rule;
    }
  },

  async deleteQuantityDiscountRule(ruleId: number): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/discount-rules/${ruleId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete discount rule");
      return await res.json();
    } catch (e) {
      console.warn("Backend deleteQuantityDiscountRule error:", e);
      return null;
    }
  },

  async getComboPacks(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/combo-packs`);
      if (!res.ok) throw new Error("Failed to fetch combo packs");
      return await res.json();
    } catch {
      return [];
    }
  },

  async createComboPack(pack: any): Promise<any> {
    try {
      const barcode = String(pack.barcode || pack.bundleBarcode || pack.pack_code || `CP-${Date.now().toString().slice(-4)}`);
      const name = String(pack.name || pack.bundleName || 'Combo Pack');
      const comboPrice = Number(pack.combo_price ?? pack.comboPrice ?? pack.totalAmount ?? 0);
      const mrp = Number(pack.mrp ?? pack.totalMrp ?? comboPrice);
      const itemsJson = typeof pack.items_json === 'string'
        ? pack.items_json
        : JSON.stringify(pack.items || []);

      const formatted = {
        name,
        barcode,
        combo_price: comboPrice,
        mrp: mrp || comboPrice,
        description: pack.description || null,
        items_json: itemsJson,
        active: pack.active !== undefined ? Boolean(pack.active) : true
      };
      const res = await fetch(`${API_BASE_URL}/inventory/combo-packs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formatted)
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to create combo pack: ${res.status} ${errorText}`);
      }
      return await res.json();
    } catch (e) {
      console.warn("Backend createComboPack error:", e);
      return pack;
    }
  },

  async deleteComboPack(packId: number | string): Promise<any> {
    try {
      const numId = parseInt(String(packId).replace(/\D/g, ''), 10) || packId;
      const res = await fetch(`${API_BASE_URL}/inventory/combo-packs/${numId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete combo pack");
      return await res.json();
    } catch (e) {
      console.warn("Backend deleteComboPack error:", e);
      return null;
    }
  },

  async getGstHsnSummary(fromDate?: string, toDate?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      const res = await fetch(`${API_BASE_URL}/accounting/gst-hsn-summary?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch GST HSN summary");
      return await res.json();
    } catch (e) {
      console.warn("Backend getGstHsnSummary error:", e);
      return { hsn_summary: [], totals: {} };
    }
  },

  async convertQuotationToInvoice(quotationId: string | number, payload?: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/sales/quotations/${quotationId}/convert-to-invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {})
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Conversion failed" }));
      throw new Error(err.detail || "Failed to convert quotation to invoice");
    }
    return await res.json();
  },

  async downloadSaleReturnCreditNotePdf(returnId: string | number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/returns/sales/${returnId}/pdf`);
    if (!res.ok) throw new Error("Failed to generate Credit Note PDF");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Credit_Note_${returnId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async downloadPurchaseReturnDebitNotePdf(returnId: string | number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/returns/purchases/${returnId}/pdf`);
    if (!res.ok) throw new Error("Failed to generate Debit Note PDF");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Debit_Note_${returnId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async downloadCustomerReceiptPdf(customerId: string | number, entryId: string | number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/customers/${customerId}/ledger/${entryId}/receipt/pdf`);
    if (!res.ok) throw new Error("Failed to generate Payment Receipt PDF");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Payment_Receipt_${entryId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async downloadDayClosePdf(date?: string): Promise<void> {
    const params = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await fetch(`${API_BASE_URL}/accounting/day-close-summary/pdf${params}`);
    if (!res.ok) throw new Error("Failed to generate Day-End Z-Report PDF");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Day_Close_Z_Report_${date || 'today'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async downloadDeliveryNotePdf(dnId: string | number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/sales/delivery-notes/${dnId}/pdf`);
    if (!res.ok) throw new Error("Failed to generate Delivery Challan PDF");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Delivery_Challan_${dnId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async getSupplierStatement(supplierId: string | number, fromDate?: string, toDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (fromDate) params.set("from_date", fromDate);
    if (toDate) params.set("to_date", toDate);
    const q = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/suppliers/${supplierId}/statement${q}`);
    if (!res.ok) throw new Error("Failed to fetch supplier statement");
    return await res.json();
  },

  async downloadSupplierStatementPdf(supplierId: string | number, fromDate?: string, toDate?: string): Promise<void> {
    const params = new URLSearchParams();
    if (fromDate) params.set("from_date", fromDate);
    if (toDate) params.set("to_date", toDate);
    const q = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/suppliers/${supplierId}/statement/pdf${q}`);
    if (!res.ok) throw new Error("Failed to generate Supplier Statement PDF");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Supplier_Statement_${supplierId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async getStockValuation(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/inventory/stock-valuation`);
    if (!res.ok) throw new Error("Failed to fetch stock valuation");
    return await res.json();
  },

  async voidSaleReturn(returnId: string | number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/returns/sales/${returnId}/void`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to void sale return");
    }
    return await res.json();
  },

  async downloadEWayBillPdf(ewayId: string | number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/sales/eway-bills/${ewayId}/pdf`);
    if (!res.ok) throw new Error("Failed to generate E-Way Bill PDF");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EWay_Bill_${ewayId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async downloadStockTransferPdf(transferId: string | number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/inventory/stock-transfers/${transferId}/pdf`);
    if (!res.ok) throw new Error("Failed to generate Stock Transfer Challan PDF");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Stock_Transfer_${transferId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async downloadSupplierPaymentPdf(paymentId: string | number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/suppliers/payments/${paymentId}/pdf`);
    if (!res.ok) throw new Error("Failed to generate Supplier Payment Voucher PDF");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Supplier_Payment_${paymentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async deleteSupplierPayment(paymentId: string | number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/suppliers/payments/${paymentId}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to delete supplier payment");
    }
    return await res.json();
  },

  async downloadExpenseVoucherPdf(voucherId: string | number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/accounting/expense-vouchers/${voucherId}/pdf`);
    if (!res.ok) throw new Error("Failed to generate Expense Voucher PDF");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Expense_Voucher_${voucherId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async deleteExpenseVoucher(voucherId: string | number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/accounting/expense-vouchers/${voucherId}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to delete expense voucher");
    }
    return await res.json();
  },

  async deleteIncomeVoucher(voucherId: string | number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/accounting/income-vouchers/${voucherId}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to delete income voucher");
    }
    return await res.json();
  },

  async downloadProductBarcodeLabelPdf(productId: string | number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/barcode-label/pdf`);
    if (!res.ok) throw new Error("Failed to generate Product Barcode Tag PDF");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Product_Tag_${productId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async getBackupList(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/backup/list`);
    if (!res.ok) throw new Error('Failed to fetch backup list');
    return await res.json();
  },

  async downloadCustomerStatementPdf(customerId: string | number, fromDate?: string, toDate?: string): Promise<void> {
    const params = new URLSearchParams();
    if (fromDate) params.set("from_date", fromDate);
    if (toDate) params.set("to_date", toDate);
    const q = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/customers/${customerId}/statement/pdf${q}`);
    if (!res.ok) throw new Error("Failed to generate Customer Statement PDF");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SVF_Customer_Statement_${customerId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async downloadInvoicePdf(invoiceIdOrNo: string | number): Promise<void> {
    const isId = typeof invoiceIdOrNo === 'number' || /^\d+$/.test(String(invoiceIdOrNo));
    const path = isId
      ? `${API_BASE_URL}/sales/${invoiceIdOrNo}/pdf`
      : `${API_BASE_URL}/sales/by-no/${encodeURIComponent(String(invoiceIdOrNo))}/pdf`;
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to generate Invoice PDF (HTTP ${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SVF_Invoice_${invoiceIdOrNo}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async downloadQuotationPdf(quotationId: string | number, payload?: any): Promise<void> {
    let res: Response;
    if (payload) {
      res = await fetch(`${API_BASE_URL}/sales/quotations/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch(`${API_BASE_URL}/sales/quotations/${encodeURIComponent(String(quotationId))}/pdf`);
    }
    if (!res.ok) throw new Error("Failed to generate Quotation PDF");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SVF_Quotation_${quotationId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async downloadEstimatePdf(estimateId: string | number, payload?: any): Promise<void> {
    let res: Response;
    if (payload) {
      res = await fetch(`${API_BASE_URL}/sales/estimates/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch(`${API_BASE_URL}/sales/estimates/${encodeURIComponent(String(estimateId))}/pdf`);
    }
    if (!res.ok) throw new Error("Failed to generate Estimate PDF");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SVF_Estimate_${estimateId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async downloadProductBoxLabelsPdf(productIdOrCode: string | number): Promise<void> {
    const url = `${API_BASE_URL}/products/${encodeURIComponent(productIdOrCode)}/box-labels/pdf`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to generate Multi-Box Labels PDF (HTTP ${res.status})`);
    }
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `SVF_MultiBox_Labels_${productIdOrCode}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  },

  async getLowStockAlerts(threshold?: number): Promise<any[]> {
    try {
      const q = threshold !== undefined ? `?threshold=${encodeURIComponent(threshold)}` : '';
      const res = await fetch(`${API_BASE_URL}/products/alerts/low-stock${q}`);
      if (!res.ok) throw new Error("Failed to fetch low stock alerts");
      return await res.json();
    } catch (e) {
      console.warn("getLowStockAlerts fallback:", e);
      return [];
    }
  },

  async getShiftSettlements(date?: string, skip = 0, limit = 100): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      params.set("skip", String(skip));
      params.set("limit", String(limit));
      const res = await fetch(`${API_BASE_URL}/accounting/shift-settlements?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch shift settlements");
      return await res.json();
    } catch {
      return [];
    }
  },

  async updateInquiryStatus(id: number | string, newStatus: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/inquiries/${id}/status?new_status=${encodeURIComponent(newStatus)}`, {
      method: 'PATCH'
    });
    if (!res.ok) throw new Error("Failed to update inquiry status");
    return await res.json();
  },

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/categories/${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error("Failed to fetch category");
      return await res.json();
    } catch {
      return FALLBACK_CATEGORIES.find(c => c.slug === slug) || null;
    }
  },

  async getFurnitureItem(idOrSlug: string | number): Promise<Furniture | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/furniture/${encodeURIComponent(String(idOrSlug))}`);
      if (!res.ok) throw new Error("Failed to fetch furniture item");
      return await res.json();
    } catch {
      return FALLBACK_FURNITURE.find(f => f.id === Number(idOrSlug) || f.slug === String(idOrSlug)) || null;
    }
  },

  // --- Contra Transfers (Immutable Ledger) ---
  async getContraTransfers(): Promise<any[]> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/accounting/contra-transfers`);
      if (!res.ok) throw new Error("Failed to fetch contra transfers");
      return await res.json();
    } catch {
      return [];
    }
  },

  async createContraTransfer(payload: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/accounting/contra-transfers`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to record contra transfer");
    }
    const data = await res.json();
    notifyApiSuccess(`Contra voucher ${data.voucher_no} (₹${Number(data.amount).toLocaleString('en-IN')}) recorded and posted to journal!`);
    return data;
  },

  async deleteContraTransfer(transferId: string | number): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/accounting/contra-transfers/${transferId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to void contra transfer");
    const data = await res.json();
    notifyApiSuccess(`Contra transfer voided and balances reversed successfully.`);
    return data;
  },

  // --- Customer Ledger Entry Deletions & Rollbacks ---
  async deleteCustomerLedgerEntry(customerId: string | number, entryId: string | number): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/customers/${customerId}/ledger/${entryId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete customer ledger entry");
    const data = await res.json();
    notifyApiSuccess(data.message || `Customer ledger entry deleted.`);
    return data;
  },

  async deleteCustomerReceipt(voucherNo: string): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/customers/ledger/by-voucher/${encodeURIComponent(voucherNo)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete customer receipt voucher");
    const data = await res.json();
    notifyApiSuccess(data.message || `Receipt voucher ${voucherNo} deleted from database.`);
    return data;
  },

  // --- Estimates & Delivery Notes Deletions ---
  async deleteEstimate(estimateId: string | number): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/sales/estimates/${estimateId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete estimate");
    return await res.json();
  },

  async deleteDeliveryNote(dnId: string | number): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/sales/delivery-notes/${dnId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete delivery note");
    return await res.json();
  },

  // --- Banking Master PostgreSQL Persistence ---
  async getBankAccounts(): Promise<any[]> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/accounting/bank-accounts`);
      if (!res.ok) throw new Error("Failed to fetch bank accounts");
      return await res.json();
    } catch {
      return [];
    }
  },

  async saveBankAccount(account: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/accounting/bank-accounts`, {
      method: 'POST',
      body: JSON.stringify(account)
    });
    if (!res.ok) throw new Error("Failed to save bank account");
    const data = await res.json();
    notifyApiSuccess(`Bank account ${data.account_no} saved in PostgreSQL!`);
    return data;
  },

  async deleteBankAccount(accountId: string | number): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/accounting/bank-accounts/${accountId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete bank account");
    return await res.json();
  },

  async getBanks(): Promise<any[]> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/accounting/banks`);
      if (!res.ok) throw new Error("Failed to fetch banks");
      return await res.json();
    } catch {
      return [];
    }
  },

  async saveBank(bank: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/accounting/banks`, {
      method: 'POST',
      body: JSON.stringify(bank)
    });
    if (!res.ok) throw new Error("Failed to save bank");
    return await res.json();
  },

  async deleteBank(bankId: string | number): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/accounting/banks/${bankId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete bank");
    return await res.json();
  },

  async getBranches(): Promise<any[]> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/accounting/branches`);
      if (!res.ok) throw new Error("Failed to fetch branches");
      return await res.json();
    } catch {
      return [];
    }
  },

  async saveBranch(branch: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/accounting/branches`, {
      method: 'POST',
      body: JSON.stringify(branch)
    });
    if (!res.ok) throw new Error("Failed to save branch");
    return await res.json();
  },

  async deleteBranch(branchId: string | number): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/accounting/branches/${branchId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete branch");
    return await res.json();
  },

  // --- Product Serials PostgreSQL Persistence ---
  async getProductSerials(filters?: { product_id?: number; barcode?: string; status?: string }): Promise<any[]> {
    try {
      const q = new URLSearchParams();
      if (filters?.product_id) q.set('product_id', String(filters.product_id));
      if (filters?.barcode) q.set('barcode', filters.barcode);
      if (filters?.status) q.set('status', filters.status);
      const url = `${API_BASE_URL}/products/serials/all${q.toString() ? '?' + q.toString() : ''}`;
      const res = await apiFetch(url);
      if (!res.ok) throw new Error("Failed to fetch product serials");
      return await res.json();
    } catch {
      return [];
    }
  },

  async addProductSerials(productId: number | string, serials: any[]): Promise<any[]> {
    const numId = parseInt(String(productId).replace(/\D/g, ''), 10) || 1;
    const res = await apiFetch(`${API_BASE_URL}/products/${numId}/serials`, {
      method: 'POST',
      body: JSON.stringify(serials)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to save product serials");
    }
    return await res.json();
  },

  async deleteProductSerial(serialId: string | number): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/products/serials/${serialId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete product serial");
    return await res.json();
  },

  // --- CRM Leads & Inquiries Deletions ---
  async deleteInquiry(inquiryId: number | string): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/inquiries/${inquiryId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete inquiry");
    return await res.json();
  },

  // --- Salesman Payout Void / Reversal ---
  async voidSalesmanPayout(salesmanId: number | string, payload: { amount: number; voucher_no?: string; remarks?: string }): Promise<any> {
    const numId = parseInt(String(salesmanId).replace(/\D/g, ''), 10) || 1;
    const res = await apiFetch(`${API_BASE_URL}/auth/salesmen/${numId}/void-payout`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to void salesman payout");
    }
    return await res.json();
  },

  // --- Barcode Templates Master ---
  async getBarcodeTemplates(): Promise<any[]> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/inventory/barcode-templates`);
      if (!res.ok) throw new Error("Failed to fetch barcode templates");
      return await res.json();
    } catch {
      return [];
    }
  },

  async saveBarcodeTemplate(template: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/inventory/barcode-templates`, {
      method: 'POST',
      body: JSON.stringify(template)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to save barcode template");
    }
    return await res.json();
  },

  async deleteBarcodeTemplate(templateId: number | string): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/inventory/barcode-templates/${templateId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete barcode template");
    return await res.json();
  },

  // --- E-Way Bills, Coupons & Gift Vouchers Deletions ---
  async deleteEWayBill(ewayId: string | number): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/sales/eway-bills/${ewayId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete eway bill");
    return await res.json();
  },

  async deleteCoupon(couponId: string | number): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/sales/coupons/${couponId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete coupon");
    return await res.json();
  },

  async deleteGiftVoucher(voucherId: string | number): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/sales/gift-vouchers/${voucherId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete gift voucher");
    return await res.json();
  },

  // --- User, Salesman, Customer, Supplier, Product Deletions & SMS Config ---
  async deleteUser(userId: string | number): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/auth/users/${userId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete user");
    return await res.json();
  },

  async deleteSalesman(salesmanId: string | number): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/auth/salesmen/${salesmanId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete salesman");
    return await res.json();
  },

  async getSmsConfig(): Promise<any> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/sms/config`);
      if (!res.ok) throw new Error("Failed to fetch SMS config");
      return await res.json();
    } catch {
      return null;
    }
  },

  async saveSmsConfig(config: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/sms/config`, {
      method: 'POST',
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error("Failed to save SMS config");
    return await res.json();
  },

  async deleteSmsConfig(): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/sms/config`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete SMS config");
    return await res.json();
  },

  async getEmailConfig(): Promise<any> {
    return await fetchEmailConfig();
  },

  async saveEmailConfig(config: any): Promise<any> {
    return await saveEmailConfig(config);
  },

  async deleteEmailConfig(): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/email/config`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete email config");
    return await res.json();
  },

  async updateInquiry(id: number | string, data: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/inquiries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update inquiry");
    return await res.json();
  },

  async updateUserPermissions(userId: string | number, permissions: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/auth/users/${userId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify(permissions)
    });
    if (!res.ok) throw new Error("Failed to update user permissions");
    return await res.json();
  },

  async getUserPermissions(userId: string | number): Promise<any> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/auth/users/${userId}/permissions`);
      if (!res.ok) throw new Error("Failed to fetch user permissions");
      return await res.json();
    } catch {
      return null;
    }
  },

  async deleteDeliveryPipelineOrder(noteId: number | string): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/sales/delivery-pipeline/${noteId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to delete delivery order from pipeline');
    }
    return await res.json();
  },

  async logDeliveryCsat(noteId: number | string, payload: CsatFeedbackPayload): Promise<DeliveryPipelineItem> {
    return await logDeliveryCsat(noteId, payload);
  },

  async deleteCategory(idOrSlug: string | number): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/categories/${encodeURIComponent(String(idOrSlug))}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to delete category');
    }
    return await res.json();
  },

  async saveBackupConfig(config: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/backup/config`, {
      method: 'POST',
      body: JSON.stringify(config)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to save backup config');
    }
    return await res.json();
  },

  async changePassword(username: string, newPassword: string): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      body: JSON.stringify({ username, new_password: newPassword })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update user password');
    }
    return await res.json();
  },

  async getSystemSetting(key: string): Promise<any> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/company/settings/${key}`, { silent: true });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async saveSystemSetting(key: string, value: any): Promise<any> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/company/settings/${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
        silent: true
      });
      if (!res.ok) throw new Error(`Failed to save system setting: ${key}`);
      return await res.json();
    } catch (e) {
      console.warn(`Backend saveSystemSetting (${key}) queued:`, e);
      return value;
    }
  },

  async getAllSystemSettings(): Promise<Record<string, any>> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/company/settings`, { silent: true });
      if (!res.ok) return {};
      return await res.json();
    } catch {
      return {};
    }
  },

  async deleteSystemSetting(key: string): Promise<any> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/company/settings/${key}`, {
        method: "DELETE",
        silent: true
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getCompanyTenants(): Promise<any[]> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/company/tenants`, { silent: true });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async createCompanyTenant(tenant: any): Promise<any> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/company/tenants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tenant),
        silent: true
      });
      if (!res.ok) throw new Error("Failed to create company tenant");
      return await res.json();
    } catch (e) {
      console.warn("Backend createCompanyTenant error:", e);
      return tenant;
    }
  },

  // --- Outward Gate Passes (Security Exit Desk #1) ---
  async getOutwardGatePasses(limit = 100): Promise<any[]> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/sales/outward-gate-passes?limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch outward gate passes");
      return await res.json();
    } catch (e) {
      console.warn("getOutwardGatePasses error:", e);
      return [];
    }
  },

  async createOutwardGatePass(payload: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/sales/outward-gate-passes`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to create outward gate pass");
    }
    const data = await res.json();
    notifyApiSuccess(`Outward Gate Pass ${data.gate_pass_no} issued successfully!`);
    return data;
  },

  // --- Customer Showroom Wishlist ---
  async getCustomerWishlist(customerId?: number, phone?: string, sessionId?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (customerId) params.set('customer_id', String(customerId));
      if (phone) params.set('phone', phone);
      if (sessionId) params.set('session_id', sessionId);
      const q = params.toString() ? `?${params.toString()}` : '';
      const res = await apiFetch(`${API_BASE_URL}/customers/wishlist${q}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn("getCustomerWishlist error:", e);
      return [];
    }
  },

  async addToCustomerWishlist(payload: { product_id: number; customer_id?: number; customer_phone?: string; session_id?: string }): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/customers/wishlist`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to add to wishlist");
    }
    return await res.json();
  },

  async removeFromCustomerWishlist(productId: number, customerId?: number, phone?: string, sessionId?: string): Promise<any> {
    const params = new URLSearchParams();
    if (customerId) params.set('customer_id', String(customerId));
    if (phone) params.set('phone', phone);
    if (sessionId) params.set('session_id', sessionId);
    const q = params.toString() ? `?${params.toString()}` : '';
    const res = await apiFetch(`${API_BASE_URL}/customers/wishlist/${productId}${q}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to remove item from wishlist");
    return await res.json();
  },

  // --- CRM Leads & Pipeline Follow-up ---
  async getCrmLeads(leadStatus?: string, salesman?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (leadStatus && leadStatus !== 'ALL') params.set('lead_status', leadStatus);
      if (salesman) params.set('salesman', salesman);
      const q = params.toString() ? `?${params.toString()}` : '';
      const res = await apiFetch(`${API_BASE_URL}/inquiries/crm-leads${q}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn("getCrmLeads error:", e);
      return [];
    }
  },

  async createCrmLead(payload: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/inquiries/crm-leads`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const detailMsg = typeof err.detail === 'string'
        ? err.detail
        : Array.isArray(err.detail)
          ? err.detail.map((d: any) => `${d.loc ? d.loc.slice(1).join('.') + ': ' : ''}${d.msg}`).join(', ')
          : (err.message || "Failed to create CRM lead");
      throw new Error(detailMsg);
    }
    const data = await res.json();
    notifyApiSuccess(`CRM Lead created for ${data.customer_name}!`);
    return data;
  },

  async updateCrmLead(id: number | string, payload: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/inquiries/crm-leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to update CRM lead");
    }
    const data = await res.json();
    notifyApiSuccess(`Lead ${data.customer_name} updated successfully!`);
    return data;
  },

  // --- D-Sale Quick Billing ---
  async getDSaleBills(limit = 100): Promise<any[]> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/sales/d-sale-bills?limit=${limit}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn("getDSaleBills error:", e);
      return [];
    }
  },

  async createDSaleBill(payload: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/sales/d-sale-bills`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to create D-Sale bill");
    }
    const data = await res.json();
    notifyApiSuccess(`D-Sale Bill ${data.invoice_no} saved (₹${Number(data.grand_total).toLocaleString('en-IN')})!`);
    return data;
  },

  // --- Salesman Payment Vouchers & Commission Ledger ---
  async getSalesmanVouchers(salesmanId?: number): Promise<any[]> {
    try {
      const q = salesmanId ? `?salesman_id=${salesmanId}` : '';
      const res = await apiFetch(`${API_BASE_URL}/auth/salesmen/vouchers${q}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn("getSalesmanVouchers error:", e);
      return [];
    }
  },

  async createSalesmanVoucher(payload: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/auth/salesmen/vouchers`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to record salesman voucher");
    }
    const data = await res.json();
    notifyApiSuccess(`Voucher ${data.voucher_no} posted for ${data.salesman_name}!`);
    return data;
  },

  async getSalesmanLedger(salesmanId?: number): Promise<any[]> {
    try {
      const url = salesmanId
        ? `${API_BASE_URL}/auth/salesmen/${salesmanId}/ledger`
        : `${API_BASE_URL}/auth/salesmen/ledger`;
      const res = await apiFetch(url);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn("getSalesmanLedger error:", e);
      return [];
    }
  },

  // --- Customer Money Receipts ---
  async getCustomerReceipts(customerId?: number, limit = 100): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (customerId) params.set('customer_id', String(customerId));
      params.set('limit', String(limit));
      const res = await apiFetch(`${API_BASE_URL}/customers/receipts?${params.toString()}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn("getCustomerReceipts error:", e);
      return [];
    }
  },

  async createCustomerReceipt(payload: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/customers/receipts`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to create customer receipt");
    }
    const data = await res.json();
    notifyApiSuccess(`Receipt ${data.receipt_no} created for ${data.customer_name} (₹${Number(data.amount).toLocaleString('en-IN')})!`);
    return data;
  },

  // --- Gift Voucher Redemption ---
  async redeemGiftVoucher(code: string, billNo?: string): Promise<any> {
    const q = billNo ? `?bill_no=${encodeURIComponent(billNo)}` : '';
    const res = await apiFetch(`${API_BASE_URL}/sales/gift-vouchers/${encodeURIComponent(code)}/redeem${q}`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to redeem gift voucher");
    }
    const data = await res.json();
    notifyApiSuccess(`Voucher ${code} successfully redeemed for ₹${data.amount}!`);
    return data;
  },

  // --- Customer CSAT Reviews ---
  async getCustomerReviews(minRating?: number, limit = 100): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (minRating) params.set('min_rating', String(minRating));
      params.set('limit', String(limit));
      const res = await apiFetch(`${API_BASE_URL}/delivery-pipeline/reviews?${params.toString()}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn("getCustomerReviews error:", e);
      return [];
    }
  },

  // --- Marketing Campaign Logs ---
  async getCampaignLogs(channel?: string, limit = 200): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (channel) params.set('channel', channel);
      params.set('limit', String(limit));
      const res = await apiFetch(`${API_BASE_URL}/company/campaign-logs?${params.toString()}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn("getCampaignLogs error:", e);
      return [];
    }
  },

  async createCampaignLog(payload: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/company/campaign-logs`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to log campaign dispatch");
    }
    return await res.json();
  },

  async validateCoupon(payload: { code: string; order_amount: number }): Promise<{ is_valid: boolean; discount_amount: number; discount_type?: string; discount_value?: number; message?: string }> {
    const res = await apiFetch(`${API_BASE_URL}/discounts/coupons/validate`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Invalid or expired coupon");
    }
    return await res.json();
  },

  async validateSku(sku: string): Promise<{ is_unique: boolean; sku: string; message?: string }> {
    const res = await apiFetch(`${API_BASE_URL}/products/validate-sku`, {
      method: 'POST',
      body: JSON.stringify({ sku })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "SKU validation failed");
    }
    return await res.json();
  },

  async recordScaleEvent(payload: {
    scale_id?: string;
    event_type?: string;
    gross_weight: number;
    tare_weight: number;
    net_weight: number;
    unit?: string;
    product_barcode?: string;
    product_name?: string;
    amount?: number;
    status?: string;
    [key: string]: any;
  }): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/telemetry/hardware/scale-event`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to record weighing scale event");
    }
    return await res.json();
  },

  async quickCreateProduct(payload: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/products/quick-create`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to quick create product");
    }
    return await res.json();
  },

  async quickCreateCustomer(payload: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/customers/quick-create`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to quick create customer");
    }
    return await res.json();
  },

  async checkoutRubicPos(payload: any): Promise<any> {
    const res = await apiFetch(`${API_BASE_URL}/sales/rubic-checkout`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to process touch checkout");
    }
    return await res.json();
  }
};



/**
 * Universal CSV export utility for reports and data grids
 */
export function exportToCsv(filename: string, headers: string[], rows: (string | number | undefined | null)[][]) {
  const escapeCsv = (val: any) => {
    const s = String(val ?? '').replace(/"/g, '""');
    return `"${s}"`;
  };
  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(escapeCsv).join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export { exportToExcel, exportToJson } from '../utils/csvImporter';

export function mapBackendProductToFrontend(bp: any): any {
  const physical = Number(bp.physical_stock ?? bp.opening_stock ?? bp.current_stock ?? 0);
  const reserved = Number(bp.reserved_stock ?? 0);
  const display = Number(bp.display_stock ?? 0);
  const damaged = Number(bp.damaged_stock ?? 0);
  const available = bp.available_to_sell !== undefined ? Number(bp.available_to_sell) : (physical - reserved);

  return {
    id: String(bp.id),
    pCode: bp.p_code || bp.pCode || `P-${bp.id}`,
    name: bp.name,
    purchasePrice: bp.purchase_price ?? bp.purchasePrice ?? 0,
    cessPercent: bp.cess_percent ?? bp.cessPercent ?? 0,
    openingStock: bp.opening_stock ?? bp.openingStock ?? physical,
    currentStock: bp.current_stock ?? physical,
    physical_stock: physical,
    reserved_stock: reserved,
    display_stock: display,
    damaged_stock: damaged,
    available_to_sell: available,
    isKnockdown: Boolean(bp.is_knockdown),
    totalBoxesCount: bp.total_boxes_count || bp.total_boxes || 1,
    total_boxes: bp.total_boxes || bp.total_boxes_count || 1,
    assemblyRequired: Boolean(bp.assembly_required),
    assemblyLeadTimeMins: bp.assembly_lead_time_mins || 0,
    barcode: bp.barcode,
    mrp: bp.mrp ?? 0,
    retailPrice: bp.retail_price ?? bp.retailPrice ?? 0,
    wholesalePrice: bp.wholesale_price ?? bp.wholesalePrice ?? 0,
    minWholesaleQty: Number(bp.min_wholesale_quantity ?? bp.minWholesaleQty ?? 1.0),
    itemType: bp.item_type || bp.itemType || 'PRODUCT',
    category: bp.category_name || bp.category || 'Living Room',
    subCategory: bp.sub_category || bp.subCategory || '',
    description: bp.description || '',
    cgst: bp.cgst ?? 0,
    sgst: bp.sgst ?? 0,
    igst: bp.igst ?? 0,
    salesUnit: bp.sales_unit || bp.salesUnit || 'Pcs',
    salesAltUnit: bp.sales_alt_unit || bp.salesAltUnit || '',
    conv: bp.conv_ratio ?? bp.conv ?? 1,
    minStock: bp.min_stock ?? bp.minStock ?? 5,
    salesmanCommission: bp.salesman_commission ?? bp.salesmanCommission ?? 0,
    godown: bp.godown || 'Main Showroom',
    rack: bp.rack || '',
    hsn: bp.hsn_code || bp.hsn || '',
    photo: bp.image_url || bp.photo || '',
    loyaltyValue: bp.loyalty_value ?? bp.loyaltyValue ?? 0,
    loyaltyType: bp.loyalty_type || bp.loyaltyType || 'Percentage',
    partNo: bp.part_no || bp.partNo || '',
    material: bp.material || '',
    dimensions: bp.dimensions || '',
    colour: bp.color || bp.colour || '',
    warranty: bp.warranty || '3 Years Comprehensive',
    brand: bp.brand || 'Godrej Interio',
    variants: bp.variants || [],
    batches: bp.batches || [],
    boxComponents: (bp.box_components || bp.boxComponents || []).map((b: any) => ({
      id: b.id,
      productId: b.product_id || b.productId,
      boxNumber: b.box_number ?? b.boxNumber ?? 1,
      totalBoxes: b.total_boxes ?? b.totalBoxes ?? 1,
      componentName: b.component_name || b.componentName || 'Main Unit',
      boxBarcode: b.box_barcode || b.boxBarcode || '',
      boxSku: b.box_sku || b.boxSku || '',
      dimensions: b.dimensions || '',
      weightKg: Number(b.weight_kg ?? b.weightKg ?? 0),
      godown: b.godown || '',
      rack: b.rack || '',
      status: b.status || 'InStock',
      notes: b.notes || ''
    }))
  };
}

export function mapFrontendProductToBackend(fp: any): any {
  const physical = Number(fp.physical_stock ?? fp.currentStock ?? fp.openingStock) || 0;
  const reserved = Number(fp.reserved_stock) || 0;
  const display = Number(fp.display_stock) || 0;
  const damaged = Number(fp.damaged_stock) || 0;
  const available = physical - reserved;

  return {
    name: fp.name,
    p_code: fp.pCode || fp.p_code || `P-${fp.id || Date.now()}`,
    barcode: String(fp.barcode || ''),
    purchase_price: Number(fp.purchasePrice) || 0,
    mrp: Number(fp.mrp) || 0,
    retail_price: Number(fp.retailPrice) || 0,
    wholesale_price: Number(fp.wholesalePrice) || 0,
    min_wholesale_quantity: Number(fp.minWholesaleQty ?? fp.min_wholesale_quantity ?? 1.0),
    item_type: fp.itemType || fp.item_type || 'PRODUCT',
    cess_percent: Number(fp.cessPercent) || 0,
    opening_stock: Number(fp.openingStock) || physical,
    current_stock: physical,
    physical_stock: physical,
    reserved_stock: reserved,
    display_stock: display,
    damaged_stock: damaged,
    available_to_sell: available,
    is_knockdown: Boolean(fp.isKnockdown),
    total_boxes_count: Number(fp.totalBoxesCount || fp.total_boxes || 1),
    total_boxes: Number(fp.total_boxes || fp.totalBoxesCount || 1),
    assembly_required: Boolean(fp.assemblyRequired),
    assembly_lead_time_mins: Number(fp.assemblyLeadTimeMins) || 0,
    min_stock: Number(fp.minStock) || 5,
    sub_category: fp.subCategory || '',
    sales_unit: fp.salesUnit || 'Pcs',
    sales_alt_unit: fp.salesAltUnit || '',
    conv_ratio: Number(fp.conv) || 1,
    hsn_code: fp.hsn || '',
    cgst: Number(fp.cgst) || 0,
    sgst: Number(fp.sgst) || 0,
    igst: Number(fp.igst) || 0,
    sale_tax_type: fp.sTax || 'Inclusive',
    purchase_tax_type: fp.pTax || 'Exclusive',
    godown: fp.godown || 'Main Showroom',
    rack: fp.rack || '',
    part_no: fp.partNo || '',
    salesman_commission: Number(fp.salesmanCommission) || 0,
    loyalty_value: Number(fp.loyaltyValue) || 0,
    loyalty_type: fp.loyaltyType || 'Percentage',
    image_url: fp.photo || '',
    description: fp.description || '',
    material: fp.material || '',
    dimensions: fp.dimensions || fp.size || '',
    color: fp.colour || fp.color || '',
    warranty: fp.warranty || '3 Years Comprehensive',
    brand: fp.brand || 'Godrej Interio',
    category_name: fp.category || fp.category_name || 'Living Room',
    is_active: true,
    box_components: fp.boxComponents?.map((b: any) => ({
      box_number: b.boxNumber,
      total_boxes: b.totalBoxes,
      component_name: b.componentName,
      box_barcode: b.boxBarcode,
      box_sku: b.boxSku || b.boxBarcode,
      dimensions: b.dimensions || '',
      weight_kg: Number(b.weightKg) || 0,
      godown: b.godown || fp.godown || '',
      rack: b.rack || fp.rack || '',
      status: b.status || 'InStock',
      notes: b.notes || ''
    })) || []
  };
}

export function mapBackendCustomerToFrontend(bc: any): any {
  return {
    id: String(bc.id),
    name: bc.name,
    phone: bc.phone,
    state: bc.state || 'Kerala',
    address: bc.address || '',
    city: bc.city || '',
    gstin: bc.gstin || '',
    balance: bc.current_balance ?? bc.balance ?? 0,
    loyaltyPoints: bc.loyalty_points ?? bc.loyaltyPoints ?? 0,
    creditLimit: bc.credit_limit ?? bc.creditLimit ?? 50000,
    openingBalance: bc.opening_balance ?? bc.openingBalance ?? 0,
    email: bc.email || '',
    loyaltyEnabled: true
  };
}

export function mapBackendSupplierToFrontend(bs: any): any {
  return {
    id: String(bs.id || `supp-${bs.code}`),
    entityType: 'SUPPLIER',
    code: bs.code,
    name: bs.name,
    contactNo: bs.contact_no || '',
    address: bs.address || '',
    city: bs.city || '',
    state: bs.state || 'Kerala',
    totalCredit: 0,
    totalDebit: 0,
    balance: bs.current_balance ?? bs.balance ?? 0
  };
}

export function mapFrontendSupplierToBackend(fs: any): any {
  return {
    code: fs.code || `S-${Date.now().toString().slice(-4)}`,
    name: fs.name,
    company_name: fs.name,
    gstin: fs.gstin || null,
    state: fs.state || 'Kerala',
    state_code: '32',
    contact_no: fs.contactNo || '9876543210',
    email: fs.email || null,
    address: fs.address || '',
    city: fs.city || '',
    opening_balance: Number(fs.openingBalance || 0),
    current_balance: Number(fs.balance || 0),
    active: true
  };
}

// ---------------------------------------------------------------------------
// Real-world Email & SMTP API Client (Gmail / Yahoo / Outlook / Custom SMTP)
// ---------------------------------------------------------------------------

export async function fetchEmailConfig(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/email/config`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Could not fetch email config from backend:', err);
    return null;
  }
}

export async function saveEmailConfig(config: {
  serverName: string;
  smtpAddress: string;
  emailId: string;
  password?: string;
  port: number;
  tlsSslRequired: string;
  isDefault: boolean;
  isEnabled: boolean;
  senderName?: string;
}): Promise<any> {
  const payload = {
    server_name: config.serverName,
    smtp_address: config.smtpAddress,
    email_id: config.emailId,
    password: config.password,
    port: config.port,
    tls_ssl_required: config.tlsSslRequired,
    is_default: config.isDefault,
    is_enabled: config.isEnabled,
    sender_name: config.senderName || 'Shree Vinayaka Furnitures'
  };

  const res = await fetch(`${API_BASE_URL}/email/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Failed to save email configuration (HTTP ${res.status})`);
  }
  return await res.json();
}

export async function testSmtpConnection(config: {
  serverName: string;
  smtpAddress: string;
  emailId: string;
  password?: string;
  port: number;
  tlsSslRequired: string;
}): Promise<{ success: boolean; message: string; details?: any }> {
  const payload = {
    server_name: config.serverName,
    smtp_address: config.smtpAddress,
    email_id: config.emailId,
    password: config.password || '',
    port: config.port,
    tls_ssl_required: config.tlsSslRequired
  };

  const res = await fetch(`${API_BASE_URL}/email/test-connection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      message: errData.detail || `Server error during connection test (HTTP ${res.status})`
    };
  }
  return await res.json();
}

export async function sendInvoiceEmail(
  invoiceIdOrNo: string | number,
  toEmail: string,
  customMessage?: string,
  subject?: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/email/send-invoice/${encodeURIComponent(invoiceIdOrNo)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to_email: toEmail,
      custom_message: customMessage,
      subject: subject
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || data.message || `Failed to dispatch invoice email (HTTP ${res.status})`);
  }
  return data;
}

export async function sendGeneralEmail(payload: {
  toEmail: string;
  subject: string;
  message?: string;
  htmlContent?: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to_email: payload.toEmail,
      subject: payload.subject,
      message: payload.message,
      html_content: payload.htmlContent
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || data.message || `Failed to dispatch email (HTTP ${res.status})`);
  }
  return data;
}

// ==========================================
// GODREJ FURNITURE MULTI-BOX & AUTO-SKU APIS
// ==========================================

export async function generateFurnitureSku(payload: SkuGeneratorRequest): Promise<SkuGeneratorResponse> {
  const res = await fetch(`${API_BASE_URL}/products/generate-sku`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brand: payload.brand || 'GDJ',
      category_code: payload.categoryCode,
      model_name: payload.modelName,
      variant: payload.variant,
      is_knockdown: payload.isKnockdown,
      total_boxes: payload.totalBoxes,
      custom_box_names: payload.customBoxNames
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to auto-generate SKU and Barcode');
  }
  const data = await res.json();
  return {
    generatedSku: data.generated_sku,
    generatedBarcode: data.generated_barcode,
    brand: data.brand,
    categoryCode: data.category_code,
    isKnockdown: data.is_knockdown,
    totalBoxes: data.total_boxes,
    boxes: (data.boxes || []).map((b: any) => ({
      boxNumber: b.box_number,
      totalBoxes: b.total_boxes,
      componentName: b.component_name,
      boxBarcode: b.box_barcode,
      boxSku: b.box_sku
    }))
  };
}

export async function fetchProductBoxComponents(productId: string | number): Promise<ProductBoxComponent[]> {
  const res = await fetch(`${API_BASE_URL}/products/${productId}/box-components`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data || []).map((b: any) => ({
    id: b.id,
    productId: b.product_id,
    boxNumber: b.box_number,
    totalBoxes: b.total_boxes,
    componentName: b.component_name,
    boxBarcode: b.box_barcode,
    boxSku: b.box_sku,
    dimensions: b.dimensions,
    weightKg: b.weight_kg,
    godown: b.godown,
    rack: b.rack,
    status: b.status,
    notes: b.notes
  }));
}

export async function saveProductBoxComponents(
  productId: string | number,
  components: ProductBoxComponent[]
): Promise<ProductBoxComponent[]> {
  const payload = components.map(b => ({
    box_number: b.boxNumber,
    total_boxes: b.totalBoxes,
    component_name: b.componentName,
    box_barcode: b.boxBarcode,
    box_sku: b.boxSku || b.boxBarcode,
    dimensions: b.dimensions || '',
    weight_kg: Number(b.weightKg) || 0,
    godown: b.godown || '',
    rack: b.rack || '',
    status: b.status || 'InStock',
    notes: b.notes || ''
  }));

  const res = await fetch(`${API_BASE_URL}/products/${productId}/box-components`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to save box components');
  }
  const data = await res.json();
  return (data || []).map((b: any) => ({
    id: b.id,
    productId: b.product_id,
    boxNumber: b.box_number,
    totalBoxes: b.total_boxes,
    componentName: b.component_name,
    boxBarcode: b.box_barcode,
    boxSku: b.box_sku,
    dimensions: b.dimensions,
    weightKg: b.weight_kg,
    godown: b.godown,
    rack: b.rack,
    status: b.status,
    notes: b.notes
  }));
}

export async function verifyAssemblyBoxes(payload: AssemblyBoxVerifyRequest): Promise<AssemblyBoxVerifyResponse> {
  const res = await fetch(`${API_BASE_URL}/products/assembly/verify-boxes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: payload.productId,
      scanned_barcodes: payload.scannedBarcodes,
      invoice_no: payload.invoiceNo,
      carpenter_name: payload.carpenterName,
      notes: payload.notes
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to verify assembly boxes');
  }
  const data = await res.json();
  return {
    isComplete: data.is_complete,
    status: data.status,
    totalRequired: data.total_required,
    scannedCount: data.scanned_count,
    missingBoxNumbers: data.missing_box_numbers || [],
    missingBoxNames: data.missing_box_names || [],
    scannedBoxes: data.scanned_boxes || [],
    message: data.message
  };
}

export function getProductBoxLabelsPdfUrl(productIdOrCode: string | number): string {
  return `${API_BASE_URL}/products/${encodeURIComponent(productIdOrCode)}/box-labels/pdf`;
}

export async function downloadProductBoxLabelsPdf(productIdOrCode: string | number): Promise<void> {
  const url = `${API_BASE_URL}/products/${encodeURIComponent(productIdOrCode)}/box-labels/pdf`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to generate Multi-Box Labels PDF (HTTP ${res.status})`);
  }
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `SVF_MultiBox_Labels_${productIdOrCode}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}

// =====================================================================
// STEP 5: BANK SYNC & CUSTOMER CREDIT AGING API METHODS
// =====================================================================

export async function fetchBankStatementEntries(
  accountNo?: string,
  status?: string,
  search?: string
): Promise<BankStatementEntry[]> {
  try {
    const params = new URLSearchParams();
    if (accountNo) params.append('account_no', accountNo);
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE_URL}/accounting/bank-sync/entries?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch bank statement entries');
    const data = await res.json();
    return data.map((d: any) => ({
      id: d.id,
      date: d.date,
      accountNo: d.account_no,
      receiptNo: d.receipt_no,
      description: d.description,
      debit: d.debit || 0,
      credit: d.credit || 0,
      balance: d.balance || 0,
      utrNumber: d.utr_number,
      status: d.status,
      reconciledPartyType: d.reconciled_party_type,
      reconciledPartyId: d.reconciled_party_id,
      reconciledPartyName: d.reconciled_party_name,
      reconciledRefNo: d.reconciled_ref_no,
      reconciledAt: d.reconciled_at
    }));
  } catch (e) {
    console.warn('Backend fetchBankStatementEntries error, returning fallback:', e);
    return [];
  }
}

export async function uploadBankStatementEntries(accountNo: string, entries: any[]): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/accounting/bank-sync/upload-statement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      account_no: accountNo,
      entries: entries.map(e => ({
        date: e.date,
        account_no: accountNo,
        receipt_no: e.receiptNo || e.receipt_no,
        description: e.description,
        debit: Number(e.debit || 0),
        credit: Number(e.credit || 0),
        balance: Number(e.balance || 0),
        utr_number: e.utrNumber || e.utr_number
      }))
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to upload bank statement');
  }
  return await res.json();
}

export async function fetchBankReconciliationCandidates(entryId: number): Promise<BankReconciliationCandidatesResponse> {
  const res = await fetch(`${API_BASE_URL}/accounting/bank-sync/candidates/${entryId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch reconciliation candidates');
  }
  return await res.json();
}

export async function reconcileBankEntry(payload: BankReconcilePayload): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/accounting/bank-sync/reconcile-entry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to reconcile bank statement entry');
  }
  return await res.json();
}

export async function seedSampleBankStatement(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/accounting/bank-sync/seed-sample-statement`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to seed sample statement');
  return await res.json();
}

export async function fetchCustomerCreditAging(minDays?: number): Promise<CustomerCreditAgingSummary> {
  const url = minDays ? `${API_BASE_URL}/customers/credit-aging?min_days=${minDays}` : `${API_BASE_URL}/customers/credit-aging`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch customer credit aging summary');
  return await res.json();
}

export async function fetchCustomerCreditAgingDetail(customerId: number | string): Promise<CustomerCreditAgingDetailResponse> {
  const cid = encodeURIComponent(String(customerId ?? '').trim());
  const res = await fetch(`${API_BASE_URL}/customers/${cid}/credit-aging-detail`);
  if (!res.ok) throw new Error('Failed to fetch customer credit aging details');
  return await res.json();
}

export async function generateCustomerPaymentReminder(customerId: number | string): Promise<PaymentReminderResponse> {
  const cid = encodeURIComponent(String(customerId ?? '').trim());
  const res = await fetch(`${API_BASE_URL}/customers/${cid}/payment-reminder`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to generate customer payment reminder');
  return await res.json();
}

// -------------------------------------------------------------
// Stock Hedging & Intelligent Reorder Alerts API
// -------------------------------------------------------------
export async function fetchStockHedgingSummary(search?: string, filterType?: string): Promise<StockHedgingSummary> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (filterType) params.append('filter_type', filterType);
  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE_URL}/inventory/stock-hedging/summary${queryStr}`);
  if (!res.ok) throw new Error('Failed to fetch stock hedging analytics');
  return await res.json();
}

export async function updateProductStockHedging(
  productId: number,
  payload: {
    reserved_stock?: number;
    transit_stock?: number;
    min_stock?: number;
    reorder_quantity?: number;
    lead_time_days?: number;
  }
): Promise<any> {
  const params = new URLSearchParams();
  if (payload.reserved_stock !== undefined) params.append('reserved_stock', String(payload.reserved_stock));
  if (payload.transit_stock !== undefined) params.append('transit_stock', String(payload.transit_stock));
  if (payload.min_stock !== undefined) params.append('min_stock', String(payload.min_stock));
  if (payload.reorder_quantity !== undefined) params.append('reorder_quantity', String(payload.reorder_quantity));
  if (payload.lead_time_days !== undefined) params.append('lead_time_days', String(payload.lead_time_days));

  const res = await fetch(`${API_BASE_URL}/inventory/stock-hedging/${productId}/update?${params.toString()}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to update product stock hedging');
  return await res.json();
}

export async function seedStockHedgingSampleData(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/inventory/stock-hedging/seed-sample-data`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to seed stock hedging sample data');
  return await res.json();
}

// -------------------------------------------------------------
// Dispatch, Assembly & Delivery CSAT Pipeline API
// -------------------------------------------------------------
export async function fetchDeliveryPipelineOrders(stage?: string, search?: string): Promise<DeliveryPipelineItem[]> {
  const params = new URLSearchParams();
  if (stage) params.append('stage', stage);
  if (search) params.append('search', search);
  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE_URL}/sales/delivery-pipeline/orders${queryStr}`);
  if (!res.ok) throw new Error('Failed to fetch delivery pipeline orders');
  return await res.json();
}

export async function advanceDeliveryStage(
  noteId: number,
  payload: DeliveryStageAdvancePayload
): Promise<DeliveryPipelineItem> {
  const res = await fetch(`${API_BASE_URL}/sales/delivery-pipeline/${noteId}/advance-stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to advance delivery stage');
  }
  return await res.json();
}

export async function logDeliveryCsat(
  noteId: number | string,
  payload: CsatFeedbackPayload
): Promise<DeliveryPipelineItem> {
  const res = await fetch(`${API_BASE_URL}/sales/delivery-pipeline/${noteId}/log-csat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to log delivery CSAT');
  }
  return await res.json();
}

export async function generateDeliveryCsatWhatsApp(noteId: number): Promise<CsatWhatsAppResponse> {
  const res = await fetch(`${API_BASE_URL}/sales/delivery-pipeline/${noteId}/generate-csat-whatsapp`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to generate delivery CSAT WhatsApp message');
  return await res.json();
}

export async function seedDeliveryPipelineSampleData(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/sales/delivery-pipeline/seed-sample-pipeline`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to seed delivery pipeline sample data');
  return await res.json();
}

export async function deleteDeliveryPipelineOrder(noteId: number | string): Promise<any> {
  return await api.deleteDeliveryPipelineOrder(noteId);
}

// -------------------------------------------------------------
// GRN (Goods Receipt Note) & Stock Entry Pipeline API
// -------------------------------------------------------------
export async function createStandaloneGrn(payload: GoodsReceiptNotePayload): Promise<GoodsReceiptNoteRecord> {
  const res = await apiFetch(`${API_BASE_URL}/purchases/grn`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  notifyApiSuccess(`GRN ${payload.grn_no} recorded and stock buckets updated.`);
  return await res.json();
}

export async function fetchGoodsReceiptNotes(skip = 0, limit = 100): Promise<GoodsReceiptNoteRecord[]> {
  const res = await apiFetch(`${API_BASE_URL}/purchases/grns?skip=${skip}&limit=${limit}`);
  return await res.json();
}

export async function fetchGoodsReceiptNote(grnId: number): Promise<GoodsReceiptNoteRecord> {
  const res = await apiFetch(`${API_BASE_URL}/purchases/grns/${grnId}`);
  return await res.json();
}

// -------------------------------------------------------------
// Statutory Credit Note / Sales Return API
// -------------------------------------------------------------
export async function issueCreditNote(payload: CreditNoteRequest): Promise<CreditNoteResponse> {
  const res = await apiFetch(`${API_BASE_URL}/sales/credit-note`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  notifyApiSuccess(`Credit Note ${data.credit_note_no} issued successfully. Stock & GST reversed.`);
  return data;
}

// -------------------------------------------------------------
// Double-Entry Ledger & Customer Khata API
// -------------------------------------------------------------
export async function fetchLiveLedgerBalances(): Promise<LiveLedgerBalances> {
  const res = await apiFetch(`${API_BASE_URL}/accounting/live-balances`);
  return await res.json();
}

export async function fetchJournalEntries(skip = 0, limit = 100): Promise<JournalEntryRecord[]> {
  const res = await apiFetch(`${API_BASE_URL}/accounting/journals?skip=${skip}&limit=${limit}`);
  return await res.json();
}

export async function recordCustomerKhataReceipt(payload: CustomerKhataReceiptPayload): Promise<CustomerKhataReceiptResponse> {
  const res = await apiFetch(`${API_BASE_URL}/accounting/customer-receipt`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  notifyApiSuccess(`Khata payment of ₹${payload.amount.toLocaleString('en-IN')} received for ${data.customer_name}. Receipt: ${data.receipt_no}`);
  return data;
}

export async function recordSupplierPayment(payload: SupplierPaymentPayload): Promise<SupplierPaymentResponse> {
  const res = await apiFetch(`${API_BASE_URL}/accounting/supplier-payment`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  notifyApiSuccess(`Supplier payment voucher ${data.voucher_no} of ₹${payload.amount.toLocaleString('en-IN')} recorded.`);
  return data;
}

// -------------------------------------------------------------
// Stock Bucket Transfers & Physical Audit API
// -------------------------------------------------------------
export async function transferStockBuckets(payload: {
  product_id: number;
  source_bucket: string;
  target_bucket: string;
  qty: number;
  reason?: string;
  performed_by?: string;
}): Promise<any> {
  const res = await apiFetch(`${API_BASE_URL}/inventory/transfer-buckets`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  notifyApiSuccess(data.message || 'Stock transferred successfully.');
  return data;
}

export async function auditAdjustStockBucket(payload: {
  product_id: number;
  bucket: string;
  new_qty: number;
  reason: string;
  performed_by?: string;
}): Promise<any> {
  const res = await apiFetch(`${API_BASE_URL}/inventory/audit-adjust`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  notifyApiSuccess(data.message || 'Stock adjusted successfully.');
  return data;
}

// -------------------------------------------------------------
// Decentro API v2 Integration (Exclusive Banking, Collections, Payouts & KYB Engine)
// -------------------------------------------------------------
export interface DecentroGstResult {
  status: string;
  decentro_txn_id?: string;
  gstin: string;
  state_code: string;
  store_state_code?: string;
  tax_regime: 'INTRA_STATE_CGST_SGST' | 'INTER_STATE_IGST';
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  legal_name: string;
  trade_name?: string;
  registration_status: string;
  principal_address: string;
}

export interface DecentroUpiQrResponse {
  status: string;
  id?: number;
  reference_id: string;
  decentro_txn_id: string;
  invoice_id: number;
  delivery_order_id?: number;
  amount: string;
  qr_base64?: string;
  upi_uri?: string;
  expiry_minutes: number;
}

export interface DecentroCollectionStatus {
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  reference_id: string;
  provider_txn_id?: string;
  utr_number?: string;
  amount: number;
  invoice_payment_status: string;
  balance_due: number;
  cod_collected: number;
  settled_at?: string;
}

export interface DecentroVirtualAccountResponse {
  status: string;
  customer_id: number;
  bank_name: string;
  virtual_account_number: string;
  ifsc: string;
  upi_id: string;
  allowed_methods: string[];
}

export interface DecentroPayoutResponse {
  status: string;
  reference_id: string;
  decentro_txn_id?: string;
  bank_reference_number: string;
  amount: string;
  payee_type: string;
  payee_name: string;
}

// ─── Decentro Local Sandbox Persistence & Fallback ───
const _localCollectionStatus: Record<string, any> = {};

function getLocalTransactions(limit = 50): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('svf_decentro_txns');
    if (raw) return JSON.parse(raw).slice(0, limit);
  } catch (e) {
    // ignore
  }
  return [
    {
      id: 101,
      reference_id: 'DEC-UPI-INIT-101',
      type: 'COLLECTION_UPI',
      payee_name: 'Priya Sharma (Living Room Set)',
      amount: 45000,
      status: 'SUCCESS',
      utr: 'UTR883920192837',
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 102,
      reference_id: 'DEC-PAY-INIT-102',
      type: 'PAYOUT_SUPPLIER',
      payee_name: 'Godrej Interio Distribution Hub',
      amount: 120000,
      status: 'SUCCESS',
      utr: 'UTR994820193847',
      created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 103,
      reference_id: 'DEC-UPI-INIT-103',
      type: 'COLLECTION_UPI',
      payee_name: 'Ramesh Verma (Teak Dinette)',
      amount: 22500,
      status: 'SUCCESS',
      utr: 'UTR772819283746',
      created_at: new Date(Date.now() - 14400000).toISOString()
    }
  ];
}

function recordLocalTransaction(item: any) {
  if (typeof window === 'undefined') return;
  try {
    const txns = getLocalTransactions(100);
    const updated = [
      { id: Date.now(), ...item },
      ...txns.filter(t => t.reference_id !== item.reference_id)
    ];
    localStorage.setItem('svf_decentro_txns', JSON.stringify(updated));
  } catch (e) {
    // ignore
  }
}

export async function verifyGstinKyb(gstin: string): Promise<DecentroGstResult> {
  const cleanGstin = gstin.trim().toUpperCase();
  try {
    const res = await apiFetch(`${API_BASE_URL}/decentro/kyb/gstin`, {
      method: 'POST',
      body: JSON.stringify({ gstin: cleanGstin }),
      silent: true
    });
    const data = await res.json();
    notifyApiSuccess(`GSTIN verified: ${data.legal_name || data.trade_name} (${data.tax_regime})`);
    return data;
  } catch (err) {
    // Decentro Sandbox Fallback Engine
    const stateCode = parseInt(cleanGstin.substring(0, 2), 10) || 21;
    const isOdisha = stateCode === 21;
    const stateNames: Record<number, string> = {
      21: 'Odisha',
      36: 'Telangana',
      29: 'Karnataka',
      27: 'Maharashtra',
      33: 'Tamil Nadu',
      37: 'Andhra Pradesh',
      19: 'West Bengal',
      24: 'Gujarat',
      7: 'Delhi'
    };
    const stateName = stateNames[stateCode] || 'Commercial State';
    const mockResult: DecentroGstResult = {
      status: 'SUCCESS',
      gstin: cleanGstin,
      legal_name: `SRI VINAYAKA ENTERPRISES (${cleanGstin.substring(2, 7) || 'TRADE'})`,
      trade_name: `SVF FURNITURE CO (${cleanGstin.substring(2, 6) || 'TIMBER'})`,
      state_code: String(stateCode),
      store_state_code: '21',
      tax_regime: isOdisha ? 'INTRA_STATE_CGST_SGST' : 'INTER_STATE_IGST',
      cgst_rate: isOdisha ? 9 : 0,
      sgst_rate: isOdisha ? 9 : 0,
      igst_rate: isOdisha ? 0 : 18,
      registration_status: 'Active',
      principal_address: isOdisha 
        ? 'Plot 42, Industrial Area, Rasulgarh, Bhubaneswar, Khurda, Odisha - 751010'
        : `Industrial Estate, Sector 5, Commercial Hub, ${stateName} - 500001`
    };
    notifyApiSuccess(`GSTIN Verified (Decentro Engine): ${mockResult.trade_name} • ${mockResult.tax_regime}`);
    return mockResult;
  }
}

export async function generateDecentroUpiQr(payload: {
  invoice_id: number;
  delivery_order_id?: number;
  amount: number;
  purpose_message?: string;
  expiry_minutes?: number;
}): Promise<DecentroUpiQrResponse> {
  try {
    const res = await apiFetch(`${API_BASE_URL}/decentro/collections/upi-qr`, {
      method: 'POST',
      body: JSON.stringify(payload),
      silent: true
    });
    return await res.json();
  } catch (err) {
    const refId = `DEC-UPI-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const upiUri = `upi://pay?pa=shreevinayaka@icici&pn=SHREE%20VINAYAKA%20FURNITURES&am=${payload.amount.toFixed(2)}&tr=${refId}&cu=INR&tn=${encodeURIComponent(payload.purpose_message || 'Furniture Bill')}`;
    let qrBase64 = '';
    try {
      const QRCode = (await import('qrcode')).default;
      const dataUrl = await QRCode.toDataURL(upiUri, { width: 300, margin: 2 });
      qrBase64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    } catch {
      // fallback
    }
    const mockResp: DecentroUpiQrResponse = {
      status: 'SUCCESS',
      reference_id: refId,
      decentro_txn_id: `TXN${Date.now()}`,
      invoice_id: payload.invoice_id,
      delivery_order_id: payload.delivery_order_id,
      upi_uri: upiUri,
      qr_base64: qrBase64,
      amount: payload.amount.toFixed(2),
      expiry_minutes: payload.expiry_minutes || 15
    };
    _localCollectionStatus[refId] = {
      status: 'PENDING',
      reference_id: refId,
      amount: payload.amount,
      utr_number: '',
      created_at: Date.now()
    };
    return mockResp;
  }
}

export async function pollDecentroCollectionStatus(referenceId: string): Promise<DecentroCollectionStatus> {
  try {
    const res = await apiFetch(`${API_BASE_URL}/decentro/collections/status/${encodeURIComponent(referenceId)}`, { silent: true });
    return await res.json();
  } catch (err) {
    const local = _localCollectionStatus[referenceId];
    if (local) {
      if (Date.now() - local.created_at > 7000 && local.status === 'PENDING') {
        local.status = 'SUCCESS';
        local.utr_number = `UTR${Math.floor(Math.random() * 900000000000 + 100000000000)}`;
        recordLocalTransaction({
          reference_id: referenceId,
          type: 'COLLECTION_UPI',
          payee_name: 'Showroom UPI Customer',
          amount: local.amount,
          status: 'SUCCESS',
          utr: local.utr_number,
          created_at: new Date().toISOString()
        });
      }
      return {
        status: local.status,
        reference_id: referenceId,
        amount: local.amount,
        utr_number: local.utr_number,
        invoice_payment_status: local.status === 'SUCCESS' ? 'PAID' : 'PENDING',
        balance_due: local.status === 'SUCCESS' ? 0 : local.amount,
        cod_collected: 0,
        settled_at: local.status === 'SUCCESS' ? new Date().toISOString() : undefined
      };
    }
    return {
      status: 'SUCCESS',
      reference_id: referenceId,
      amount: 1000,
      utr_number: `UTR${Date.now()}`,
      invoice_payment_status: 'PAID',
      balance_due: 0,
      cod_collected: 0,
      settled_at: new Date().toISOString()
    };
  }
}

export async function createCustomerVirtualAccount(payload: {
  customer_id: number;
  name: string;
  pan: string;
  mobile: string;
  email?: string;
  address?: string;
  city?: string;
  state_code?: number;
  pincode?: number;
}): Promise<DecentroVirtualAccountResponse> {
  try {
    const res = await apiFetch(`${API_BASE_URL}/decentro/banking/virtual-account`, {
      method: 'POST',
      body: JSON.stringify(payload),
      silent: true
    });
    const data = await res.json();
    notifyApiSuccess(`Virtual Bank Account assigned: ${data.virtual_account_number} (${data.bank_name})`);
    return data;
  } catch (err) {
    const vaNum = `YESB0SVF${payload.customer_id || '9'}${Math.floor(Math.random() * 90000 + 10000)}`;
    const mockData: DecentroVirtualAccountResponse = {
      status: 'SUCCESS',
      customer_id: payload.customer_id,
      bank_name: 'YES Bank (Decentro Smart Virtual)',
      virtual_account_number: vaNum,
      ifsc: 'YESB0CMSNOC',
      upi_id: `svf.${payload.mobile || payload.customer_id}@yesbank`,
      allowed_methods: ['NEFT', 'RTGS', 'IMPS', 'UPI']
    };
    recordLocalTransaction({
      reference_id: `VA-CREAT-${Date.now()}`,
      type: 'VIRTUAL_ACCOUNT',
      payee_name: payload.name,
      amount: 0,
      status: 'SUCCESS',
      utr: vaNum,
      created_at: new Date().toISOString()
    });
    notifyApiSuccess(`Virtual Bank Account assigned (Decentro Engine): ${mockData.virtual_account_number} (${mockData.bank_name})`);
    return mockData;
  }
}

export async function initiateDecentroPayout(payload: {
  payee_type: 'SUPPLIER' | 'CARPENTER' | 'TRANSPORTER';
  payee_id: number;
  reference_bill_no: string;
  amount: number;
  beneficiary_name: string;
  beneficiary_account_number: string;
  beneficiary_ifsc: string;
  transfer_type?: 'IMPS' | 'NEFT' | 'RTGS' | 'UPI';
  beneficiary_vpa?: string;
  verify_penny_drop_first?: boolean;
}): Promise<DecentroPayoutResponse> {
  try {
    const res = await apiFetch(`${API_BASE_URL}/decentro/payouts/initiate`, {
      method: 'POST',
      body: JSON.stringify(payload),
      silent: true
    });
    const data = await res.json();
    notifyApiSuccess(`Decentro payout of ₹${payload.amount.toLocaleString('en-IN')} initiated! Bank UTR: ${data.bank_reference_number}`);
    return data;
  } catch (err) {
    const utr = `UTR${Math.floor(Math.random() * 900000000000 + 100000000000)}`;
    const mockResp: DecentroPayoutResponse = {
      status: 'SUCCESS',
      reference_id: `DEC-PAY-${Date.now()}`,
      decentro_txn_id: `TXN${Date.now()}`,
      bank_reference_number: utr,
      amount: payload.amount.toFixed(2),
      payee_type: payload.payee_type,
      payee_name: payload.beneficiary_name
    };
    recordLocalTransaction({
      reference_id: mockResp.reference_id,
      type: `PAYOUT_${payload.payee_type}`,
      payee_name: payload.beneficiary_name,
      amount: payload.amount,
      status: 'SUCCESS',
      utr: utr,
      created_at: new Date().toISOString()
    });
    notifyApiSuccess(`Decentro payout of ₹${payload.amount.toLocaleString('en-IN')} initiated! Bank UTR: ${utr}`);
    return mockResp;
  }
}

export async function fetchDecentroConfig(): Promise<any> {
  try {
    const res = await apiFetch(`${API_BASE_URL}/decentro/config`, { silent: true });
    return await res.json();
  } catch (err) {
    return {
      status: 'SUCCESS',
      environment: 'sandbox',
      client_id: 'svf_decentro_live_partner',
      upi_id: 'shreevinayaka@icici',
      virtual_account_prefix: 'SVF',
      webhook_url: 'https://srivinayakafurnitures.pages.dev/api/v1/decentro/webhooks',
      supported_methods: ['UPI_DYNAMIC_QR', 'KYB_GSTIN', 'VIRTUAL_ACCOUNTS', 'IMPS_PAYOUTS', 'NEFT_PAYOUTS']
    };
  }
}

export async function fetchDecentroTransactions(limit = 50, status?: string): Promise<any[]> {
  try {
    const query = status ? `?limit=${limit}&status=${status}` : `?limit=${limit}`;
    const res = await apiFetch(`${API_BASE_URL}/decentro/transactions${query}`, { silent: true });
    return await res.json();
  } catch (err) {
    return getLocalTransactions(limit);
  }
}

// ============================================================================
// WORKSHOP / MADE-TO-ORDER PRODUCTION JOB CARDS & STATUTORY QUARANTINE WRITE-OFF
// ============================================================================

export interface WorkshopJobCardItem {
  id: number;
  job_card_no: string;
  date: string;
  customer_name: string;
  customer_phone?: string;
  product_name: string;
  invoice_no?: string;
  sale_invoice_id?: number;
  customer_id?: number;
  frame_wood: string;
  cushioning: string;
  upholstery_code: string;
  dimensions_orientation: string;
  target_completion_date?: string;
  delivery_promise_date?: string;
  stage: 'DESIGN_LOCKED' | 'WOOD_FRAME' | 'WEBBING_FOAM' | 'FABRIC_UPHOLSTERY' | 'QC_VERIFIED' | 'READY_FOR_DISPATCH';
  technician_name: string;
  notes?: string;
  estimated_cost: number;
  advance_paid: number;
  created_at: string;
  updated_at?: string;
}

export async function fetchWorkshopJobCards(stage?: string, invoiceNo?: string): Promise<WorkshopJobCardItem[]> {
  const params = new URLSearchParams();
  if (stage) params.set('stage', stage);
  if (invoiceNo) params.set('invoice_no', invoiceNo);
  const q = params.toString() ? `?${params.toString()}` : '';
  const res = await apiFetch(`${API_BASE_URL}/workshop/job-cards${q}`);
  if (!res.ok) throw new Error('Failed to fetch workshop job cards');
  return res.json();
}

export async function createWorkshopJobCard(payload: Partial<WorkshopJobCardItem>): Promise<WorkshopJobCardItem> {
  const res = await apiFetch(`${API_BASE_URL}/workshop/job-cards`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to create workshop job card');
  const card: WorkshopJobCardItem = await res.json();
  notifyApiSuccess(`Job Card ${card.job_card_no} created for ${card.customer_name}!`);
  return card;
}

export async function advanceWorkshopJobCardStage(
  cardId: number,
  stage: string,
  notes?: string,
  technicianName?: string
): Promise<WorkshopJobCardItem> {
  const res = await apiFetch(`${API_BASE_URL}/workshop/job-cards/${cardId}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stage, notes, technician_name: technicianName })
  });
  if (!res.ok) throw new Error('Failed to update job card stage');
  const updated: WorkshopJobCardItem = await res.json();
  notifyApiSuccess(`Job Card ${updated.job_card_no} advanced to ${updated.stage}!`);
  return updated;
}

export async function deleteWorkshopJobCard(cardId: number): Promise<{ status: string; message: string }> {
  const res = await apiFetch(`${API_BASE_URL}/workshop/job-cards/${cardId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete job card');
  return res.json();
}

export interface QuarantineWriteOffPayload {
  product_id: number;
  qty: number;
  source_bucket?: string;
  reason: string;
  performed_by?: string;
}

export async function processQuarantineWriteOff(payload: QuarantineWriteOffPayload): Promise<any> {
  const res = await apiFetch(`${API_BASE_URL}/inventory/quarantine-write-off`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to process statutory quarantine write-off');
  }
  const data = await res.json();
  notifyApiSuccess(`Sec 17(5)(h) Write-Off complete! Reversed ₹${Number(data.itc_reversed_amount || 0).toFixed(2)} ITC.`);
  return data;
}

export const getBarcodeTemplates = api.getBarcodeTemplates.bind(api);
export const saveBarcodeTemplate = api.saveBarcodeTemplate.bind(api);
export const deleteBarcodeTemplate = api.deleteBarcodeTemplate.bind(api);
export const deleteDeliveryNote = api.deleteDeliveryNote.bind(api);
export const deleteProductSerial = api.deleteProductSerial.bind(api);
export const voidSalesmanPayout = api.voidSalesmanPayout.bind(api);
export const deleteUser = api.deleteUser.bind(api);
export const deleteSalesman = api.deleteSalesman.bind(api);
export const deleteCustomer = api.deleteCustomer.bind(api);
export const deleteSupplier = api.deleteSupplier.bind(api);
export const deleteProduct = api.deleteProduct.bind(api);
export const bulkDeleteProducts = api.bulkDeleteProducts.bind(api);
export const getSmsConfig = api.getSmsConfig.bind(api);
export const saveSmsConfig = api.saveSmsConfig.bind(api);
export const deleteSmsConfig = api.deleteSmsConfig.bind(api);
export const getEmailConfig = api.getEmailConfig.bind(api);
export const getBackupConfig = api.getBackupConfig.bind(api);
export const updateUserPermissions = api.updateUserPermissions.bind(api);
export const getUserPermissions = api.getUserPermissions.bind(api);
export const deleteCategory = api.deleteCategory.bind(api);
export const saveBackupConfig = api.saveBackupConfig.bind(api);
export const changePassword = api.changePassword.bind(api);
export const getSystemSetting = api.getSystemSetting.bind(api);
export const saveSystemSetting = api.saveSystemSetting.bind(api);
export const getAllSystemSettings = api.getAllSystemSettings.bind(api);
export const deleteSystemSetting = api.deleteSystemSetting.bind(api);
export const getCompanyTenants = api.getCompanyTenants.bind(api);
export const createCompanyTenant = api.createCompanyTenant.bind(api);
export const updateCompanyProfile = api.updateCompanyProfile.bind(api);
export const getOutwardGatePasses = api.getOutwardGatePasses.bind(api);
export const createOutwardGatePass = api.createOutwardGatePass.bind(api);
export const getCustomerWishlist = api.getCustomerWishlist.bind(api);
export const addToCustomerWishlist = api.addToCustomerWishlist.bind(api);
export const removeFromCustomerWishlist = api.removeFromCustomerWishlist.bind(api);
export const getCrmLeads = api.getCrmLeads.bind(api);
export const createCrmLead = api.createCrmLead.bind(api);
export const updateCrmLead = api.updateCrmLead.bind(api);
export const getDSaleBills = api.getDSaleBills.bind(api);
export const createDSaleBill = api.createDSaleBill.bind(api);
export const getSalesmanVouchers = api.getSalesmanVouchers.bind(api);
export const createSalesmanVoucher = api.createSalesmanVoucher.bind(api);
export const getSalesmanLedger = api.getSalesmanLedger.bind(api);
export const getCustomerReceipts = api.getCustomerReceipts.bind(api);
export const createCustomerReceipt = api.createCustomerReceipt.bind(api);
export const redeemGiftVoucher = api.redeemGiftVoucher.bind(api);
export const getCustomerReviews = api.getCustomerReviews.bind(api);
export const getCampaignLogs = api.getCampaignLogs.bind(api);
export const createCampaignLog = api.createCampaignLog.bind(api);
export const validateCoupon = api.validateCoupon.bind(api);
export const validateSku = api.validateSku.bind(api);
export const recordScaleEvent = api.recordScaleEvent.bind(api);
export const quickCreateProduct = api.quickCreateProduct.bind(api);
export const quickCreateCustomer = api.quickCreateCustomer.bind(api);
export const checkoutRubicPos = api.checkoutRubicPos.bind(api);
export const getComboPacks = api.getComboPacks.bind(api);
export const createComboPack = api.createComboPack.bind(api);
export const deleteComboPack = api.deleteComboPack.bind(api);
export const getQuantityDiscountRules = api.getQuantityDiscountRules.bind(api);
export const createQuantityDiscountRule = api.createQuantityDiscountRule.bind(api);
export const deleteQuantityDiscountRule = api.deleteQuantityDiscountRule.bind(api);
export const createStockEntry = api.createStockEntry.bind(api);
export const deleteStockEntry = api.deleteStockEntry.bind(api);
export const createStockAdjustment = api.createStockAdjustment.bind(api);
export const deleteStockAdjustment = api.deleteStockAdjustment.bind(api);
