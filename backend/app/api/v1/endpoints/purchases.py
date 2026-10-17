from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.purchase import PurchaseInvoice, PurchaseInvoiceItem
from app.models.product import Product, ProductBatch
from app.models.supplier import Supplier
from app.schemas.purchase import PurchaseInvoiceCreate, PurchaseInvoiceResponse

router = APIRouter()

@router.get("/", response_model=List[PurchaseInvoiceResponse])
def get_purchases(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(PurchaseInvoice).order_by(PurchaseInvoice.id.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=PurchaseInvoiceResponse)
def create_purchase(payload: PurchaseInvoiceCreate, db: Session = Depends(get_db)):
    existing = db.query(PurchaseInvoice).filter(PurchaseInvoice.invoice_no == payload.invoice_no).first()
    if existing:
        return existing

    purchase_data = payload.model_dump(exclude={"items"})
    db_purchase = PurchaseInvoice(**purchase_data)
    db.add(db_purchase)
    db.flush()

    for item_data in payload.items:
        db_item = PurchaseInvoiceItem(purchase_id=db_purchase.id, **item_data.model_dump())
        db.add(db_item)
        
        # Increase stock atomically with row-level locking (Video 06 & 01)
        if item_data.product_id:
            prod = db.query(Product).filter(Product.id == item_data.product_id).with_for_update().first()
            if prod:
                prod.current_stock += item_data.qty
                prod.purchase_price = item_data.purchase_price
                if item_data.retail_price > 0:
                    prod.retail_price = item_data.retail_price

        # Update or create batch inventory atomically
        if item_data.batch_no and item_data.product_id:
            batch = db.query(ProductBatch).filter(
                ProductBatch.product_id == item_data.product_id,
                ProductBatch.batch_no == item_data.batch_no
            ).with_for_update().first()
            if batch:
                batch.available_qty = float(batch.available_qty or 0.0) + item_data.qty
                if item_data.purchase_price > 0:
                    batch.purchase_rate = item_data.purchase_price
                if item_data.retail_price > 0:
                    batch.retail_price = item_data.retail_price
            else:
                new_batch = ProductBatch(
                    product_id=item_data.product_id,
                    batch_no=item_data.batch_no,
                    purchase_rate=item_data.purchase_price,
                    retail_price=item_data.retail_price,
                    mrp=item_data.mrp,
                    available_qty=item_data.qty,
                    colour=item_data.colour,
                    size=item_data.size
                )
                db.add(new_batch)

    # Update supplier balance atomically for credit purchases
    supplier = db.query(Supplier).filter(Supplier.id == payload.supplier_id).with_for_update().first()
    if supplier:
        if (payload.purchase_type or "").strip().lower() == "credit":
            supplier.current_balance = float(supplier.current_balance or 0.0) + payload.grand_total

    db.commit()
    db.refresh(db_purchase)
    return db_purchase


@router.delete("/{purchase_id}")
def delete_purchase(purchase_id: int, db: Session = Depends(get_db)):
    """
    Safely delete a purchase invoice with atomic stock and supplier balance reversal.
    Prevents deletion if any stock from the purchase has already been sold.
    """
    purchase = db.query(PurchaseInvoice).filter(PurchaseInvoice.id == purchase_id).with_for_update().first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase invoice not found")

    # Verify and reverse stock additions
    for it in purchase.items:
        if it.product_id:
            prod = db.query(Product).filter(Product.id == it.product_id).with_for_update().first()
            if prod:
                if prod.current_stock < it.qty:
                    db.rollback()
                    raise HTTPException(
                        status_code=400,
                        detail=f"Cannot delete purchase invoice: {it.qty} units of '{prod.name}' were inwarded, but only {prod.current_stock} remain in stock (items have already been sold)."
                    )
                prod.current_stock -= it.qty

            # Reverse batch additions
            if it.batch_no:
                batch = db.query(ProductBatch).filter(
                    ProductBatch.product_id == it.product_id,
                    ProductBatch.batch_no == it.batch_no
                ).with_for_update().first()
                if batch:
                    batch.available_qty = max(0.0, float(batch.available_qty or 0.0) - it.qty)

    # Reverse supplier credit
    if (purchase.purchase_type or "").strip().lower() == "credit" and purchase.supplier_id:
        supplier = db.query(Supplier).filter(Supplier.id == purchase.supplier_id).with_for_update().first()
        if supplier:
            supplier.current_balance = max(0.0, float(supplier.current_balance or 0.0) - (purchase.grand_total or 0.0))

    db.delete(purchase)
    db.commit()
    return {"status": "SUCCESS", "message": f"Purchase invoice {purchase.invoice_no} deleted and stock/ledger reversed"}

