import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.product import Product
from app.schemas.product import StockHedgingItem, StockHedgingSummary

router = APIRouter()

def compute_stock_status(physical: float, available: float, min_stock: float) -> str:
    if physical <= 0:
        return "Stockout"
    if available <= 0:
        return "Critical"
    if available <= min_stock / 2.0:
        return "Critical"
    if available <= min_stock:
        return "LowStock"
    return "Adequate"

@router.get("/summary", response_model=StockHedgingSummary)
def get_stock_hedging_summary(
    search: Optional[str] = Query(None, description="Search product name, code or barcode"),
    filter_type: Optional[str] = Query(None, description="all | low_stock | reserved | transit"),
    db: Session = Depends(get_db)
):
    """
    Returns complete Stock Hedging analytics:
    Physical In-Hand vs Reserved vs Available To Promise (ATP) vs In-Transit Virtual Stock.
    """
    query = db.query(Product).filter(Product.is_active == True)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_pattern),
                Product.p_code.ilike(search_pattern),
                Product.barcode.ilike(search_pattern)
            )
        )
    
    products = query.order_by(Product.name.asc()).all()
    
    items: List[StockHedgingItem] = []
    total_physical = 0.0
    total_reserved = 0.0
    total_available = 0.0
    total_transit = 0.0
    low_stock_count = 0
    critical_stock_count = 0

    for p in products:
        phys = float(p.current_stock or 0.0)
        res = float(p.reserved_stock or 0.0)
        avail = max(0.0, phys - res)
        transit = float(p.transit_stock or 0.0)
        virtual = avail + transit
        min_stk = float(p.min_stock if p.min_stock is not None else 5.0)
        reorder_q = float(p.reorder_quantity if p.reorder_quantity is not None else 5.0)
        lead_days = int(p.lead_time_days if p.lead_time_days is not None else 7)
        
        status = compute_stock_status(phys, avail, min_stk)
        
        suggested_reorder = 0.0
        if avail <= min_stk:
            suggested_reorder = max(reorder_q, (min_stk * 2.0) - avail - transit)
        
        if status in ("LowStock", "Critical", "Stockout"):
            low_stock_count += 1
            if status in ("Critical", "Stockout"):
                critical_stock_count += 1
        
        total_physical += phys
        total_reserved += res
        total_available += avail
        total_transit += transit

        # Filter by tab if requested
        if filter_type == "low_stock" and status not in ("LowStock", "Critical", "Stockout"):
            continue
        if filter_type == "reserved" and res <= 0:
            continue
        if filter_type == "transit" and transit <= 0:
            continue

        items.append(StockHedgingItem(
            id=p.id,
            p_code=p.p_code,
            name=p.name,
            barcode=p.barcode,
            category_name=p.category.name if p.category else "Furniture",
            godown=p.godown or "Main Showroom",
            rack=p.rack or "Bay-1",
            retail_price=float(p.retail_price or 0.0),
            purchase_price=float(p.purchase_price or 0.0),
            physical_stock=phys,
            reserved_stock=res,
            available_stock=avail,
            transit_stock=transit,
            virtual_stock=virtual,
            min_stock=min_stk,
            reorder_quantity=reorder_q,
            lead_time_days=lead_days,
            is_knockdown=bool(p.is_knockdown),
            total_boxes_count=int(p.total_boxes_count or 1),
            stock_status=status,
            suggested_reorder_qty=round(suggested_reorder, 1)
        ))

    return StockHedgingSummary(
        total_products_count=len(products),
        total_physical_stock=round(total_physical, 1),
        total_reserved_stock=round(total_reserved, 1),
        total_available_stock=round(total_available, 1),
        total_transit_stock=round(total_transit, 1),
        low_stock_count=low_stock_count,
        critical_stock_count=critical_stock_count,
        items=items
    )

@router.post("/{product_id}/update")
def update_product_stock_hedging(
    product_id: int,
    reserved_stock: Optional[float] = Query(None),
    transit_stock: Optional[float] = Query(None),
    min_stock: Optional[float] = Query(None),
    reorder_quantity: Optional[float] = Query(None),
    lead_time_days: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Updates stock hedging parameters (Reserved, In-Transit, Min Threshold, Lead Time) for a product.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if reserved_stock is not None:
        if reserved_stock < 0:
            raise HTTPException(status_code=400, detail="Reserved stock cannot be negative")
        product.reserved_stock = reserved_stock

    if transit_stock is not None:
        if transit_stock < 0:
            raise HTTPException(status_code=400, detail="In-transit stock cannot be negative")
        product.transit_stock = transit_stock

    if min_stock is not None:
        product.min_stock = min_stock

    if reorder_quantity is not None:
        product.reorder_quantity = reorder_quantity

    if lead_time_days is not None:
        product.lead_time_days = lead_time_days

    product.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(product)

    return {
        "status": "SUCCESS",
        "message": f"Updated stock hedging for {product.name}",
        "product_id": product.id,
        "physical_stock": product.current_stock,
        "reserved_stock": product.reserved_stock,
        "available_stock": max(0.0, (product.current_stock or 0.0) - (product.reserved_stock or 0.0)),
        "transit_stock": product.transit_stock,
        "min_stock": product.min_stock
    }

@router.post("/seed-sample-data")
def seed_sample_stock_hedging(db: Session = Depends(get_db)):
    """
    Seeds representative Godrej Interio stock hedging metrics across showroom furniture products.
    """
    sample_hedging_data = [
        {"name_pattern": "Slimline", "current": 8.0, "reserved": 3.0, "transit": 5.0, "min": 5.0, "reorder": 6.0, "lead": 7},
        {"name_pattern": "Centurion", "current": 4.0, "reserved": 2.0, "transit": 4.0, "min": 4.0, "reorder": 4.0, "lead": 10},
        {"name_pattern": "Motion", "current": 12.0, "reserved": 8.0, "transit": 10.0, "min": 6.0, "reorder": 12.0, "lead": 5},
        {"name_pattern": "Ortho", "current": 3.0, "reserved": 2.0, "transit": 6.0, "min": 5.0, "reorder": 8.0, "lead": 7},
        {"name_pattern": "Regal", "current": 2.0, "reserved": 1.0, "transit": 3.0, "min": 3.0, "reorder": 4.0, "lead": 14},
        {"name_pattern": "Defender", "current": 5.0, "reserved": 1.0, "transit": 2.0, "min": 3.0, "reorder": 3.0, "lead": 12},
    ]

    updated_count = 0
    for sample in sample_hedging_data:
        p = db.query(Product).filter(Product.name.ilike(f"%{sample['name_pattern']}%")).first()
        if p:
            p.current_stock = sample["current"]
            p.reserved_stock = sample["reserved"]
            p.transit_stock = sample["transit"]
            p.min_stock = sample["min"]
            p.reorder_quantity = sample["reorder"]
            p.lead_time_days = sample["lead"]
            updated_count += 1

    db.commit()
    return {
        "status": "SUCCESS",
        "message": f"Seeded realistic Godrej stock hedging numbers for {updated_count} products.",
        "updated_count": updated_count
    }
