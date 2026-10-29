from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
import datetime
import logging

from app.core.database import get_db
from app.models.company import CompanyProfile, SystemSetting, DocumentPrefixSuffix
from app.models.category import Category
from app.models.product import Product
from app.models.customer import Customer
from app.models.supplier import Supplier
from app.models.user import Salesman, UserControlPermission
from app.models.sale import HeldCart
from app.models.accounting import BankMaster, BranchMaster, BankAccountMaster
from app.models.discounts import ProductQuantityDiscountRule, BarcodeTemplate

router = APIRouter()
logger = logging.getLogger("svf.bootstrap")

@router.get("/initial-state")
def get_initial_state(db: Session = Depends(get_db)):
    """
    Unified Master Hydration Endpoint for Showroom POS & ERP.
    Eliminates all client-side localStorage/mock array traps by streaming
    a complete, synchronized system snapshot directly from PostgreSQL.
    """
    try:
        # 1. Company Profile
        company = db.query(CompanyProfile).filter(CompanyProfile.is_active == True).first()
        company_data = None
        if company:
            company_data = {
                "id": company.id,
                "company_name": company.company_name,
                "address": company.address,
                "city": company.city,
                "state": company.state,
                "state_code": company.state_code,
                "pincode": company.pincode,
                "phone": company.phone,
                "email": company.email,
                "gstin": company.gstin,
                "currency_symbol": company.currency_symbol,
                "financial_year": company.financial_year,
                "bank_name": company.bank_name,
                "bank_ac_no": company.bank_ac_no,
                "bank_ifsc": company.bank_ifsc,
                "bank_branch": company.bank_branch,
                "invoice_header_note": company.invoice_header_note,
                "invoice_footer_note": company.invoice_footer_note,
                "logo_url": company.logo_url,
                "signature_url": company.signature_url
            }

        # 2. System Settings
        settings_rows = db.query(SystemSetting).all()
        settings_map = {}
        for s in settings_rows:
            try:
                settings_map[s.key] = json.loads(s.value_json)
            except Exception:
                settings_map[s.key] = s.value_json

        # 3. Document Prefix/Suffix Configurations
        prefixes = db.query(DocumentPrefixSuffix).all()
        prefix_data = [
            {
                "id": p.id,
                "doc_type": p.doc_type,
                "prefix": p.prefix,
                "suffix": p.suffix,
                "next_number": p.next_number,
                "padding_zeros": p.padding_zeros
            }
            for p in prefixes
        ]

        # 4. Categories
        categories = db.query(Category).all()
        category_data = [
            {
                "id": c.id,
                "name": c.name,
                "slug": c.slug,
                "description": c.description,
                "image_url": c.image_url
            }
            for c in categories
        ]

        # 5. Active Products (Lightweight POS Catalog)
        products = db.query(Product).filter(Product.active == True).order_by(Product.name.asc()).all()
        product_data = [
            {
                "id": p.id,
                "name": p.name,
                "barcode": p.barcode,
                "category": p.category,
                "sub_category": p.sub_category,
                "mrp": float(p.mrp or 0.0),
                "sale_price": float(p.sale_price or 0.0),
                "purchase_price": float(p.purchase_price or 0.0),
                "hsn_code": p.hsn_code,
                "tax_rate": float(p.tax_rate or 0.0),
                "stock_quantity": float(p.stock_quantity or 0.0),
                "showroom_display_qty": float(p.showroom_display_qty or 0.0),
                "godown_available_qty": float(p.godown_available_qty or 0.0),
                "primary_image_url": p.primary_image_url
            }
            for p in products
        ]

        # 6. Active Customers
        customers = db.query(Customer).filter(Customer.active == True).order_by(Customer.name.asc()).all()
        customer_data = [
            {
                "id": cu.id,
                "code": cu.code,
                "name": cu.name,
                "phone": cu.phone,
                "email": cu.email,
                "city": cu.city,
                "credit_limit": float(cu.credit_limit or 0.0),
                "current_balance": float(cu.current_balance or 0.0),
                "loyalty_points": float(cu.loyalty_points or 0.0)
            }
            for cu in customers
        ]

        # 7. Active Suppliers
        suppliers = db.query(Supplier).filter(Supplier.active == True).order_by(Supplier.name.asc()).all()
        supplier_data = [
            {
                "id": su.id,
                "code": su.code,
                "name": su.name,
                "phone": su.phone,
                "gstin": su.gstin,
                "city": su.city,
                "current_balance": float(su.current_balance or 0.0)
            }
            for su in suppliers
        ]

        # 8. Salesmen
        salesmen = db.query(Salesman).filter(Salesman.active == True).all()
        salesman_data = [
            {
                "id": sm.id,
                "code": sm.code,
                "name": sm.name,
                "phone": sm.phone,
                "commission_percent": float(sm.commission_percent or 0.0),
                "balance_commission": float(sm.balance_commission or 0.0)
            }
            for sm in salesmen
        ]

        # 9. Active Held Carts
        held_carts = db.query(HeldCart).order_by(HeldCart.id.desc()).all()
        held_data = [
            {
                "id": hc.id,
                "hold_id": hc.hold_id,
                "time": hc.time,
                "customer_name": hc.customer_name,
                "phone": hc.phone,
                "items_count": hc.items_count,
                "total_amount": float(hc.total_amount or 0.0),
                "cart_json": hc.cart_json
            }
            for hc in held_carts
        ]

        # 10. Banks, Branches, and Accounts
        banks = db.query(BankMaster).filter(BankMaster.active == True).all()
        branches = db.query(BranchMaster).filter(BranchMaster.active == True).all()
        bank_accounts = db.query(BankAccountMaster).filter(BankAccountMaster.active == True).all()

        bank_data = [{"id": b.id, "bank_code": b.bank_code, "bank_name": b.bank_name} for b in banks]
        branch_data = [
            {"id": br.id, "bank_name": br.bank_name, "branch_name": br.branch_name, "ifsc": br.ifsc}
            for br in branches
        ]
        account_data = [
            {
                "id": ba.id,
                "account_no": ba.account_no,
                "account_holder": ba.account_holder,
                "bank_name": ba.bank_name,
                "branch_name": ba.branch_name,
                "ifsc_code": ba.ifsc_code,
                "current_balance": float(ba.current_balance or 0.0),
                "upi_id": ba.upi_id
            }
            for ba in bank_accounts
        ]

        # 11. Barcode Templates & Rules
        templates = db.query(BarcodeTemplate).all()
        template_data = [
            {
                "id": t.id,
                "name": t.name,
                "paper_type": t.paper_type,
                "labels_across": t.labels_across,
                "labels_down": t.labels_down,
                "label_width_mm": float(t.label_width_mm or 64.0),
                "label_height_mm": float(t.label_height_mm or 34.0)
            }
            for t in templates
        ]

        return {
            "status": "success",
            "server_timestamp": datetime.datetime.utcnow().isoformat(),
            "company": company_data,
            "settings": settings_map,
            "prefixes": prefix_data,
            "categories": category_data,
            "products": product_data,
            "customers": customer_data,
            "suppliers": supplier_data,
            "salesmen": salesman_data,
            "held_carts": held_data,
            "banks": bank_data,
            "branches": branch_data,
            "bank_accounts": account_data,
            "barcode_templates": template_data
        }

    except Exception as e:
        logger.error(f"Error fetching initial state: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate initial state: {str(e)}")
