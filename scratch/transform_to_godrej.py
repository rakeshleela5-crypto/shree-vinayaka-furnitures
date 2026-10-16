import re
import json

# Full 40 Godrej Interio Products Definition
with open("c:/Users/rakes/shree vinayaka furnitures/scratch/generate_godrej_data.py", "r", encoding="utf-8") as f:
    text = f.read()

# Execute to get GODREJ_PRODUCTS
local_scope = {}
exec(text, {}, local_scope)
GODREJ_PRODUCTS = local_scope["GODREJ_PRODUCTS"]

print(f"Loaded {len(GODREJ_PRODUCTS)} Godrej Interio products.")

# 1. Format INITIAL_PRODUCTS TS string
def format_product_ts(p):
    lines = ["  {"]
    lines.append(f"    id: '{p['id']}',")
    lines.append(f"    pCode: '{p['pCode']}',")
    lines.append(f"    name: {json.dumps(p['name'])},")
    lines.append(f"    purchasePrice: {p['purchasePrice']},")
    lines.append(f"    cessPercent: 0.0,")
    lines.append(f"    openingStock: {p['openingStock']},")
    lines.append(f"    barcode: '{p['barcode']}',")
    lines.append(f"    mrp: {p['mrp']},")
    lines.append(f"    retailPrice: {p['retailPrice']},")
    lines.append(f"    wholesalePrice: {p['wholesalePrice']},")
    lines.append(f"    category: '{p['category']}',")
    lines.append(f"    subCategory: '{p['subCategory']}',")
    lines.append(f"    hsn: '{p['hsn']}',")
    lines.append(f"    partNo: '{p['partNo']}',")
    lines.append(f"    cgst: {p['cgst']},")
    lines.append(f"    sgst: {p['sgst']},")
    lines.append(f"    igst: {p['igst']},")
    lines.append(f"    sTax: '{p['sTax']}',")
    lines.append(f"    pTax: '{p['pTax']}',")
    lines.append(f"    salesUnit: '{p['salesUnit']}',")
    lines.append(f"    godown: '{p['godown']}',")
    lines.append(f"    rack: '{p['rack']}',")
    lines.append(f"    minStock: {p['minStock']},")
    lines.append(f"    colour: '{p['colour']}',")
    lines.append(f"    size: '{p['size']}',")
    lines.append(f"    description: {json.dumps(p['description'])},")
    lines.append(f"    salesmanCommission: {p['salesmanCommission']},")
    lines.append(f"    loyaltyValue: {p['loyaltyValue']},")
    lines.append(f"    photo: '{p['photo']}'")
    lines.append("  }")
    return "\n".join(lines)

products_ts = "export const INITIAL_PRODUCTS: Product[] = [\n" + ",\n".join(format_product_ts(p) for p in GODREJ_PRODUCTS) + "\n];\n"

# 2. Format INITIAL_CATEGORIES & INITIAL_SUBCATEGORIES
categories = [
    {"id": "cat-1", "name": "STEEL ALMIRAHS & STORWELS", "isDefault": True},
    {"id": "cat-2", "name": "BEDS & BEDROOM"},
    {"id": "cat-3", "name": "ORTHOPEDIC MATTRESSES"},
    {"id": "cat-4", "name": "LIVING ROOM & RECLINERS"},
    {"id": "cat-5", "name": "COFFEE TABLES & TV UNITS"},
    {"id": "cat-6", "name": "DINING SETS & CROCKERY"},
    {"id": "cat-7", "name": "OFFICE & STUDY SEATING"},
    {"id": "cat-8", "name": "SECURITY SOLUTIONS & SAFES"},
    {"id": "cat-9", "name": "MODULAR KITCHEN & STORAGE"}
]

