import json

with open("c:/Users/rakes/shree vinayaka furnitures/scratch/generate_godrej_data.py", "r", encoding="utf-8") as f:
    text = f.read()

local_scope = {}
exec(text, {}, local_scope)
GODREJ_PRODUCTS = local_scope["GODREJ_PRODUCTS"]

# Format products for backend/app/seed.py
backend_products = []
for p in GODREJ_PRODUCTS:
    backend_products.append({
        "p_code": p["pCode"],
        "name": p["name"],
        "barcode": p["barcode"],
        "purchase_price": p["purchasePrice"],
        "mrp": p["mrp"],
        "retail_price": p["retailPrice"],
        "wholesale_price": p["wholesalePrice"],
        "opening_stock": p["openingStock"],
        "current_stock": p["openingStock"],
        "min_stock": p["minStock"],
        "sales_unit": p["salesUnit"],
        "hsn_code": p["hsn"],
        "cgst": p["cgst"],
        "sgst": p["sgst"],
        "igst": p["igst"],
        "godown": p["godown"],
        "rack": p["rack"],
        "salesman_commission": p["salesmanCommission"],
        "loyalty_value": p["loyaltyValue"]
    })

seed_file = "c:/Users/rakes/shree vinayaka furnitures/backend/app/seed.py"
with open(seed_file, "r", encoding="utf-8") as f:
    seed_text = f.read()

start_marker = "    # 10. Seed POS Retail Products\n    products_data = ["
end_marker = "    for prd in products_data:"

s_idx = seed_text.find(start_marker)
e_idx = seed_text.find(end_marker, s_idx)

if s_idx != -1 and e_idx != -1:
    prods_json = json.dumps(backend_products, indent=8)
    # indent properly
    new_block = f"    # 10. Seed 40 Official Godrej Interio Products\n    products_data = {prods_json}\n\n"
    seed_text = seed_text[:s_idx] + new_block + seed_text[e_idx:]
    print("Replaced products_data in seed.py successfully!")
else:
    print(f"Failed to find markers: {s_idx}, {e_idx}")

# Also update CompanyProfile in seed.py
seed_text = seed_text.replace(
    'company_name="Shree Vinayaka Furnitures",',
    'company_name="Godrej Interio - Shree Vinayaka Furnitures (Authorised Dealer)",'
)

with open(seed_file, "w", encoding="utf-8") as f:
    f.write(seed_text)

print("Updated backend/app/seed.py cleanly!")
