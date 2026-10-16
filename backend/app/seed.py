from sqlalchemy.orm import Session
import datetime
from app.models.category import Category
from app.models.furniture import Furniture
from app.models.company import CompanyProfile, DocumentPrefixSuffix
from app.models.user import User, UserControlPermission, Salesman
from app.models.accounting import AccountHead
from app.models.customer import Customer
from app.models.supplier import Supplier
from app.models.product import Product, ProductBatch, ProductVariant
from app.models.discounts import Coupon, GiftVoucher, BarcodeTemplate

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
    # 1. Seed categories
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

    # 2. Seed furniture items
    for item_data in INITIAL_FURNITURE:
        existing = db.query(Furniture).filter(Furniture.slug == item_data["slug"]).first()
        if not existing:
            cat_slug = item_data.pop("category_slug", None)
            category_id = cat_map.get(cat_slug)
            furniture = Furniture(**item_data, category_id=category_id)
            db.add(furniture)
            db.commit()
            db.refresh(furniture)

    # 3. Seed Company Profile
    comp = db.query(CompanyProfile).first()
    if not comp:
        comp = CompanyProfile(
            company_name="Shree Vinayaka Furnitures",
            address="Pooja Building, Main Road, Cheruvathur",
            city="Kasaragod",
            state="Kerala",
            state_code="32",
            pincode="671313",
            phone="+91 94474 12345",
            email="contact@shreevinayakafurnitures.com",
            gstin="32AAACS1234A1Z5",
            currency_symbol="₹",
            financial_year="2024-2025",
            loyalty_per_point_value=0.10,
            bank_name="HDFC Bank Ltd",
            bank_ac_no="50200012345678",
            bank_ifsc="HDFC0001234",
            bank_branch="Cheruvathur Branch",
            invoice_header_note="Shree Vinayaka Furnitures - Handcrafted Teak & Modern Furniture Excellence",
            invoice_footer_note="Goods once sold are covered under 1-year service warranty. Thank you for your business!"
        )
        db.add(comp)
        db.commit()

    # 4. Seed Document Prefixes
    prefixes = [
        {"doc_type": "Sale", "prefix": "SVF-INV-", "suffix": "/24-25", "next_number": 101, "padding_zeros": 4},
        {"doc_type": "Purchase", "prefix": "SVF-PUR-", "suffix": "/24-25", "next_number": 51, "padding_zeros": 4},
        {"doc_type": "Estimate", "prefix": "SVF-EST-", "suffix": "/24-25", "next_number": 21, "padding_zeros": 4},
        {"doc_type": "SaleReturn", "prefix": "SVF-SR-", "suffix": "/24-25", "next_number": 1, "padding_zeros": 4},
        {"doc_type": "PurchaseReturn", "prefix": "SVF-PR-", "suffix": "/24-25", "next_number": 1, "padding_zeros": 4},
        {"doc_type": "Expense", "prefix": "SVF-EXP-", "suffix": "/24-25", "next_number": 15, "padding_zeros": 4},
    ]
    for p in prefixes:
        existing = db.query(DocumentPrefixSuffix).filter(DocumentPrefixSuffix.doc_type == p["doc_type"]).first()
        if not existing:
            db.add(DocumentPrefixSuffix(**p))
    db.commit()

    # 5. Seed Users & Permissions
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            full_name="Administrator",
            password_hash="admin",
            user_type="Admin",
            email="admin@shreevinayakafurnitures.com",
            contact_no="9447412345",
            active=True
        )
        db.add(admin_user)
        db.flush()
        admin_perm = UserControlPermission(
            user_id=admin_user.id,
            can_edit_sale_price=True,
            can_give_discount=True,
            can_void_bill=True,
            can_access_records=True,
            can_access_reports=True,
            can_access_master=True,
            can_access_settings=True,
            can_access_backup=True
        )
        db.add(admin_perm)
        db.commit()

    cashier_user = db.query(User).filter(User.username == "cashier").first()
    if not cashier_user:
        cashier_user = User(
            username="cashier",
            full_name="POS Billing Counter",
            password_hash="cashier123",
            user_type="Cashier",
            email="pos@shreevinayakafurnitures.com",
            contact_no="9847123456",
            active=True
        )
        db.add(cashier_user)
        db.flush()
        cashier_perm = UserControlPermission(
            user_id=cashier_user.id,
            can_edit_sale_price=False,
            can_give_discount=True,
            can_void_bill=False,
            can_access_records=True,
            can_access_reports=False,
            can_access_master=False,
            can_access_settings=False,
            can_access_backup=False
        )
        db.add(cashier_perm)
        db.commit()

    # 6. Seed Salesmen
    salesmen_data = [
        {"code": "SM-01", "name": "Ramesh Kumar", "phone": "+91 98460 11223", "commission_percent": 2.0},
        {"code": "SM-02", "name": "Suresh Babu", "phone": "+91 98460 44556", "commission_percent": 2.5},
        {"code": "SM-03", "name": "Vinod Nair", "phone": "+91 98460 77889", "commission_percent": 2.0},
    ]
    for sm in salesmen_data:
        existing = db.query(Salesman).filter(Salesman.code == sm["code"]).first()
        if not existing:
            db.add(Salesman(**sm))
    db.commit()

    # 7. Seed Standard Chart of Account Heads
    account_heads = [
        {"name": "Cash in Hand", "under_group": "Cash-in-hand"},
        {"name": "HDFC Current Account", "under_group": "Bank Accounts"},
        {"name": "SBI Commercial A/c", "under_group": "Bank Accounts"},
        {"name": "Sales Account", "under_group": "Sales Accounts"},
        {"name": "Purchase Account", "under_group": "Purchase Accounts"},
        {"name": "Discount Allowed", "under_group": "Indirect Expenses"},
        {"name": "Discount Received", "under_group": "Indirect Incomes"},
        {"name": "Showroom Electricity Charges", "under_group": "Indirect Expenses"},
        {"name": "Showroom Rent", "under_group": "Indirect Expenses"},
        {"name": "Staff Salary & Wages", "under_group": "Indirect Expenses"},
        {"name": "Freight & Transport Charges", "under_group": "Direct Expenses"},
        {"name": "CGST Output 9%", "under_group": "Duties & Taxes"},
        {"name": "SGST Output 9%", "under_group": "Duties & Taxes"},
        {"name": "IGST Output 18%", "under_group": "Duties & Taxes"},
    ]
    for ah in account_heads:
        existing = db.query(AccountHead).filter(AccountHead.name == ah["name"]).first()
        if not existing:
            db.add(AccountHead(**ah))
    db.commit()

    # 8. Seed Customers
    customers_data = [
        {
            "code": "C-0001",
            "name": "Walk-in Cash Customer",
            "phone": "9999999999",
            "city": "Cheruvathur",
            "credit_limit": 0.0,
            "opening_balance": 0.0,
            "loyalty_points": 50.0
        },
        {
            "code": "C-0002",
            "name": "Rajesh Sharma (Studio Architects)",
            "phone": "9847055112",
            "email": "rajesh@studioarch.com",
            "city": "Kannur",
            "gstin": "32AAAAA0000A1Z5",
            "credit_limit": 150000.0,
            "opening_balance": 12500.0,
            "loyalty_points": 420.0
        },
        {
            "code": "C-0003",
            "name": "Dr. Ananya Varma",
            "phone": "9847199223",
            "city": "Kasaragod",
            "credit_limit": 75000.0,
            "opening_balance": 0.0,
            "loyalty_points": 180.0
        },
        {
            "code": "C-0004",
            "name": "Malabar Builders & Developers",
            "phone": "9847233445",
            "email": "accounts@malabarbuilders.in",
            "city": "Kozhikode",
            "gstin": "32BBBBB1111B1Z2",
            "credit_limit": 300000.0,
            "opening_balance": 45000.0,
            "loyalty_points": 850.0
        }
    ]
    for c in customers_data:
        existing = db.query(Customer).filter(Customer.code == c["code"]).first()
        if not existing:
            db.add(Customer(**c))
    db.commit()

    # 9. Seed Suppliers
    suppliers_data = [
        {
            "code": "S-0001",
            "name": "Nilambur Teak Wood Millers",
            "company_name": "Nilambur Forest Products Pvt Ltd",
            "gstin": "32AABCN1234P1Z3",
            "contact_no": "9847311223",
            "city": "Nilambur",
            "credit_period_days": 45,
            "opening_balance": 85000.0
        },
        {
            "code": "S-0002",
            "name": "Apex Foam & Mattress Fabricators",
            "company_name": "Apex Comfort Technologies",
            "gstin": "33AABCA5678Q1Z4",
            "contact_no": "9847422334",
            "city": "Coimbatore",
            "credit_period_days": 30,
            "opening_balance": 32000.0
        },
        {
            "code": "S-0003",
            "name": "Godrej Architectural Hardware",
            "company_name": "Godrej & Boyce Mfg Co",
            "gstin": "27AAACG0561D1ZT",
            "contact_no": "9847533445",
            "city": "Mumbai",
            "credit_period_days": 60,
            "opening_balance": 14500.0
        }
    ]
    for s in suppliers_data:
        existing = db.query(Supplier).filter(Supplier.code == s["code"]).first()
        if not existing:
            db.add(Supplier(**s))
    db.commit()

    # 10. Seed POS Retail Products
    products_data = [
        {
            "p_code": "PRD-001",
            "name": "Royal Heritage Teak 3+1+1 Sofa Set",
            "barcode": "8901001",
            "purchase_price": 38000.0,
            "mrp": 68000.0,
            "retail_price": 54999.0,
            "wholesale_price": 48000.0,
            "opening_stock": 12.0,
            "current_stock": 12.0,
            "min_stock": 3.0,
            "sales_unit": "Set",
            "hsn_code": "9401",
            "cgst": 9.0,
            "sgst": 9.0,
            "igst": 18.0,
            "godown": "Main Showroom",
            "rack": "Hall A",
            "salesman_commission": 2.0,
            "loyalty_value": 200.0
        },
        {
            "p_code": "PRD-002",
            "name": "Aura Sheesham 6-Seater Solid Dining Set",
            "barcode": "8901002",
            "purchase_price": 26000.0,
            "mrp": 46000.0,
            "retail_price": 38500.0,
            "wholesale_price": 34000.0,
            "opening_stock": 8.0,
            "current_stock": 8.0,
            "min_stock": 2.0,
            "sales_unit": "Set",
            "hsn_code": "9403",
            "cgst": 9.0,
            "sgst": 9.0,
            "igst": 18.0,
            "godown": "Main Showroom",
            "rack": "Hall B",
            "salesman_commission": 2.0,
            "loyalty_value": 150.0
        },
        {
            "p_code": "PRD-003",
            "name": "Grandeur King Size Hydraulic Bed",
            "barcode": "8901003",
            "purchase_price": 29000.0,
            "mrp": 52000.0,
            "retail_price": 42999.0,
            "wholesale_price": 38000.0,
            "opening_stock": 15.0,
            "current_stock": 15.0,
            "min_stock": 4.0,
            "sales_unit": "Pcs",
            "hsn_code": "9403",
            "cgst": 9.0,
            "sgst": 9.0,
            "igst": 18.0,
            "godown": "Godown 1",
            "rack": "Bay 3",
            "salesman_commission": 2.5,
            "loyalty_value": 180.0
        },
        {
            "p_code": "PRD-004",
            "name": "Vinayaka Artisan Hand-Carved Pooja Mandir",
            "barcode": "8901004",
            "purchase_price": 21000.0,
            "mrp": 39000.0,
            "retail_price": 31500.0,
            "wholesale_price": 28000.0,
            "opening_stock": 6.0,
            "current_stock": 6.0,
            "min_stock": 2.0,
            "sales_unit": "Pcs",
            "hsn_code": "9403",
            "cgst": 9.0,
            "sgst": 9.0,
            "igst": 18.0,
            "godown": "Main Showroom",
            "rack": "Mandir Corner",
            "salesman_commission": 3.0,
            "loyalty_value": 120.0
        },
        {
            "p_code": "PRD-005",
            "name": "Nordic Minimalist Floating TV Unit",
            "barcode": "8901005",
            "purchase_price": 9500.0,
            "mrp": 19500.0,
            "retail_price": 14999.0,
            "wholesale_price": 13000.0,
            "opening_stock": 20.0,
            "current_stock": 20.0,
            "min_stock": 5.0,
            "sales_unit": "Pcs",
            "hsn_code": "9403",
            "cgst": 9.0,
            "sgst": 9.0,
            "igst": 18.0,
            "godown": "Godown 2",
            "rack": "Rack 12",
            "salesman_commission": 1.5,
            "loyalty_value": 50.0
        },
        {
            "p_code": "PRD-006",
            "name": "ErgoPro Executive High-Back Mesh Chair",
            "barcode": "8901006",
            "purchase_price": 7200.0,
            "mrp": 16000.0,
            "retail_price": 11800.0,
            "wholesale_price": 10000.0,
            "opening_stock": 25.0,
            "current_stock": 25.0,
            "min_stock": 5.0,
            "sales_unit": "Pcs",
            "hsn_code": "9401",
            "cgst": 9.0,
            "sgst": 9.0,
            "igst": 18.0,
            "godown": "Main Showroom",
            "rack": "Office Sec",
            "salesman_commission": 2.0,
            "loyalty_value": 40.0
        },
        {
            "p_code": "PRD-007",
            "name": "Elegance 4-Door Wardrobe with Mirror",
            "barcode": "8901007",
            "purchase_price": 24000.0,
            "mrp": 44000.0,
            "retail_price": 36000.0,
            "wholesale_price": 31000.0,
            "opening_stock": 7.0,
            "current_stock": 7.0,
            "min_stock": 2.0,
            "sales_unit": "Pcs",
            "hsn_code": "9403",
            "cgst": 9.0,
            "sgst": 9.0,
            "igst": 18.0,
            "godown": "Godown 1",
            "rack": "Bay 1",
            "salesman_commission": 2.0,
            "loyalty_value": 140.0
        },
        {
            "p_code": "PRD-008",
            "name": "Solid Brass Cabinet Handle 6-Inch (Pack of 4)",
            "barcode": "8901008",
            "purchase_price": 320.0,
            "mrp": 750.0,
            "retail_price": 580.0,
            "wholesale_price": 480.0,
            "opening_stock": 120.0,
            "current_stock": 120.0,
            "min_stock": 20.0,
            "sales_unit": "Box",
            "sales_alt_unit": "Pcs",
            "conv_ratio": 4.0,
            "hsn_code": "8302",
            "cgst": 9.0,
            "sgst": 9.0,
            "igst": 18.0,
            "godown": "Fitting Room",
            "rack": "Bin 04",
            "salesman_commission": 1.0,
            "loyalty_value": 5.0
        }
    ]
    for prd in products_data:
        existing = db.query(Product).filter(Product.barcode == prd["barcode"]).first()
        if not existing:
            p_obj = Product(**prd)
            db.add(p_obj)
            db.flush()
            # Also add initial batch for batch tracking (Video 09 & 14)
            batch = ProductBatch(
                product_id=p_obj.id,
                batch_no=f"B-{datetime.datetime.utcnow().year}-01",
                barcode=p_obj.barcode,
                mrp=p_obj.mrp,
                retail_price=p_obj.retail_price,
                wholesale_price=p_obj.wholesale_price or p_obj.retail_price,
                purchase_rate=p_obj.purchase_price,
                available_qty=p_obj.current_stock,
                mfg_date="2024-01-15",
                info="Fresh Showroom Stock"
            )
            db.add(batch)
    db.commit()

    # 11. Seed Promotional Coupons
    coupons_data = [
        {
            "code": "FESTIVE500",
            "title": "Festive Season Flat ₹500 Instant Discount",
            "discount_type": "FlatAmount",
            "discount_value": 500.0,
            "min_bill_amount": 10000.0,
            "start_date": "2024-01-01",
            "end_date": "2026-12-31",
            "usage_limit": 500,
            "used_count": 12,
            "is_active": True
        },
        {
            "code": "DIWALI10",
            "title": "Special 10% Festive Discount",
            "discount_type": "Percentage",
            "discount_value": 10.0,
            "min_bill_amount": 25000.0,
            "max_discount_amount": 5000.0,
            "start_date": "2024-01-01",
            "end_date": "2026-12-31",
            "usage_limit": 200,
            "used_count": 8,
            "is_active": True
        },
        {
            "code": "WELCOME5",
            "title": "New Customer 5% Welcome Bonus",
            "discount_type": "Percentage",
            "discount_value": 5.0,
            "min_bill_amount": 5000.0,
            "max_discount_amount": 2000.0,
            "start_date": "2024-01-01",
            "end_date": "2026-12-31",
            "usage_limit": 1000,
            "used_count": 34,
            "is_active": True
        }
    ]
    for cp in coupons_data:
        existing = db.query(Coupon).filter(Coupon.code == cp["code"]).first()
        if not existing:
            db.add(Coupon(**cp))
    db.commit()

    # 12. Seed Gift Vouchers
    vouchers_data = [
        {"voucher_code": "GV-1000", "title": "Gift Voucher ₹1,000", "denomination": 1000.0, "issue_date": "2024-01-01", "expiry_date": "2026-12-31", "status": "Active"},
        {"voucher_code": "GV-2500", "title": "Gift Voucher ₹2,500", "denomination": 2500.0, "issue_date": "2024-01-01", "expiry_date": "2026-12-31", "status": "Active"},
        {"voucher_code": "GV-5000", "title": "Royal Gift Voucher ₹5,000", "denomination": 5000.0, "issue_date": "2024-01-01", "expiry_date": "2026-12-31", "status": "Active"},
    ]
    for gv in vouchers_data:
        existing = db.query(GiftVoucher).filter(GiftVoucher.voucher_code == gv["voucher_code"]).first()
        if not existing:
            db.add(GiftVoucher(**gv))
    db.commit()

    # 13. Seed Barcode Template
    bt = db.query(BarcodeTemplate).first()
    if not bt:
        db.add(BarcodeTemplate(
            name="Standard 64x34mm (A4 24-Up Sheet)",
            paper_type="A4_Sheet",
            labels_across=3,
            labels_down=8,
            label_width_mm=64.0,
            label_height_mm=34.0,
            show_shop_name=True,
            show_product_name=True,
            show_mrp=True,
            show_retail_price=True,
            show_barcode_number=True,
            show_size_colour=True,
            barcode_type="CODE128"
        ))
        db.commit()
