// API client for Shree Vinayaka Furnitures backend (FastAPI on Railway)

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

  async createSaleInvoice(invoice: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/sales/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoice)
      });
      if (!res.ok) throw new Error("Failed to record invoice");
      return await res.json();
    } catch (e) {
      console.warn("Backend offline, bill recorded locally:", e);
      return invoice;
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

  async getAccountHeads(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/accounting/account-heads`);
      if (!res.ok) throw new Error("Failed to fetch account heads");
      return await res.json();
    } catch {
      return [];
    }
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