subcategories = [
    {"id": "sub-1", "name": "Slimline 3-Door", "category": "STEEL ALMIRAHS & STORWELS", "isDefault": True},
    {"id": "sub-2", "name": "Slimline 2-Door", "category": "STEEL ALMIRAHS & STORWELS"},
    {"id": "sub-3", "name": "Storwel Plain", "category": "STEEL ALMIRAHS & STORWELS"},
    {"id": "sub-4", "name": "Sliding Wardrobes", "category": "STEEL ALMIRAHS & STORWELS"},
    {"id": "sub-5", "name": "Engineered Wood Wardrobe", "category": "STEEL ALMIRAHS & STORWELS"},
    {"id": "sub-6", "name": "Hydraulic Storage Beds", "category": "BEDS & BEDROOM"},
    {"id": "sub-7", "name": "King Beds", "category": "BEDS & BEDROOM"},
    {"id": "sub-8", "name": "Queen Beds", "category": "BEDS & BEDROOM"},
    {"id": "sub-9", "name": "Nightstands", "category": "BEDS & BEDROOM"},
    {"id": "sub-10", "name": "Memory Foam Mattresses", "category": "ORTHOPEDIC MATTRESSES"},
    {"id": "sub-11", "name": "Pocket Spring Mattresses", "category": "ORTHOPEDIC MATTRESSES"},
    {"id": "sub-12", "name": "Dual Comfort", "category": "ORTHOPEDIC MATTRESSES"},
    {"id": "sub-13", "name": "Recliner Sofas", "category": "LIVING ROOM & RECLINERS"},
    {"id": "sub-14", "name": "Sectional Sofas", "category": "LIVING ROOM & RECLINERS"},
    {"id": "sub-15", "name": "Solid Wood Sofas", "category": "LIVING ROOM & RECLINERS"},
    {"id": "sub-16", "name": "Loveseats", "category": "LIVING ROOM & RECLINERS"},
    {"id": "sub-17", "name": "Chesterfield Sofas", "category": "LIVING ROOM & RECLINERS"},
    {"id": "sub-18", "name": "Center Tables", "category": "COFFEE TABLES & TV UNITS"},
    {"id": "sub-19", "name": "Nesting Tables", "category": "COFFEE TABLES & TV UNITS"},
    {"id": "sub-20", "name": "TV Units", "category": "COFFEE TABLES & TV UNITS"},
    {"id": "sub-21", "name": "Bookshelves", "category": "COFFEE TABLES & TV UNITS"},
    {"id": "sub-22", "name": "6-Seater Dining Sets", "category": "DINING SETS & CROCKERY"},
    {"id": "sub-23", "name": "4-Seater Dining Sets", "category": "DINING SETS & CROCKERY"},
    {"id": "sub-24", "name": "8-Seater Dining Sets", "category": "DINING SETS & CROCKERY"},
    {"id": "sub-25", "name": "Crockery Units", "category": "DINING SETS & CROCKERY"},
    {"id": "sub-26", "name": "Executive Chairs", "category": "OFFICE & STUDY SEATING"},
    {"id": "sub-27", "name": "Task Chairs", "category": "OFFICE & STUDY SEATING"},
    {"id": "sub-28", "name": "Office Desks", "category": "OFFICE & STUDY SEATING"},
    {"id": "sub-29", "name": "Executive Desks", "category": "OFFICE & STUDY SEATING"},
    {"id": "sub-30", "name": "Visitor Chairs", "category": "OFFICE & STUDY SEATING"},
    {"id": "sub-31", "name": "Digital Home Safes", "category": "SECURITY SOLUTIONS & SAFES"},
    {"id": "sub-32", "name": "Fire Resistant Safes", "category": "SECURITY SOLUTIONS & SAFES"},
    {"id": "sub-33", "name": "Biometric Safes", "category": "SECURITY SOLUTIONS & SAFES"},
    {"id": "sub-34", "name": "Kitchen Storage", "category": "MODULAR KITCHEN & STORAGE"},
    {"id": "sub-35", "name": "Shoe Racks", "category": "MODULAR KITCHEN & STORAGE"},
    {"id": "sub-36", "name": "Pooja Mandir", "category": "MODULAR KITCHEN & STORAGE"}
]

