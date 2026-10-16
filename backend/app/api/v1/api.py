from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    categories,
    furniture,
    inquiries,
    backup,
    products,
    customers,
    suppliers,
    sales,
    purchases,
    inventory,
    returns,
    accounting,
    auth,
    company
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(furniture.router, prefix="/furniture", tags=["Furniture"])
api_router.include_router(inquiries.router, prefix="/inquiries", tags=["Inquiries"])
api_router.include_router(backup.router, prefix="/backup", tags=["Cloudflare R2 Backup"])

# ERP & POS Endpoints
api_router.include_router(products.router, prefix="/products", tags=["Products & Catalog"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customers & Ledger"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["Suppliers & Outstanding"])
api_router.include_router(sales.router, prefix="/sales", tags=["Sales & POS Billing"])
api_router.include_router(purchases.router, prefix="/purchases", tags=["Purchases & Stock Inward"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory & Adjustments"])
api_router.include_router(returns.router, prefix="/returns", tags=["Sales & Purchase Returns"])
api_router.include_router(accounting.router, prefix="/accounting", tags=["Accounting & Vouchers"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth, Users & Salesmen"])
api_router.include_router(company.router, prefix="/company", tags=["Company Profile & Multi-Tenancy"])
