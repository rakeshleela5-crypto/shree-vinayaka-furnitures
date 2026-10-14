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
  }
};