categories_ts = "export const INITIAL_CATEGORIES: Category[] = " + json.dumps(categories, indent=2) + ";\n\n"
subcategories_ts = "export const INITIAL_SUBCATEGORIES: SubCategory[] = " + json.dumps(subcategories, indent=2) + ";\n"

# 3. Format INITIAL_CUSTOMERS
customers = [
    {
        "id": "cust-1",
        "name": "Walk-in Cash Customer",
        "phone": "9999999999",
        "state": "Kerala",
        "city": "Cheruvathur",
        "balance": 0.0,
        "loyaltyPoints": 50,
        "loyaltyEnabled": True
    },
    {
        "id": "cust-rajesh",
        "name": "Rajesh & Priya Nair",
        "phone": "9847012345",
        "state": "Kerala",
        "address": "Pranavam Villa, Railway Station Road",
        "city": "Cheruvathur",
        "postalCode": "671313",
        "email": "rajesh.nair@gmail.com",
        "balance": 0.0,
        "loyaltyPoints": 420,
        "creditLimit": 100000.0,
        "loyaltyEnabled": True
    },
    {
        "id": "cust-b2b-techno",
        "name": "Malabar Technopark IT Solutions Pvt Ltd",
        "phone": "9847155667",
        "state": "Kerala",
        "address": "Floor 4, Cyber Tower, Nila Campus",
        "city": "Kozhikode",
        "postalCode": "673016",
        "email": "procurement@malabartechno.com",
        "gstin": "32AABCM1234F1Z1",
        "balance": 45000.0,
        "loyaltyPoints": 1250,
        "creditLimit": 500000.0,
        "loyaltyEnabled": True
    },
    {
        "id": "cust-dr-ananya",
        "name": "Dr. Ananya Varma",
        "phone": "9847299887",
        "state": "Kerala",
        "address": "Greenfield Avenue, Near District Hospital",
        "city": "Kasaragod",
        "postalCode": "671121",
        "email": "dr.ananya@careclinic.in",
        "balance": 0.0,
        "loyaltyPoints": 680,
        "creditLimit": 150000.0,
        "loyaltyEnabled": True
    },
    {
        "id": "cust-arch-matrix",
        "name": "Studio Matrix Architects (Ar. Vivek Menon)",
        "phone": "9847333221",
        "state": "Kerala",
        "address": "Design Hub, Fort Road",
        "city": "Kannur",
        "postalCode": "670001",
        "email": "projects@studiomatrix.in",
        "gstin": "32AAAAA0000A1Z5",
        "balance": 18500.0,
        "loyaltyPoints": 950,
        "creditLimit": 300000.0,
        "loyaltyEnabled": True
    },
    {
        "id": "cust-b2b-school",
        "name": "Horizon International Academy",
        "phone": "9847444332",
        "state": "Karnataka",
        "address": "Campus Road, Kadri Hills",
        "city": "Mangalore",
        "postalCode": "575004",
        "email": "admin@horizonacademy.edu",
        "gstin": "29AAACH9988G1Z3",
        "balance": 0.0,
        "loyaltyPoints": 2100,
        "creditLimit": 400000.0,
        "loyaltyEnabled": True
    },
    {
        "id": "cust-hotel-royal",
        "name": "Grand Royal Regency Hotel & Suites",
        "phone": "9847555443",
        "state": "Kerala",
        "address": "Beach Road, Thottada",
        "city": "Kannur",
        "postalCode": "670007",
        "email": "purchase@grandroyalregency.com",
        "gstin": "32AABCG5544H1Z2",
        "balance": 82000.0,
        "loyaltyPoints": 3400,
        "creditLimit": 600000.0,
        "loyaltyEnabled": True
    }
]
customers_ts = "export const INITIAL_CUSTOMERS: Customer[] = " + json.dumps(customers, indent=2) + ";\n"

