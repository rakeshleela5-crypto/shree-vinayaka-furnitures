from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.database import get_db
from app.models.inventory import StockEntry, StockEntryItem, StockAdjustment, StockTransfer
from app.models.product import Product
from app.models.discounts import ProductQuantityDiscountRule, ComboPack
from app.schemas.inventory import (
    StockEntryCreate, StockEntryResponse,
    StockAdjustmentCreate, StockAdjustmentResponse,
    StockTransferCreate, StockTransferResponse
)
from app.schemas.discounts import (
    ProductQuantityDiscountRuleCreate, ProductQuantityDiscountRuleResponse,
    ComboPackCreate, ComboPackResponse
)

router = APIRouter()

@router.get("/stock-entries", response_model=List[StockEntryResponse])
def get_stock_entries(db: Session = Depends(get_db)):
    return db.query(StockEntry).order_by(StockEntry.id.desc()).all()

@router.post("/stock-entries", response_model=StockEntryResponse)
def create_stock_entry(payload: StockEntryCreate, db: Session = Depends(get_db)):
    existing = db.query(StockEntry).filter(StockEntry.stock_code == payload.stock_code).first()
    if existing:
        return existing
    
    db_entry = StockEntry(stock_code=payload.stock_code, date=payload.date, remarks=payload.remarks)
    db.add(db_entry)
    db.flush()

    for item in payload.items:
        db_item = StockEntryItem(stock_entry_id=db_entry.id, **item.model_dump())
        db.add(db_item)
        # Increase product stock atomically
        prod = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if prod:
            prod.current_stock += item.qty

    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.get("/stock-adjustments", response_model=List[StockAdjustmentResponse])
def get_stock_adjustments(db: Session = Depends(get_db)):
    return db.query(StockAdjustment).order_by(StockAdjustment.id.desc()).all()

@router.post("/stock-adjustments", response_model=StockAdjustmentResponse)
def create_stock_adjustment(payload: StockAdjustmentCreate, db: Session = Depends(get_db)):
    existing = db.query(StockAdjustment).filter(StockAdjustment.adjustment_code == payload.adjustment_code).first()
    if existing:
        return existing

    db_adj = StockAdjustment(**payload.model_dump())
    db.add(db_adj)
    
    # Adjust product stock atomically with row-level lock
    prod = db.query(Product).filter(Product.id == payload.product_id).with_for_update().first()
    if prod:
        if payload.adjustment_type == "Plus":
            prod.current_stock += payload.qty
        else:
            if prod.current_stock < payload.qty:
                db.rollback()
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot reduce stock of '{prod.name}' by {payload.qty}! Only {prod.current_stock} currently available in inventory."
                )
            prod.current_stock -= payload.qty

    db.commit()
    db.refresh(db_adj)
    return db_adj

# Quantity-Based Discount Rules (Video 10)
@router.get("/discount-rules", response_model=List[ProductQuantityDiscountRuleResponse])
def get_discount_rules(db: Session = Depends(get_db)):
    return db.query(ProductQuantityDiscountRule).filter(ProductQuantityDiscountRule.active == True).all()

@router.post("/discount-rules", response_model=ProductQuantityDiscountRuleResponse)
def create_discount_rule(payload: ProductQuantityDiscountRuleCreate, db: Session = Depends(get_db)):
    existing = db.query(ProductQuantityDiscountRule).filter(
        ProductQuantityDiscountRule.product_id == payload.product_id,
        ProductQuantityDiscountRule.min_qty == payload.min_qty,
        ProductQuantityDiscountRule.max_qty == payload.max_qty
    ).first()
    if existing:
        existing.discount_percent = payload.discount_percent
        existing.discount_amount = payload.discount_amount
        existing.active = payload.active
        db.commit()
        db.refresh(existing)
        return existing
    rule = ProductQuantityDiscountRule(**payload.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.delete("/discount-rules/{rule_id}")
def delete_discount_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(ProductQuantityDiscountRule).filter(ProductQuantityDiscountRule.id == rule_id).first()
    if rule:
        rule.active = False
        db.commit()
    return {"message": "Discount rule removed"}

# Combo Packs (Video 12)
@router.get("/combo-packs", response_model=List[ComboPackResponse])
def get_combo_packs(db: Session = Depends(get_db)):
    return db.query(ComboPack).filter(ComboPack.active == True).all()

@router.post("/combo-packs", response_model=ComboPackResponse)
def create_combo_pack(payload: ComboPackCreate, db: Session = Depends(get_db)):
    existing = db.query(ComboPack).filter(ComboPack.barcode == payload.barcode).first()
    if existing:
        for k, v in payload.model_dump().items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
    pack = ComboPack(**payload.model_dump())
    db.add(pack)
    db.commit()
    db.refresh(pack)
    return pack

@router.delete("/combo-packs/{pack_id}")
def delete_combo_pack(pack_id: int, db: Session = Depends(get_db)):
    pack = db.query(ComboPack).filter(ComboPack.id == pack_id).first()
    if pack:
        pack.active = False
        db.commit()
    return {"message": "Combo pack deleted"}


# Multi-Godown Stock Transfers (Video 07 & 20)
@router.get("/stock-transfers", response_model=List[StockTransferResponse])
def get_stock_transfers(db: Session = Depends(get_db)):
    return db.query(StockTransfer).order_by(StockTransfer.id.desc()).all()


@router.post("/stock-transfers", response_model=StockTransferResponse)
def create_stock_transfer(payload: StockTransferCreate, db: Session = Depends(get_db)):
    existing = db.query(StockTransfer).filter(StockTransfer.transfer_no == payload.transfer_no).first()
    if existing:
        return existing

    prod = db.query(Product).filter(Product.id == payload.product_id).with_for_update().first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    if prod.current_stock < payload.qty:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transfer {payload.qty} units of '{prod.name}' from {payload.from_godown}. Only {prod.current_stock} available in stock."
        )

    # Move product godown and rack location atomically
    prod.godown = payload.to_godown
    if payload.to_rack:
        prod.rack = payload.to_rack

    trf = StockTransfer(**payload.model_dump())
    db.add(trf)
    db.commit()
    db.refresh(trf)
    return trf


