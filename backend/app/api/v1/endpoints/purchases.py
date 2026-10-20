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
                prod.physical_stock = (prod.physical_stock or 0.0) + item_data.qty
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
                prod.physical_stock = max(0.0, (prod.physical_stock or 0.0) - it.qty)

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


# ==========================================
# PURCHASE ORDERS (PO) & GRN ENDPOINTS
# ==========================================
from app.models.purchase import PurchaseOrder, PurchaseOrderItem, GoodsReceiptNote, GoodsReceiptNoteItem
from app.schemas.purchase import (
    PurchaseOrderCreate,
    PurchaseOrderResponse,
    GoodsReceiptNoteCreate,
    GoodsReceiptNoteResponse
)

@router.get("/orders", response_model=List[PurchaseOrderResponse])
def get_purchase_orders(
    status: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(PurchaseOrder)
    if status:
        query = query.filter(PurchaseOrder.status == status)
    return query.order_by(PurchaseOrder.id.desc()).offset(skip).limit(limit).all()

@router.post("/orders", response_model=PurchaseOrderResponse)
def create_purchase_order(payload: PurchaseOrderCreate, db: Session = Depends(get_db)):
    existing = db.query(PurchaseOrder).filter(PurchaseOrder.po_no == payload.po_no).first()
    if existing:
        return existing

    tot_qty = sum(item.ordered_qty for item in payload.items)
    po = PurchaseOrder(
        po_no=payload.po_no,
        date=payload.date,
        supplier_id=payload.supplier_id,
        supplier_name=payload.supplier_name,
        expected_delivery_date=payload.expected_delivery_date,
        status="PENDING",
        total_ordered_qty=tot_qty,
        total_received_qty=0.0,
        total_damaged_qty=0.0,
        sub_total=payload.sub_total,
        tax_amount=payload.tax_amount,
        grand_total=payload.grand_total,
        remarks=payload.remarks
    )
    db.add(po)
    db.flush()

    for item in payload.items:
        po_item = PurchaseOrderItem(
            po_id=po.id,
            product_id=item.product_id,
            product_code=item.product_code,
            product_name=item.product_name,
            barcode=item.barcode,
            hsn_code=item.hsn_code,
            ordered_qty=item.ordered_qty,
            received_good_qty=0.0,
            received_damaged_qty=0.0,
            pending_qty=item.ordered_qty,
            unit_price=item.unit_price,
            tax_percent=item.tax_percent,
            total_amount=item.total_amount
        )
        db.add(po_item)

    db.commit()
    db.refresh(po)
    return po

@router.get("/orders/{po_id}", response_model=PurchaseOrderResponse)
def get_purchase_order(po_id: int, db: Session = Depends(get_db)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return po

@router.post("/orders/{po_id}/grn", response_model=GoodsReceiptNoteResponse)
def record_grn_against_po(po_id: int, payload: GoodsReceiptNoteCreate, db: Session = Depends(get_db)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).with_for_update().first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    total_good = sum(it.received_good for it in payload.items)
    total_damaged = sum(it.received_damaged for it in payload.items)
    debit_note_no = None
    debit_note_amt = 0.0

    # Auto-generate Vendor Debit Note if any damaged stock arrived
    if total_damaged > 0:
        import datetime
        now_str = datetime.datetime.utcnow().strftime("%Y%m%d%H%M%S")
        debit_note_no = f"DN-VEND-{po.supplier_id}-{now_str[-6:]}"
        for it in payload.items:
            if it.received_damaged > 0:
                debit_note_amt += (it.received_damaged * (it.unit_price or 0.0))

    grn = GoodsReceiptNote(
        grn_no=payload.grn_no,
        po_id=po.id,
        po_no=po.po_no,
        date=payload.date,
        supplier_id=payload.supplier_id,
        supplier_name=payload.supplier_name,
        vendor_invoice_no=payload.vendor_invoice_no,
        vehicle_no=payload.vehicle_no,
        total_received_good=total_good,
        total_received_damaged=total_damaged,
        vendor_debit_note_no=debit_note_no,
        vendor_debit_amount=round(debit_note_amt, 2),
        remarks=payload.remarks
    )
    db.add(grn)
    db.flush()

    if debit_note_amt > 0 and po.supplier_id:
        supp = db.query(Supplier).filter(Supplier.id == po.supplier_id).with_for_update().first()
        if supp:
            supp.current_balance = max(0.0, float(supp.current_balance or 0.0) - debit_note_amt)

    for it in payload.items:
        grn_item = GoodsReceiptNoteItem(
            grn_id=grn.id,
            product_id=it.product_id,
            product_code=it.product_code,
            product_name=it.product_name,
            barcode=it.barcode,
            ordered_qty=it.ordered_qty,
            received_good=it.received_good,
            received_damaged=it.received_damaged,
            pending_backorder=max(0.0, it.ordered_qty - (it.received_good + it.received_damaged)),
            unit_price=it.unit_price,
            damage_claim_amount=round(it.received_damaged * (it.unit_price or 0.0), 2),
            carton_boxes_verified=it.carton_boxes_verified,
            scanned_box_barcodes_json=it.scanned_box_barcodes_json
        )
        db.add(grn_item)

        # Update product stock atomically with row lock
        if it.product_id:
            prod = db.query(Product).filter(Product.id == it.product_id).with_for_update().first()
            if prod:
                # Increment physical stock only by received good
                prod.physical_stock = max(0.0, float(prod.physical_stock or 0.0) + it.received_good)
                prod.current_stock = prod.physical_stock
                # Increment damaged stock by received damaged
                if it.received_damaged > 0:
                    prod.damaged_stock = max(0.0, float(prod.damaged_stock or 0.0) + it.received_damaged)

        # Update PO Item pending & received counts
        po_item = db.query(PurchaseOrderItem).filter(
            PurchaseOrderItem.po_id == po.id,
            PurchaseOrderItem.product_id == it.product_id
        ).with_for_update().first()
        if po_item:
            po_item.received_good_qty = float(po_item.received_good_qty or 0.0) + it.received_good
            po_item.received_damaged_qty = float(po_item.received_damaged_qty or 0.0) + it.received_damaged
            po_item.pending_qty = max(0.0, po_item.ordered_qty - po_item.received_good_qty)

    po.total_received_qty = float(po.total_received_qty or 0.0) + total_good
    po.total_damaged_qty = float(po.total_damaged_qty or 0.0) + total_damaged
    
    # Check if all items in PO are fully received
    all_po_items = db.query(PurchaseOrderItem).filter(PurchaseOrderItem.po_id == po.id).all()
    remaining_pending = sum(item.pending_qty for item in all_po_items)
    if remaining_pending <= 0:
        po.status = "COMPLETED"
    else:
        po.status = "PARTIALLY_RECEIVED"

    db.commit()
    db.refresh(grn)
    return grn

@router.get("/grns", response_model=List[GoodsReceiptNoteResponse])
def get_goods_receipt_notes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(GoodsReceiptNote).order_by(GoodsReceiptNote.id.desc()).offset(skip).limit(limit).all()