# 4. Format INITIAL_PRODUCT_RECORDS
def format_prec(p, idx):
    return {
        "id": f"prec-{idx+1}",
        "code": p["pCode"],
        "name": p["name"],
        "category": p["category"],
        "subCategory": p["subCategory"],
        "barcode": p["barcode"],
        "hsnCode": p["hsn"],
        "partNo": p["partNo"],
        "godown": p["godown"],
        "rack": p["rack"],
        "mrp": p["mrp"],
        "retailPrice": p["retailPrice"],
        "wholesalePrice": p["wholesalePrice"],
        "openingStock": int(p["openingStock"]),
        "currentStock": int(p["openingStock"]),
        "saleTaxType": "Inclusive",
        "purchaseTaxType": "Exclusive",
        "active": True,
        "defaultSaleQty": 1,
        "colour": p.get("colour", "Standard"),
        "size": p.get("size", "Standard"),
        "salesmanPercent": p.get("salesmanCommission", 2.0),
        "loyaltyPoints": int(p.get("loyaltyValue", 50))
    }

precs = [format_prec(p, i) for i, p in enumerate(GODREJ_PRODUCTS)]
product_records_ts = "export const INITIAL_PRODUCT_RECORDS: ProductRecordItem[] = " + json.dumps(precs, indent=2) + ";\n"

# 5. Format INITIAL_PURCHASE_RECORDS
godrej_supplier = {
    "name": "Godrej & Boyce Mfg. Co. Ltd. (Interio Division)",
    "state": "Maharashtra",
    "gstin": "27AAACG0561D1ZT"
}
timber_supplier = {
    "name": "Nilambur Forest Teak & Hardwoods",
    "state": "Kerala",
    "gstin": "32AABCN1234P1Z3"
}

purchase_records = []
for i, p in enumerate(GODREJ_PRODUCTS[:12]):
    sup = godrej_supplier if "GSS" in p["pCode"] or "SL" in p["pCode"] or "STW" in p["pCode"] or "OFF" in p["partNo"] else timber_supplier
    taxable = round(p["purchasePrice"] * 5, 2)
    cgst_amt = round(taxable * 0.09, 2) if sup["state"] == "Kerala" else 0.0
    sgst_amt = round(taxable * 0.09, 2) if sup["state"] == "Kerala" else 0.0
    igst_amt = round(taxable * 0.18, 2) if sup["state"] != "Kerala" else 0.0
    tot = round(taxable + cgst_amt + sgst_amt + igst_amt, 2)
    purchase_records.append({
        "id": f"pur-gi-{i+1}",
        "invoiceNo": f"SVF-PUR-{1000+i}/24-25",
        "invoiceDate": "15/02/2025",
        "taxType": "GST",
        "supplierInvoiceNo": f"GB-BOM-{8400+i}",
        "supplierInvoiceDate": "12/02/2025",
        "supplierName": sup["name"],
        "state": sup["state"],
        "gstin": sup["gstin"],
        "productCode": p["pCode"],
        "productName": p["name"],
        "hsnCode": p["hsn"],
        "barcode": p["barcode"],
        "qty": 5,
        "unit": p["salesUnit"],
        "purchasePrice": p["purchasePrice"],
        "mrp": p["mrp"],
        "retailPrice": p["retailPrice"],
        "wholesalePrice": p["wholesalePrice"],
        "taxableAmount": taxable,
        "cgstPercent": 9.0 if cgst_amt > 0 else 0.0,
        "cgstAmount": cgst_amt,
        "sgstPercent": 9.0 if sgst_amt > 0 else 0.0,
        "sgstAmount": sgst_amt,
        "igstPercent": 18.0 if igst_amt > 0 else 0.0,
        "igstAmount": igst_amt,
        "cessPercent": 0,
        "cessAmount": 0,
        "totalAmount": tot,
        "colour": p.get("colour", ""),
        "size": p.get("size", ""),
        "batchNo": f"BATCH-2025-0{i+1}"
    })

purchase_records_ts = "export const INITIAL_PURCHASE_RECORDS: PurchaseRecordItem[] = " + json.dumps(purchase_records, indent=2) + ";\n"