@router.get("/stock-valuation")
def get_stock_valuation(db: Session = Depends(get_db)):
    """
    Forensic Inventory Stock Valuation (Ind AS 2 / AS-2 Inventory Asset Valuation).
    Computes total SKUs, total units, asset purchase cost value, retail market value,
    gross margin, low-stock alerts, and breakdown by Godown/Showroom.
    """
    products = db.query(Product).filter(Product.is_active == True).all()

    total_skus = len(products)
    total_units = 0.0
    total_cost_value = 0.0
    total_retail_value = 0.0
    low_stock_count = 0
    out_of_stock_count = 0

    godowns: Dict[str, Dict[str, Any]] = {}
    items_breakdown = []

    for p in products:
        stock = float(p.current_stock or 0.0)
        p_cost = float(p.purchase_price or 0.0)
        r_price = float(p.retail_price or 0.0)

        if stock <= 0:
            out_of_stock_count += 1
        elif stock <= float(p.min_stock or 5.0):
            low_stock_count += 1

        cost_val = max(0.0, stock * p_cost)
        retail_val = max(0.0, stock * r_price)

        if stock > 0:
            total_units += stock
            total_cost_value += cost_val
            total_retail_value += retail_val

        g_name = (p.godown or "Main Showroom").strip()
        if not g_name:
            g_name = "Main Showroom"

        if g_name not in godowns:
            godowns[g_name] = {
                "godown_name": g_name,
                "sku_count": 0,
                "total_units": 0.0,
                "cost_value": 0.0,
                "retail_value": 0.0
            }

        godowns[g_name]["sku_count"] += 1
        if stock > 0:
            godowns[g_name]["total_units"] += stock
            godowns[g_name]["cost_value"] += cost_val
            godowns[g_name]["retail_value"] += retail_val

        items_breakdown.append({
            "product_id": p.id,
            "p_code": p.p_code,
            "product_name": p.name,
            "barcode": p.barcode,
            "godown": g_name,
            "rack": p.rack or "-",
            "current_stock": stock,
            "purchase_price": p_cost,
            "retail_price": r_price,
            "cost_value": round(cost_val, 2),
            "retail_value": round(retail_val, 2),
            "status": "OUT_OF_STOCK" if stock <= 0 else ("LOW_STOCK" if stock <= float(p.min_stock or 5.0) else "HEALTHY")
        })

    items_breakdown.sort(key=lambda x: x["cost_value"], reverse=True)

    potential_margin = total_retail_value - total_cost_value
    margin_percent = round((potential_margin / total_retail_value * 100), 2) if total_retail_value > 0 else 0.0

    godown_summary = []
    for g in sorted(godowns.keys()):
        godowns[g]["total_units"] = round(godowns[g]["total_units"], 2)
        godowns[g]["cost_value"] = round(godowns[g]["cost_value"], 2)
        godowns[g]["retail_value"] = round(godowns[g]["retail_value"], 2)
        godown_summary.append(godowns[g])

    return {
        "summary": {
            "total_skus": total_skus,
            "total_units": round(total_units, 2),
            "total_cost_value": round(total_cost_value, 2),
            "total_retail_value": round(total_retail_value, 2),
            "potential_gross_margin": round(potential_margin, 2),
            "gross_margin_percent": margin_percent,
            "low_stock_count": low_stock_count,
            "out_of_stock_count": out_of_stock_count,
            "healthy_stock_count": total_skus - (low_stock_count + out_of_stock_count)
        },
        "godown_breakdown": godown_summary,
        "top_assets": items_breakdown[:10],
        "inventory_items": items_breakdown
    }


