from sqlalchemy.orm import Session
from app.models.category import Category
from app.models.furniture import Furniture

INITIAL_CATEGORIES = [
    {
        "name": "Living Room",
        "slug": "living-room",
        "description": "Elegant handcrafted sofas, coffee tables, and lounger sets built for family comfort.",
        "icon": "Armchair",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80"
    },
    {
        "name": "Bedroom",
        "slug": "bedroom",
        "description": "Premium king & queen beds, solid wood wardrobes, and bedside nightstands.",
        "icon": "BedDouble",
        "image_url": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80"
    },
    {
        "name": "Dining Room",
        "slug": "dining-room",
        "description": "Solid teak and sheesham wood dining tables with ergonomically cushioned chairs.",
        "icon": "Utensils",
        "image_url": "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80"
    },
    {
        "name": "Home Office",
        "slug": "home-office",
        "description": "Ergonomic work desks, executive leatherette chairs, and functional bookshelf units.",
        "icon": "Briefcase",
        "image_url": "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80"
    },
    {
        "name": "Custom Teak & Mandir",
        "slug": "custom-teak",
        "description": "Custom pooja mandirs, temple units, and bespoke artisan wood creations.",
        "icon": "Sparkles",
        "image_url": "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80"
    }
]

INITIAL_FURNITURE = [
    {
        "title": "Royal Heritage Teak 3+1+1 Sofa Set",
        "slug": "royal-heritage-teak-sofa-set",
        "category_slug": "living-room",
        "description": "Mastercrafted from 100% Grade-A Burma Teak wood with high-density 40-D foam cushioning and velvet stain-resistant upholstery. Includes 1 three-seater and 2 single armchairs.",
        "price": 54999.0,
        "original_price": 68000.0,
        "material": "Grade-A Solid Teak Wood & High-Density Foam",
        "dimensions": "Three-Seater: 78\"L x 34\"D x 36\"H | Single: 34\"L x 34\"D x 36\"H",
        "color": "Warm Walnut & Deep Royal Teal",
        "warranty": "10 Years Wood & Anti-Termite Warranty",
        "in_stock": True,
        "is_featured": True,
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
        "rating": 4.9,
        "reviews_count": 48
    },
    {
        "title": "Aura Sheesham 6-Seater Solid Dining Set",
        "slug": "aura-sheesham-6-seater-dining-set",
        "category_slug": "dining-room",
        "description": "Naturally grained pure Sheesham wood dining table with 6 comfortably contoured high-back chairs. Coated with food-safe moisture-resistant lacquer finish.",
        "price": 38500.0,
        "original_price": 46000.0,
        "material": "Pure Sheesham Wood (Indian Rosewood)",
        "dimensions": "Table: 60\"L x 36\"W x 30\"H | Chair: 18\"W x 18\"D x 38\"H",
        "color": "Honey Oak Gloss",
        "warranty": "5 Years Structural Warranty",
        "in_stock": True,
        "is_featured": True,
        "image_url": "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80",
        "rating": 4.8,
        "reviews_count": 32
    },
    {
        "title": "Grandeur King Size Hydraulic Bed with Headboard Storage",
        "slug": "grandeur-king-hydraulic-storage-bed",
        "category_slug": "bedroom",
        "description": "Heavy-duty engineered hardwood king size bed with German pneumatic lift pistons for effortless underbed storage. Plush tufted headboard for reading comfort.",
        "price": 42999.0,
        "original_price": 52000.0,
        "material": "High-Grade Engineered Hardwood & Fabric Tufting",
        "dimensions": "78\"W x 82\"L x 48\"H (Mattress Size: 72\"x78\")",
        "color": "Smoked Charcoal & Warm Beige",
        "warranty": "5 Years Hydraulic Mechanism & Frame Warranty",
        "in_stock": True,
        "is_featured": True,
        "image_url": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
        "rating": 4.9,
        "reviews_count": 56
    },
    {
        "title": "Vinayaka Artisan Hand-Carved Teak Pooja Mandir",
        "slug": "vinayaka-artisan-teak-pooja-mandir",
        "category_slug": "custom-teak",
        "description": "Sacred home temple custom carved with intricate traditional bells, dome gopuram, brass handles, pull-out bhog tray, and dedicated storage drawers.",
        "price": 31500.0,
        "original_price": 39000.0,
        "material": "100% Solid CP Teak Wood with Brass Accents",
        "dimensions": "36\"W x 20\"D x 54\"H",
        "color": "Traditional Rosewood Antique Gloss",
        "warranty": "Lifetime Termite Resistance",
        "in_stock": True,
        "is_featured": True,
        "image_url": "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80",
        "rating": 5.0,
        "reviews_count": 64
    },
    {
        "title": "Nordic Minimalist Floating TV Entertainment Unit",
        "slug": "nordic-minimalist-floating-tv-unit",
        "category_slug": "living-room",
        "description": "Wall-mounted sleek media console with hidden cable pass-through, soft-close hydraulic drop-down doors, and ambient back-LED light slot. Supports up to 75-inch TVs.",
        "price": 14999.0,
        "original_price": 19500.0,
        "material": "Water-Resistant HDHMR with Matte Laminate",
        "dimensions": "72\"L x 14\"D x 12\"H",
        "color": "Matte White & Natural Acacia",
        "warranty": "3 Years Warranty",
        "in_stock": True,
        "is_featured": False,
        "image_url": "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
        "rating": 4.7,
        "reviews_count": 21
    },
    {
        "title": "ErgoPro Executive High-Back Mesh Desk Chair",
        "slug": "ergopro-executive-high-back-mesh-chair",
        "category_slug": "home-office",
        "description": "BIFMA certified multi-tilt executive chair with dynamic lumbar support, 3D adjustable armrests, breathable Korean mesh back, and heavy-duty chrome wheelbase.",
        "price": 11800.0,
        "original_price": 16000.0,
        "material": "Breathable Mesh, Molded Foam & Steel Base",
        "dimensions": "26\"W x 26\"D x 46\"-50\"H",
        "color": "Jet Black & Chrome",
        "warranty": "3 Years On-Site Warranty",
        "in_stock": True,
        "is_featured": False,
        "image_url": "https://images.unsplash.com/photo-1580481077195-c3a821a58875?auto=format&fit=crop&w=800&q=80",
        "rating": 4.8,
        "reviews_count": 39
    },
    {
        "title": "Elegance 4-Door Wardrobe with Dressing Mirror",
        "slug": "elegance-4-door-wardrobe-mirror",
        "category_slug": "bedroom",
        "description": "Spacious wardrobe with dual full-length dressing mirrors, internal security locker, multiple hanging rails, and soft-closing hinges.",
        "price": 36000.0,
        "original_price": 44000.0,
        "material": "Commercial Grade Marine Plywood with PU Polish",
        "dimensions": "72\"W x 22\"D x 84\"H",
        "color": "Rich Teak Woodgrain",
        "warranty": "7 Years Comprehensive Warranty",
        "in_stock": True,
        "is_featured": False,
        "image_url": "https://images.unsplash.com/photo-1558997519-83ea9252def8?auto=format&fit=crop&w=800&q=80",
        "rating": 4.7,
        "reviews_count": 19
    },
    {
        "title": "Urban Teak & Iron Industrial Bookshelf",
        "slug": "urban-teak-iron-bookshelf",
        "category_slug": "home-office",
        "description": "5-tier open display shelf combining thick solid teak wood slabs with matte powder-coated wrought iron architectural ladders.",
        "price": 12500.0,
        "original_price": 15500.0,
        "material": "Solid Teak Wood & Powder-Coated Steel",
        "dimensions": "36\"W x 15\"D x 72\"H",
        "color": "Rustic Teak & Industrial Black",
        "warranty": "5 Years Warranty",
        "in_stock": True,
        "is_featured": False,
        "image_url": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
        "rating": 4.9,
        "reviews_count": 15
    }
]

def seed_database(db: Session):
    # Seed categories if table is empty
    cat_map = {}
    for cat_data in INITIAL_CATEGORIES:
        existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
        if not existing:
            cat = Category(**cat_data)
            db.add(cat)
            db.commit()
            db.refresh(cat)
            cat_map[cat.slug] = cat.id
        else:
            cat_map[existing.slug] = existing.id

    # Seed furniture items if table is empty
    for item_data in INITIAL_FURNITURE:
        existing = db.query(Furniture).filter(Furniture.slug == item_data["slug"]).first()
        if not existing:
            cat_slug = item_data.pop("category_slug", None)
            category_id = cat_map.get(cat_slug)
            furniture = Furniture(**item_data, category_id=category_id)
            db.add(furniture)
            db.commit()
            db.refresh(furniture)
