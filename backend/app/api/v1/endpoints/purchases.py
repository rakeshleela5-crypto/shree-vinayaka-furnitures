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
                prod.godown_available_qty = (prod.godown_available_qty or 0.0) + item_data.qty  # W2-4 fix: keep 4-bucket stock in sync
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

from app.models.product import StockLedgerEvent
from app.core.journal_service import post_double_entry_journal
import datetime

def process_grn_intake(db: Session, payload: GoodsReceiptNoteCreate, po: Optional[PurchaseOrder] = None) -> GoodsReceiptNote:
    # 1. Calculate totals and check line items
    total_taxable = 0.0
    total_good_qty = 0.0
    total_damaged_qty = 0.0
    debit_note_amt = 0.0
    total_calculated_itc = 0.0  # W2-3 fix: per-line item ITC accumulator

    # Total goods value for proportional freight allocation
    raw_goods_value = sum(
        float(it.received_qty or it.received_good or it.ordered_qty) * float(it.unit_price or 0.0)
        for it in payload.items
    )
    freight_hamali = float(payload.freight_hamali_cost or 0.0)

    grn = GoodsReceiptNote(
        grn_no=payload.grn_no,
        po_id=po.id if po else payload.po_id,
        po_no=po.po_no if po else payload.po_no,
        date=payload.date,
        supplier_id=payload.supplier_id,
        supplier_name=payload.supplier_name,
        supplier_invoice_no=payload.supplier_invoice_no,
        supplier_invoice_date=payload.supplier_invoice_date,
        vendor_invoice_no=payload.vendor_invoice_no or payload.supplier_invoice_no,
        freight_hamali_cost=freight_hamali,
        vehicle_no=payload.vehicle_no,
        total_received_good=0.0,
        total_received_damaged=0.0,
        remarks=payload.remarks
    )
    db.add(grn)
    db.flush()

    for it in payload.items:
        rec_qty = float(it.received_qty if it.received_qty is not None else it.received_good)
        dam_qty = float(it.damaged_qty if it.damaged_qty is not None else it.received_damaged)
        unit_price = float(it.unit_price or 0.0)

        # Knock-down packet validation
        good_units = rec_qty
        quarantine_units = dam_qty

        if it.is_knockdown:
            packets_per_unit = max(1, it.packets_per_unit or 1)
            expected_packets = int(rec_qty * packets_per_unit)
            received_packets = it.total_packets_received if it.total_packets_received is not None else expected_packets
            if received_packets < expected_packets:
                missing_packets = expected_packets - received_packets
                broken_units = int((missing_packets + packets_per_unit - 1) // packets_per_unit)
                good_units = max(0.0, rec_qty - broken_units)
                quarantine_units += broken_units
                it.missing_packets_count = missing_packets
                it.carton_boxes_verified = False

        total_good_qty += good_units
        total_damaged_qty += quarantine_units
        line_taxable = good_units * unit_price
        total_taxable += line_taxable

        # W2-3 fix: Calculate ITC using actual product GST rate (e.g. 18% for 9403 wardrobes, 12% for 9401 chairs)
        tax_pct = 18.0
        if it.product_id:
            p_ref = db.query(Product).filter(Product.id == it.product_id).first()
            if p_ref:
                combined_gst = float(p_ref.cgst or 0.0) + float(p_ref.sgst or 0.0)
                if combined_gst > 0:
                    tax_pct = combined_gst
                elif float(p_ref.igst or 0.0) > 0:
                    tax_pct = float(p_ref.igst)
        line_itc = round(line_taxable * (tax_pct / 100.0), 2)
        total_calculated_itc += line_itc

        if quarantine_units > 0:
            debit_note_amt += (quarantine_units * unit_price)

        grn_item = GoodsReceiptNoteItem(
            grn_id=grn.id,
            product_id=it.product_id,
            product_code=it.product_code,
            product_name=it.product_name,
            barcode=it.barcode,
            ordered_qty=it.ordered_qty,
            received_good=good_units,
            received_damaged=quarantine_units,
            pending_backorder=max(0.0, it.ordered_qty - (good_units + quarantine_units)),
            unit_price=unit_price,
            damage_claim_amount=round(quarantine_units * unit_price, 2),
            target_location=it.target_location or "GODOWN",
            carton_boxes_verified=it.carton_boxes_verified,
            scanned_box_barcodes_json=it.scanned_box_barcodes_json,
            is_knockdown=it.is_knockdown,
            packets_per_unit=it.packets_per_unit or 1,
            total_packets_received=it.total_packets_received,
            missing_packets_count=it.missing_packets_count or 0
        )
        db.add(grn_item)

        # Update product stock buckets and landed cost with row-level lock
        if it.product_id:
            prod = db.query(Product).filter(Product.id == it.product_id).with_for_update().first()
            if prod:
                # Proportional freight allocation
                line_val = rec_qty * unit_price
                freight_share = (line_val / raw_goods_value * freight_hamali) if raw_goods_value > 0 else 0.0
                effective_unit_landed = unit_price + (freight_share / good_units if good_units > 0 else 0.0)

                target_bucket = "showroom_display_qty" if (it.target_location or "").upper() == "SHOWROOM" else "godown_available_qty"
                
                # 1. Update target stock bucket
                if target_bucket == "showroom_display_qty":
                    before_stock = float(prod.showroom_display_qty or 0.0)
                    prod.showroom_display_qty = before_stock + good_units
                    after_stock = prod.showroom_display_qty
                else:
                    before_stock = float(prod.godown_available_qty or 0.0)
                    prod.godown_available_qty = before_stock + good_units
                    after_stock = prod.godown_available_qty

                # Recalculate weighted average landed cost
                curr_total_sellable = float(prod.godown_available_qty or 0.0) + float(prod.showroom_display_qty or 0.0)
                old_sellable = max(0.0, curr_total_sellable - good_units)
                old_landed = float(prod.landed_cost or prod.purchase_price or unit_price)
                if curr_total_sellable > 0:
                    prod.landed_cost = round(((old_sellable * old_landed) + (good_units * effective_unit_landed)) / curr_total_sellable, 2)
                else:
                    prod.landed_cost = round(effective_unit_landed, 2)

                # Keep standard stock fields synchronized
                prod.current_stock = (prod.godown_available_qty or 0.0) + (prod.showroom_display_qty or 0.0)
                prod.physical_stock = prod.current_stock
                prod.purchase_price = unit_price

                # Audit event for good stock inward
                if good_units > 0:
                    event = StockLedgerEvent(
                        product_id=prod.id,
                        event_type="GRN_INWARD",
                        bucket=target_bucket,
                        before_qty=before_stock,
                        delta_qty=good_units,
                        after_qty=after_stock,
                        reference_id=grn.grn_no,
                        reason_code="SUPPLIER_PURCHASE_RECEIPT",
                        performed_by="INVENTORY_MANAGER",
                        notes=f"GRN {grn.grn_no} from {payload.supplier_name}"
                    )
                    db.add(event)

                # 2. Update quarantine bucket if damaged or missing KD packets
                if quarantine_units > 0:
                    dam_before = float(prod.damaged_quarantine_qty or 0.0)
                    prod.damaged_quarantine_qty = dam_before + quarantine_units
                    dam_after = prod.damaged_quarantine_qty
                    prod.damaged_stock = prod.damaged_quarantine_qty

                    dam_event = StockLedgerEvent(
                        product_id=prod.id,
                        event_type="DAMAGE_QUARANTINE",
                        bucket="damaged_quarantine_qty",
                        before_qty=dam_before,
                        delta_qty=quarantine_units,
                        after_qty=dam_after,
                        reference_id=grn.grn_no,
                        reason_code="TRANSIT_DAMAGE_OR_MISSING_KD_PACKET",
                        performed_by="INVENTORY_MANAGER",
                        notes=f"Quarantined {quarantine_units} units on GRN {grn.grn_no}"
                    )
                    db.add(dam_event)

        # Update PO Item if linked
        if po and it.product_id:
            po_item = db.query(PurchaseOrderItem).filter(
                PurchaseOrderItem.po_id == po.id,
                PurchaseOrderItem.product_id == it.product_id
            ).with_for_update().first()
            if po_item:
                po_item.received_good_qty = float(po_item.received_good_qty or 0.0) + good_units
                po_item.received_damaged_qty = float(po_item.received_damaged_qty or 0.0) + quarantine_units
                po_item.pending_qty = max(0.0, po_item.ordered_qty - po_item.received_good_qty)

    grn.total_received_good = total_good_qty
    grn.total_received_damaged = total_damaged_qty

    if debit_note_amt > 0:
        now_str = datetime.datetime.utcnow().strftime("%Y%m%d%H%M%S")
        grn.vendor_debit_note_no = f"DN-VEND-{payload.supplier_id}-{now_str[-6:]}"
        grn.vendor_debit_amount = round(debit_note_amt, 2)

    # Balanced Double-Entry Journal Entry
    # GST Input Credit on purchase: calculated per-item using actual product GST rates (W2-3 fix)
    gst_input_credit = round(total_calculated_itc, 2)
    grand_payable = round(total_taxable + gst_input_credit + freight_hamali, 2)

    journal_lines = [
        {
            "account_name": "Inventory Asset",
            "account_group": "Current Assets",
            "debit": round(total_taxable + freight_hamali, 2),
            "credit": 0.0,
            "party_type": None
        },
        {
            "account_name": "GST Input Credit (ITC)",
            "account_group": "Current Assets",
            "debit": gst_input_credit,
            "credit": 0.0,
            "party_type": None
        },
        {
            "account_name": "Accounts Payable (Suppliers)",
            "account_group": "Current Liabilities",
            "debit": 0.0,
            "credit": grand_payable,
            "party_type": "Supplier",
            "party_id": payload.supplier_id,
            "party_name": payload.supplier_name
        }
    ]

    jv = post_double_entry_journal(
        db=db,
        voucher_type="GRN",
        reference_no=grn.grn_no,
        narration=f"Purchase inward via GRN {grn.grn_no} from {payload.supplier_name}. Invoice: {payload.supplier_invoice_no or 'N/A'}",
        lines=journal_lines,
        date_str=payload.date
    )
    grn.journal_entry_id = jv.id

    # Update supplier current balance
    supplier = db.query(Supplier).filter(Supplier.id == payload.supplier_id).with_for_update().first()
    if supplier:
        supplier.current_balance = float(supplier.current_balance or 0.0) + grand_payable
        if debit_note_amt > 0:
            supplier.current_balance = max(0.0, supplier.current_balance - debit_note_amt)

    if po:
        po.total_received_qty = float(po.total_received_qty or 0.0) + total_good_qty
        po.total_damaged_qty = float(po.total_damaged_qty or 0.0) + total_damaged_qty
        all_po_items = db.query(PurchaseOrderItem).filter(PurchaseOrderItem.po_id == po.id).all()
        rem_pending = sum(item.pending_qty for item in all_po_items)
        po.status = "COMPLETED" if rem_pending <= 0 else "PARTIALLY_RECEIVED"

    db.commit()
    db.refresh(grn)
    return grn


@router.post("/grn", response_model=GoodsReceiptNoteResponse)
def create_standalone_grn(payload: GoodsReceiptNoteCreate, db: Session = Depends(get_db)):
    """
    Direct Goods Receipt Note (GRN) Stock Entry Pipeline with KD Packet Validation,
    4 Stock Buckets, Landed Cost Recalculation, and Double-Entry Journal Posting.
    """
    existing = db.query(GoodsReceiptNote).filter(GoodsReceiptNote.grn_no == payload.grn_no).first()
    if existing:
        return existing
    return process_grn_intake(db=db, payload=payload, po=None)


@router.post("/orders/{po_id}/grn", response_model=GoodsReceiptNoteResponse)
def record_grn_against_po(po_id: int, payload: GoodsReceiptNoteCreate, db: Session = Depends(get_db)):
    """
    GRN intake linked to a Purchase Order.
    """
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).with_for_update().first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return process_grn_intake(db=db, payload=payload, po=po)


@router.get("/grns", response_model=List[GoodsReceiptNoteResponse])
def get_goods_receipt_notes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(GoodsReceiptNote).order_by(GoodsReceiptNote.id.desc()).offset(skip).limit(limit).all()


@router.get("/grns/{grn_id}", response_model=GoodsReceiptNoteResponse)
def get_goods_receipt_note(grn_id: int, db: Session = Depends(get_db)):
    grn = db.query(GoodsReceiptNote).filter(GoodsReceiptNote.id == grn_id).first()
    if not grn:
        raise HTTPException(status_code=404, detail="Goods Receipt Note not found")
    return grn


