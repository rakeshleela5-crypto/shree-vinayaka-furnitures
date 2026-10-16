import json

with open("c:/Users/rakes/shree vinayaka furnitures/scratch/generate_godrej_data.py", "r", encoding="utf-8") as f:
    text = f.read()

local_scope = {}
exec(text, {}, local_scope)
GODREJ_PRODUCTS = local_scope["GODREJ_PRODUCTS"]

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
for i, p in enumerate(GODREJ_PRODUCTS[:15]):
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

filepath = "c:/Users/rakes/shree vinayaka furnitures/frontend/src/data/retailDaddyData.ts"
with open(filepath, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Replace customers
start_marker = "export const INITIAL_CUSTOMERS"
end_marker = "// Video 13 Seed Sale Return Vouchers"
s_idx = text.find(start_marker)
e_idx = text.find(end_marker, s_idx)
if s_idx != -1 and e_idx != -1:
    cust_ts = "export const INITIAL_CUSTOMERS: Customer[] = " + json.dumps(customers, indent=2) + ";\n\n"
    text = text[:s_idx] + cust_ts + text[e_idx:]
    print("Replaced INITIAL_CUSTOMERS successfully!")
else:
    print(f"Failed to find CUSTOMERS marker: {s_idx}, {e_idx}")

# 2. Replace Product Records
start_marker_pr = "export const INITIAL_PRODUCT_RECORDS: ProductRecordItem[] = ["
end_marker_pr = "export const INITIAL_PURCHASE_RECORDS: PurchaseRecordItem[] = ["
s_idx2 = text.find(start_marker_pr)
e_idx2 = text.find(end_marker_pr, s_idx2)
if s_idx2 != -1 and e_idx2 != -1:
    pr_ts = "export const INITIAL_PRODUCT_RECORDS: ProductRecordItem[] = " + json.dumps(precs, indent=2) + ";\n\n"
    text = text[:s_idx2] + pr_ts + text[e_idx2:]
    print("Replaced INITIAL_PRODUCT_RECORDS successfully!")
else:
    print(f"Failed to find PRODUCT_RECORDS marker: {s_idx2}, {e_idx2}")

# 3. Replace Purchase Records
start_marker_pur = "export const INITIAL_PURCHASE_RECORDS: PurchaseRecordItem[] = ["
end_marker_pur = "export const INITIAL_ACCOUNT_HEADS: AccountHeadItem[] = ["
s_idx3 = text.find(start_marker_pur)
e_idx3 = text.find(end_marker_pur, s_idx3)
if s_idx3 != -1 and e_idx3 != -1:
    pur_ts = "export const INITIAL_PURCHASE_RECORDS: PurchaseRecordItem[] = " + json.dumps(purchase_records, indent=2) + ";\n\n"
    text = text[:s_idx3] + pur_ts + text[e_idx3:]
    print("Replaced INITIAL_PURCHASE_RECORDS successfully!")
else:
    print(f"Failed to find PURCHASE_RECORDS marker: {s_idx3}, {e_idx3}")

# 4. Update DEFAULT_COMPANY_INFO
text = text.replace(
    "name: 'SHREE VINAYAKA FURNITURES',",
    "name: 'GODREJ INTERIO - SHREE VINAYAKA FURNITURES',\n  address: 'Authorised Channel Partner, Pooja Building, Main Road, Cheruvathur',\n  city: 'Kasaragod',"
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(text)

print("Updated retailDaddyData.ts cleanly!")
