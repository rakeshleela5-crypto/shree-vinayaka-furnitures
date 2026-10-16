import json
import re
import sys
from pathlib import Path

# Load original 40 products and additional 25
sys.path.append(r'c:\Users\rakes\shree vinayaka furnitures\scratch')
from generate_godrej_data import GODREJ_PRODUCTS as original_40
from expand_godrej_products import ADDITIONAL_25_PRODUCTS as additional_25

all_65_products = original_40 + additional_25
print(f"Total merged products: {len(all_65_products)}")

# Check uniqueness of IDs, barcodes, pCodes
ids = [p["id"] for p in all_65_products]
barcodes = [p["barcode"] for p in all_65_products]
pcodes = [p["pCode"] for p in all_65_products]

assert len(ids) == len(set(ids)), f"Duplicate IDs found! {len(ids)} vs {len(set(ids))}"
assert len(barcodes) == len(set(barcodes)), f"Duplicate barcodes found! {len(barcodes)} vs {len(set(barcodes))}"
assert len(pcodes) == len(set(pcodes)), f"Duplicate pCodes found! {len(pcodes)} vs {len(set(pcodes))}"

print("All IDs, barcodes, and pCodes are 100% unique!")

# 1. Update frontend/src/data/retailDaddyData.ts
ts_data_path = Path(r'c:\Users\rakes\shree vinayaka furnitures\frontend\src\data\retailDaddyData.ts')
content = ts_data_path.read_text(encoding='utf-8')

products_json = json.dumps(all_65_products, indent=2)
replacement_ts = f"export const INITIAL_PRODUCTS: Product[] = {products_json};"

start_marker = "export const INITIAL_PRODUCTS: Product[] = ["
end_marker = "export const INITIAL_CATEGORIES: Category[] = ["

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

assert start_idx != -1 and end_idx != -1, "Could not find start or end marker in retailDaddyData.ts"

content_new = content[:start_idx] + replacement_ts + "\n\n" + content[end_idx:]
ts_data_path.write_text(content_new, encoding='utf-8')
print("Successfully updated frontend/src/data/retailDaddyData.ts with all 65 products.")

# 2. Update backend/app/seed.py
seed_py_path = Path(r'c:\Users\rakes\shree vinayaka furnitures\backend\app\seed.py')
seed_content = seed_py_path.read_text(encoding='utf-8')

backend_products = []
for p in all_65_products:
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

seed_prod_json = json.dumps(backend_products, indent=8)
seed_start_marker = "products_data = ["
seed_end_marker = "for prd in products_data:"

s_idx = seed_content.find(seed_start_marker)
e_idx = seed_content.find(seed_end_marker)

assert s_idx != -1 and e_idx != -1, "Could not find products_data marker in seed.py"

seed_content_new = (
    seed_content[:s_idx] +
    f"products_data = {seed_prod_json}\n\n    " +
    seed_content[e_idx:]
)
seed_py_path.write_text(seed_content_new, encoding='utf-8')
print("Successfully updated backend/app/seed.py with all 65 products.")
