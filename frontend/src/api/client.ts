// API client for Shree Vinayaka Furnitures backend (FastAPI on Railway)
import { syncManager } from './syncManager';
export { syncManager };

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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

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

  // ==========================================
  // ERP & POS API METHODS
  // ==========================================
  async getProducts(search?: string): Promise<any[]> {
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`${API_BASE_URL}/products/${q}`);
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
    const res = await fetch(`${API_BASE_URL}/products/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      console.warn("Backend updateProductPrice failed:", e);
      throw e;
    }
  },

  async bulkImportProducts(products: any[]): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/products/bulk-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(products)
      });
      if (!res.ok) throw new Error("Bulk import failed");
      return await res.json();
    } catch (e) {
      console.warn("Backend bulk import failed or offline:", e);
      return { created: products.length, updated: 0, offline: true };
    }
  },

  async getCustomers(search?: string): Promise<any[]> {
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`${API_BASE_URL}/customers/${q}`);
      if (!res.ok) throw new Error("Failed to fetch customers");
      return await res.json();
    } catch {
      return [];
    }
  },

  async createCustomer(customer: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/customers/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customer)
    });
    return await res.json();
  },

  async getSuppliers(search?: string): Promise<any[]> {
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`${API_BASE_URL}/suppliers/${q}`);
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      return await res.json();
    } catch {
      return [];
    }
  },

  async getNextInvoiceNo(prefix = 'SVF'): Promise<string> {
    try {
      const res = await fetch(`${API_BASE_URL}/sales/next-invoice-no?prefix=${encodeURIComponent(prefix)}`);
      if (!res.ok) throw new Error("Failed to fetch next invoice number");
      const data = await res.json();
      return data.next_invoice_no;
    } catch {
      return syncManager.generateFallbackInvoiceNo(prefix);
    }
  },

  async getSalesInvoices(skip = 0, limit = 100): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/sales/?skip=${skip}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch sales invoices");
      return await res.json();
    } catch {
      return [];
    }
  },

  async createSaleInvoice(invoice: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/sales/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoice)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn("Backend unreachable; enqueued invoice into offline sync queue:", e);
      syncManager.enqueue('SALE_INVOICE', `${API_BASE_URL}/sales/`, 'POST', invoice);
      return invoice;
    }
  },

  async voidSaleInvoice(invoiceId: string | number): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/sales/${invoiceId}/void`, {
        method: "POST"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn("Backend voidSaleInvoice error; enqueuing offline void request:", e);
      syncManager.enqueue('VOID_INVOICE', `${API_BASE_URL}/sales/${invoiceId}/void`, 'POST', {});
      return { status: "QUEUED", invoice_id: invoiceId };
    }
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
    try {
      const res = await fetch(`${API_BASE_URL}/sales/estimates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(estimate)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn("Backend unreachable; enqueued estimate into offline sync queue:", e);
      syncManager.enqueue('ESTIMATE', `${API_BASE_URL}/sales/estimates`, 'POST', estimate);
      return estimate;
    }
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
    try {
      const res = await fetch(`${API_BASE_URL}/sales/delivery-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dn)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn("Backend unreachable; enqueued delivery note into offline sync queue:", e);
      syncManager.enqueue('DELIVERY_NOTE', `${API_BASE_URL}/sales/delivery-notes`, 'POST', dn);
      return dn;
    }
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
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
      });
      return await res.json();
    } catch (e) {
      console.warn("Product updated locally, backend error:", e);
      return product;
    }
  },

  async updateCustomer(id: string | number, customer: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer)
      });
      return await res.json();
    } catch (e) {
      console.warn("Customer updated locally, backend error:", e);
      return customer;
    }
  },

  async createPurchase(purchase: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/purchases/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purchase)
      });
      if (!res.ok) throw new Error("Failed to record purchase invoice");
      return await res.json();
    } catch (e) {
      console.warn("Backend offline, purchase inward kept locally:", e);
      return purchase;
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

  async payoutSalesman(id: number | string, payload: { amount: number; payment_mode?: string; remarks?: string }): Promise<any> {
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

  async createStockAdjustment(payload: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/stock-adjustments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to record stock adjustment");
      return await res.json();
    } catch (e) {
      console.warn("Backend createStockAdjustment error:", e);
      return payload;
    }
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
      const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete product");
      return await res.json();
    } catch (e) {
      console.warn("Backend deleteProduct error:", e);
      return null;
    }
  },

  async deleteCustomer(customerId: number | string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
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
      const res = await fetch(`${API_BASE_URL}/customers/${customerId}/ledger`);
      if (!res.ok) throw new Error("Failed to fetch customer ledger");
      return await res.json();
    } catch {
      return [];
    }
  },

  async addCustomerLedger(customerId: number | string, entry: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/customers/${customerId}/ledger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry)
      });
      if (!res.ok) throw new Error("Failed to post ledger entry");
      return await res.json();
    } catch (e) {
      console.warn("Backend addCustomerLedger error:", e);
      return entry;
    }
  },

  async getCustomerLoyalty(customerId: number | string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/customers/${customerId}/loyalty`);
      if (!res.ok) throw new Error("Failed to get loyalty");
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateCustomerLoyalty(customerId: number | string, data: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/customers/${customerId}/loyalty`, {
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

  async deleteSupplier(supplierId: number): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/suppliers/${supplierId}`, {
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
        customer_name: quotation.customer_name || quotation.customerName || 'Walk-in Client',
        customer_phone: quotation.customer_phone || quotation.customerPhone || null,
        subtotal: Number(quotation.subtotal ?? quotation.subTotal ?? 0),
        tax_total: Number(quotation.tax_total ?? quotation.taxTotal ?? 0),
        discount_total: Number(quotation.discount_total ?? quotation.discountTotal ?? 0),
        grand_total: Number(quotation.grand_total ?? quotation.grandTotal ?? 0),
        items_json: typeof quotation.items === 'string' ? quotation.items : JSON.stringify(quotation.items || []),
        status: quotation.status || 'Draft',
        valid_until: quotation.valid_until || quotation.validUntil || null,
        notes: quotation.notes || null
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
      const res = await fetch(`${API_BASE_URL}/sales/eway-bills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save e-way bill");
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
      const res = await fetch(`${API_BASE_URL}/inventory/combo-packs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pack)
      });
      if (!res.ok) throw new Error("Failed to create combo pack");
      return await res.json();
    } catch (e) {
      console.warn("Backend createComboPack error:", e);
      return pack;
    }
  },

  async deleteComboPack(packId: number): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/combo-packs/${packId}`, {
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

  async deletePurchaseReturn(returnId: string | number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/returns/purchases/${returnId}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to delete purchase return");
    }
    return await res.json();
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
  }
};

/**
 * Universal CSV export utility for reports and data grids
 */
export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
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

export function mapBackendProductToFrontend(bp: any): any {
  return {
    id: String(bp.id),
    pCode: bp.p_code || bp.pCode || `P-${bp.id}`,
    name: bp.name,
    purchasePrice: bp.purchase_price ?? bp.purchasePrice ?? 0,
    cessPercent: bp.cess_percent ?? bp.cessPercent ?? 0,
    openingStock: bp.opening_stock ?? bp.openingStock ?? 0,
    barcode: bp.barcode,
    mrp: bp.mrp ?? 0,
    retailPrice: bp.retail_price ?? bp.retailPrice ?? 0,
    wholesalePrice: bp.wholesale_price ?? bp.wholesalePrice ?? 0,
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
    variants: bp.variants || [],
    batches: bp.batches || []
  };
}

export function mapFrontendProductToBackend(fp: any): any {
  return {
    name: fp.name,
    p_code: fp.pCode || fp.p_code || `P-${fp.id || Date.now()}`,
    barcode: String(fp.barcode || ''),
    purchase_price: Number(fp.purchasePrice) || 0,
    mrp: Number(fp.mrp) || 0,
    retail_price: Number(fp.retailPrice) || 0,
    wholesale_price: Number(fp.wholesalePrice) || 0,
    cess_percent: Number(fp.cessPercent) || 0,
    opening_stock: Number(fp.openingStock) || 0,
    current_stock: Number(fp.currentStock ?? fp.openingStock) || 0,
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
    is_active: true
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