# Now read retailDaddyData.ts and surgical-replace the blocks
with open("c:/Users/rakes/shree vinayaka furnitures/frontend/src/data/retailDaddyData.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Replace INITIAL_PRODUCTS up to INITIAL_CATEGORIES
prod_pattern = re.compile(r"export const INITIAL_PRODUCTS: Product\[\] = \[.*?\];\n\nexport const INITIAL_CATEGORIES", re.DOTALL)
m = prod_pattern.search(content)
if not m:
    print("Could not find INITIAL_PRODUCTS block!")
else:
    print(f"Matched INITIAL_PRODUCTS from char {m.start()} to {m.end()}")
    content = content[:m.start()] + products_ts + "\nexport const INITIAL_CATEGORIES" + content[m.end()-len("export const INITIAL_CATEGORIES"):]

# Replace INITIAL_CATEGORIES up to INITIAL_CUSTOMERS
cat_pattern = re.compile(r"export const INITIAL_CATEGORIES: Category\[\] = \[.*?\];\n\nexport const INITIAL_SUBCATEGORIES: SubCategory\[\] = \[.*?\];\n\nexport const INITIAL_CUSTOMERS", re.DOTALL)
m2 = cat_pattern.search(content)
if not m2:
    print("Could not find INITIAL_CATEGORIES / INITIAL_SUBCATEGORIES block!")
else:
    print(f"Matched INITIAL_CATEGORIES/SUBCATEGORIES from char {m2.start()} to {m2.end()}")
    content = content[:m2.start()] + categories_ts + "\n" + subcategories_ts + "\nexport const INITIAL_CUSTOMERS" + content[m2.end()-len("export const INITIAL_CUSTOMERS"):]

# Replace INITIAL_CUSTOMERS up to INITIAL_SALE_RETURNS
cust_pattern = re.compile(r"export const INITIAL_CUSTOMERS: Customer\[\] = \[.*?\];\n\nexport const INITIAL_SALE_RETURNS", re.DOTALL)
m3 = cust_pattern.search(content)
if not m3:
    print("Could not find INITIAL_CUSTOMERS block!")
else:
    print(f"Matched INITIAL_CUSTOMERS from char {m3.start()} to {m3.end()}")
    content = content[:m3.start()] + customers_ts + "\nexport const INITIAL_SALE_RETURNS" + content[m3.end()-len("export const INITIAL_SALE_RETURNS"):]

# Replace INITIAL_PRODUCT_RECORDS up to INITIAL_PURCHASE_RECORDS
prec_pattern = re.compile(r"export const INITIAL_PRODUCT_RECORDS: ProductRecordItem\[\] = \[.*?\];\n\nexport const INITIAL_PURCHASE_RECORDS", re.DOTALL)
m4 = prec_pattern.search(content)
if not m4:
    print("Could not find INITIAL_PRODUCT_RECORDS block!")
else:
    print(f"Matched INITIAL_PRODUCT_RECORDS from char {m4.start()} to {m4.end()}")
    content = content[:m4.start()] + product_records_ts + "\nexport const INITIAL_PURCHASE_RECORDS" + content[m4.end()-len("export const INITIAL_PURCHASE_RECORDS"):]

# Replace INITIAL_PURCHASE_RECORDS up to INITIAL_ACCOUNT_HEADS
pur_pattern = re.compile(r"export const INITIAL_PURCHASE_RECORDS: PurchaseRecordItem\[\] = \[.*?\];\n\nexport const INITIAL_ACCOUNT_HEADS", re.DOTALL)
m5 = pur_pattern.search(content)
if not m5:
    print("Could not find INITIAL_PURCHASE_RECORDS block!")
else:
    print(f"Matched INITIAL_PURCHASE_RECORDS from char {m5.start()} to {m5.end()}")
    content = content[:m5.start()] + purchase_records_ts + "\nexport const INITIAL_ACCOUNT_HEADS" + content[m5.end()-len("export const INITIAL_ACCOUNT_HEADS"):]

# Write back
with open("c:/Users/rakes/shree vinayaka furnitures/frontend/src/data/retailDaddyData.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("retailDaddyData.ts successfully updated with 40 Godrej Interio collections!")
