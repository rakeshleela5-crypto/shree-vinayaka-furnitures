import datetime
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.core.database import get_db
from app.services.realtime import realtime_manager
from app.models.inventory import StockEntry, StockEntryItem, StockAdjustment, StockTransfer
from app.models.product import Product
from app.models.discounts import ProductQuantityDiscountRule, ComboPack, BarcodeTemplate
from app.schemas.inventory import (
    StockEntryCreate, StockEntryResponse,
    StockAdjustmentCreate, StockAdjustmentResponse,
    StockTransferCreate, StockTransferResponse
)
from app.schemas.discounts import (
    ProductQuantityDiscountRuleCreate, ProductQuantityDiscountRuleResponse,
    ComboPackCreate, ComboPackResponse,
    BarcodeTemplateCreate, BarcodeTemplateResponse
)
from app.services.audit_service import log_stock_adjustment

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
        # Increase product stock atomically with row lock
        prod = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if prod:
            prod.current_stock += item.qty
            prod.physical_stock = (prod.physical_stock or 0.0) + item.qty

    db.commit()
    db.refresh(db_entry)
    realtime_manager.broadcast_sync({
        "event": "INVENTORY_UPDATED",
        "action": "STOCK_ENTRY",
        "stock_code": db_entry.stock_code,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    return db_entry

@router.delete("/stock-entries/{entry_id}")
def delete_stock_entry(entry_id: str, db: Session = Depends(get_db)):
    """
    Safely delete a stock inward entry with atomic reduction of added stock.
    """
    entry = None
    if entry_id.isdigit():
        entry = db.query(StockEntry).filter(StockEntry.id == int(entry_id)).with_for_update().first()
    if not entry:
        entry = db.query(StockEntry).filter(StockEntry.stock_code == entry_id).with_for_update().first()
    if not entry:
        raise HTTPException(status_code=404, detail="Stock entry not found")

    # Reverse added stock
    for item in entry.items:
        if item.product_id:
            prod = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
            if prod:
                prod.current_stock = max(0.0, float(prod.current_stock or 0.0) - item.qty)
                prod.physical_stock = max(0.0, float(prod.physical_stock or 0.0) - item.qty)

    code = entry.stock_code
    db.delete(entry)
    db.commit()
    realtime_manager.broadcast_sync({
        "event": "INVENTORY_UPDATED",
        "action": "STOCK_ENTRY_DELETED",
        "stock_code": code,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    return {"status": "SUCCESS", "message": f"Stock entry {code} deleted and stock reversed."}

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
        before_stock = float(prod.physical_stock if prod.physical_stock is not None else (prod.current_stock or 0.0))
        if payload.adjustment_type == "Plus":
            prod.current_stock += payload.qty
            prod.physical_stock = (prod.physical_stock or 0.0) + payload.qty
        else:
            if prod.current_stock < payload.qty:
                db.rollback()
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot reduce stock of '{prod.name}' by {payload.qty}! Only {prod.current_stock} currently available in inventory."
                )
            prod.current_stock -= payload.qty
            prod.physical_stock = max(0.0, (prod.physical_stock or 0.0) - payload.qty)

        # Immutable Financial Audit Trail (#105)
        log_stock_adjustment(
            db=db,
            product_id=prod.id,
            before_stock=before_stock,
            after_stock=float(prod.physical_stock or 0.0),
            reason=f"Stock Adjustment ({payload.adjustment_type} {payload.qty}): {getattr(payload, 'reason', getattr(payload, 'remarks', ''))}"
        )

    db.commit()
    db.refresh(db_adj)
    realtime_manager.broadcast_sync({
        "event": "INVENTORY_UPDATED",
        "action": "STOCK_ADJUSTMENT",
        "product_id": payload.product_id,
        "adjustment_code": db_adj.adjustment_code,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    return db_adj

@router.delete("/stock-adjustments/{adjustment_id}")
def delete_stock_adjustment(adjustment_id: str, db: Session = Depends(get_db)):
    """
    Safely delete a stock adjustment entry and atomically revert the product stock adjustment.
    """
    adj = None
    if adjustment_id.isdigit():
        adj = db.query(StockAdjustment).filter(StockAdjustment.id == int(adjustment_id)).with_for_update().first()
    if not adj:
        adj = db.query(StockAdjustment).filter(StockAdjustment.adjustment_code == adjustment_id).with_for_update().first()
    if not adj:
        raise HTTPException(status_code=404, detail="Stock adjustment not found")

    # Reverse product stock adjustment
    prod = db.query(Product).filter(Product.id == adj.product_id).with_for_update().first()
    if prod:
        if adj.adjustment_type == "Plus":
            # Revert Plus: deduct stock
            prod.current_stock = max(0.0, float(prod.current_stock or 0.0) - adj.qty)
            prod.physical_stock = max(0.0, float(prod.physical_stock or 0.0) - adj.qty)
        else:
            # Revert Minus: add stock back
            prod.current_stock = float(prod.current_stock or 0.0) + adj.qty
            prod.physical_stock = float(prod.physical_stock or 0.0) + adj.qty

    code = adj.adjustment_code
    db.delete(adj)
    db.commit()
    realtime_manager.broadcast_sync({
        "event": "INVENTORY_UPDATED",
        "action": "STOCK_ADJUSTMENT_DELETED",
        "adjustment_code": code,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    return {"status": "SUCCESS", "message": f"Stock adjustment {code} deleted and product stock reversed."}

# Quantity-Based Discount Rules (Video 10)
@router.get("/discount-rules", response_model=List[ProductQuantityDiscountRuleResponse])
def get_discount_rules(db: Session = Depends(get_db)):
    return db.query(ProductQuantityDiscountRule).filter(ProductQuantityDiscountRule.active == True).all()

@router.post("/discount-rules", response_model=ProductQuantityDiscountRuleResponse)
def create_discount_rule(payload: ProductQuantityDiscountRuleCreate, db: Session = Depends(get_db)):
    target_product_id = payload.product_id
    if not target_product_id and payload.barcode:
        prod = db.query(Product).filter((Product.barcode == payload.barcode) | (Product.p_code == payload.barcode)).first()
        if prod:
            target_product_id = prod.id
    if not target_product_id:
        # Fallback to first active product if unlinked general discount tier
        fallback_prod = db.query(Product).filter(Product.is_active == True).first()
        target_product_id = fallback_prod.id if fallback_prod else 1

    existing = db.query(ProductQuantityDiscountRule).filter(
        ProductQuantityDiscountRule.product_id == target_product_id,
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

    rule = ProductQuantityDiscountRule(
        product_id=target_product_id,
        min_qty=payload.min_qty,
        max_qty=payload.max_qty,
        discount_percent=payload.discount_percent,
        discount_amount=payload.discount_amount,
        active=payload.active
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.delete("/discount-rules/{rule_id}")
def delete_discount_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(ProductQuantityDiscountRule).filter(ProductQuantityDiscountRule.id == rule_id).first()
    if rule:
        db.delete(rule)
        db.commit()
    return {"message": "Discount rule removed"}


# Barcode Label Templates Master
@router.get("/barcode-templates", response_model=List[BarcodeTemplateResponse])
def get_barcode_templates(db: Session = Depends(get_db)):
    return db.query(BarcodeTemplate).order_by(BarcodeTemplate.id.asc()).all()

@router.post("/barcode-templates", response_model=BarcodeTemplateResponse)
def save_barcode_template(payload: BarcodeTemplateCreate, db: Session = Depends(get_db)):
    existing = db.query(BarcodeTemplate).filter(BarcodeTemplate.name == payload.name).first()
    if existing:
        for k, v in payload.model_dump().items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing

    template = BarcodeTemplate(**payload.model_dump())
    db.add(template)
    db.commit()
    db.refresh(template)
    return template

@router.delete("/barcode-templates/{template_id}")
def delete_barcode_template(template_id: int, db: Session = Depends(get_db)):
    tmpl = db.query(BarcodeTemplate).filter(BarcodeTemplate.id == template_id).first()
    if tmpl:
        db.delete(tmpl)
        db.commit()
    return {"status": "SUCCESS", "message": f"Barcode template {template_id} deleted"}


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
    if not prod and payload.barcode:
        prod = db.query(Product).filter(Product.barcode == payload.barcode).with_for_update().first()
    if not prod and payload.product_code:
        prod = db.query(Product).filter(Product.p_code == payload.product_code).with_for_update().first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    avail_stock = max(float(prod.current_stock or 0.0), float(prod.godown_available_qty or 0.0), float(prod.physical_stock or 0.0))
    if avail_stock < payload.qty:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transfer {payload.qty} units of '{prod.name}' from {payload.from_godown}. Only {avail_stock} available in stock."
        )

    # Move product godown and rack location atomically
    prod.godown = payload.to_godown
    if payload.to_rack:
        prod.rack = payload.to_rack

    trf = StockTransfer(**payload.model_dump())
    db.add(trf)
    db.commit()
    db.refresh(trf)
    realtime_manager.broadcast_sync({
        "event": "STOCK_TRANSFERRED",
        "transfer_no": trf.transfer_no,
        "product_id": trf.product_id,
        "to_godown": trf.to_godown,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    realtime_manager.broadcast_sync({
        "event": "INVENTORY_UPDATED",
        "product_id": trf.product_id,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    return trf


def generate_stock_transfer_pdf_bytes(trf: StockTransfer, prod: Optional[Product]) -> bytes:
    import io
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.graphics.barcode import createBarcodeDrawing

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, rightMargin=24, leftMargin=24, topMargin=24, bottomMargin=24)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('StoreTitle', fontName='Helvetica-Bold', fontSize=14, leading=17, alignment=1)
    sub_style = ParagraphStyle('StoreSub', fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor('#475569'), alignment=1)
    badge_style = ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=10.5, leading=13, textColor=colors.HexColor('#4338ca'), alignment=1)

    story = [
        Paragraph("<b>SHREE VINAYAKA FURNITURES</b>", title_style),
        Paragraph("NH Bypass Road, Kozhikode, Kerala - 673004 | Phone: +91 98470 12345 | GSTIN: 32AABCS1429B1Z8", sub_style),
        Spacer(1, 8),
        Paragraph("<b>INTERNAL STOCK TRANSFER CHALLAN (CGST Rule 55)</b>", badge_style),
        Spacer(1, 8),
    ]

    try:
        trf_barcode = createBarcodeDrawing('Code128', value=str(trf.transfer_no), barHeight=18, width=125)
        barcode_cell = [
            trf_barcode,
            Paragraph(f"<font size=5.5 color='#64748b'><b>TRANSFER: {trf.transfer_no}</b></font>", ParagraphStyle('TrfBc', fontName='Helvetica-Bold', fontSize=5.5, alignment=1, leading=7))
        ]
    except Exception:
        barcode_cell = Paragraph(f"<b>{trf.transfer_no}</b>", styles['Normal'])

    hdr_data = [
        [
            Paragraph(f"Challan No: <b>{trf.transfer_no}</b><br/>Date: <b>{trf.date}</b><br/>Reason: {trf.remarks or 'Godown replenishment'}", styles['Normal']),
            Paragraph(f"From: <b>{trf.from_godown}</b> (Rack: {trf.from_rack or 'N/A'})<br/>To: <b>{trf.to_godown}</b> (Rack: {trf.to_rack or 'N/A'})", styles['Normal']),
            barcode_cell
        ]
    ]
    hdr_table = Table(hdr_data, colWidths=[200, 195, 150])
    hdr_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eef2ff')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (2,0), (2,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(hdr_table)
    story.append(Spacer(1, 10))

    p_name = trf.product_name or (prod.name if prod else "Furniture Stock Item")
    p_code = trf.product_code or (prod.p_code if prod else "P-TRF")
    p_barcode = trf.barcode or (prod.barcode if prod else "-")
    unit_cost = prod.purchase_price if prod else 0.0
    tot_val = (trf.qty or 1.0) * unit_cost

    table_data = [
        ["#", "Item Description", "SKU / Code", "Barcode", "Transfer Qty", "Approx Valuation (₹)"],
        [
            "1",
            Paragraph(f"<b>{p_name}</b>", styles['Normal']),
            str(p_code),
            str(p_barcode),
            f"{trf.qty:.1f}".rstrip('0').rstrip('.'),
            f"₹{tot_val:,.2f}" if tot_val > 0 else "Internal Asset"
        ]
    ]
    items_table = Table(table_data, colWidths=[25, 230, 80, 80, 55, 75])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#3730a3')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('ALIGN', (2,0), (4,-1), 'CENTER'),
        ('ALIGN', (5,0), (-1,-1), 'RIGHT'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 14))

    notes = """<b>Statutory Stock Transfer Declaration (Rule 55, CGST Rules):</b><br/>
1. This challan is issued for movement of goods for reasons other than by way of supply (Internal Branch/Godown Transfer).<br/>
2. No commercial sale or consideration is involved in this movement.<br/>
3. Goods remain the asset of Shree Vinayaka Furnitures."""
    story.append(Paragraph(notes, styles['Normal']))
    story.append(Spacer(1, 20))

    sig_table = Table([
        ["\n\n___________________________\n<b>Dispatching Godown In-Charge</b>", 
         "\n\n___________________________\n<b>Driver / Internal Logistics</b>", 
         "\n\n___________________________\n<b>Receiving Godown / Showroom Sign</b>"]
    ], colWidths=[180, 180, 185])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTSIZE', (0,0), (-1,-1), 7.5),
    ]))
    story.append(sig_table)

    doc.build(story)
    return buf.getvalue()


@router.get("/stock-transfers/{transfer_id}/pdf")
def get_stock_transfer_pdf(transfer_id: str, db: Session = Depends(get_db)):
    """
    Generate statutory Stock Transfer Note PDF (CGST Rule 55 Internal Transit).
    """
    trf = None
    if transfer_id.isdigit():
        trf = db.query(StockTransfer).filter(StockTransfer.id == int(transfer_id)).first()
    if not trf:
        trf = db.query(StockTransfer).filter(StockTransfer.transfer_no == transfer_id).first()
    if not trf:
        raise HTTPException(status_code=404, detail="Stock transfer not found")

    prod = db.query(Product).filter(Product.id == trf.product_id).first()
    pdf_bytes = generate_stock_transfer_pdf_bytes(trf, prod)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="SVF_Stock_Transfer_{trf.transfer_no}.pdf"'}
    )


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


from app.models.product import StockLedgerEvent
from app.schemas.product import StockTransferRequest, StockAuditAdjustRequest, QuarantineWriteOffRequest
from app.core.journal_service import post_double_entry_journal

@router.post("/transfer-buckets")
def transfer_stock_buckets(payload: StockTransferRequest, db: Session = Depends(get_db)):
    """
    Transfers stock between buckets: Godown <-> Showroom (or Godown -> Damaged Quarantine)
    with row-level lock and immutable StockLedgerEvent audit.
    """
    prod = db.query(Product).filter(Product.id == payload.product_id).with_for_update().first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    qty = float(payload.qty)
    if qty <= 0:
        raise HTTPException(status_code=400, detail="Transfer quantity must be greater than zero")

    src = payload.source_bucket
    tgt = payload.target_bucket

    valid_buckets = ["godown_available_qty", "showroom_display_qty", "damaged_quarantine_qty"]
    if src not in valid_buckets or tgt not in valid_buckets:
        raise HTTPException(status_code=400, detail=f"Invalid bucket specified. Valid: {valid_buckets}")

    src_qty = float(getattr(prod, src, 0.0) or 0.0)
    if src_qty < qty:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock in '{src}' for '{prod.name}'. Available: {src_qty}, Requested: {qty}"
        )

    # Move stock
    setattr(prod, src, src_qty - qty)
    tgt_qty = float(getattr(prod, tgt, 0.0) or 0.0)
    setattr(prod, tgt, tgt_qty + qty)

    # Sync aggregate fields (current_stock = sellable; physical_stock = total on premises across all 4 buckets)
    prod.current_stock = (prod.godown_available_qty or 0.0) + (prod.showroom_display_qty or 0.0)
    prod.physical_stock = (prod.godown_available_qty or 0.0) + (prod.showroom_display_qty or 0.0) + (prod.reserved_booked_qty or 0.0) + (prod.damaged_quarantine_qty or 0.0)
    prod.damaged_stock = prod.damaged_quarantine_qty or 0.0
    prod.reserved_stock = prod.reserved_booked_qty or 0.0

    ev_type = "SHOWROOM_TRANSFER" if "showroom" in tgt or "showroom" in src else "DAMAGE_QUARANTINE"

    ev = StockLedgerEvent(
        product_id=prod.id,
        event_type=ev_type,
        bucket=tgt,
        before_qty=tgt_qty,
        delta_qty=qty,
        after_qty=tgt_qty + qty,
        reference_id=f"TRF-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M')}",
        reason_code=payload.reason or f"Transfer from {src} to {tgt}",
        performed_by=payload.performed_by or "USER",
        notes=payload.reason
    )
    db.add(ev)

    db.commit()
    db.refresh(prod)

    realtime_manager.broadcast_sync({
        "event": "INVENTORY_UPDATED",
        "product_id": prod.id,
        "action": "BUCKET_TRANSFER",
        "timestamp": datetime.datetime.utcnow().isoformat()
    })

    return {
        "status": "SUCCESS",
        "message": f"Successfully transferred {qty} units of '{prod.name}' from {src} to {tgt}",
        "godown_available_qty": prod.godown_available_qty,
        "showroom_display_qty": prod.showroom_display_qty,
        "damaged_quarantine_qty": prod.damaged_quarantine_qty,
        "current_stock": prod.current_stock
    }


@router.post("/audit-adjust")
def audit_adjust_stock_bucket(payload: StockAuditAdjustRequest, db: Session = Depends(get_db)):
    """
    Performs physical audit adjustment on a specific stock bucket with row lock and immutable audit event.
    """
    prod = db.query(Product).filter(Product.id == payload.product_id).with_for_update().first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    bucket = payload.bucket
    valid_buckets = ["godown_available_qty", "showroom_display_qty", "damaged_quarantine_qty", "reserved_booked_qty"]
    if bucket not in valid_buckets:
        raise HTTPException(status_code=400, detail=f"Invalid bucket specified. Valid: {valid_buckets}")

    new_qty = float(payload.new_qty)
    if new_qty < 0:
        raise HTTPException(status_code=400, detail="Stock count cannot be negative")

    old_qty = float(getattr(prod, bucket, 0.0) or 0.0)
    delta = round(new_qty - old_qty, 2)

    setattr(prod, bucket, new_qty)

    prod.current_stock = (prod.godown_available_qty or 0.0) + (prod.showroom_display_qty or 0.0)
    prod.physical_stock = (prod.godown_available_qty or 0.0) + (prod.showroom_display_qty or 0.0) + (prod.reserved_booked_qty or 0.0) + (prod.damaged_quarantine_qty or 0.0)
    prod.damaged_stock = prod.damaged_quarantine_qty or 0.0
    prod.reserved_stock = prod.reserved_booked_qty or 0.0

    ev = StockLedgerEvent(
        product_id=prod.id,
        event_type="MANUAL_AUDIT_ADJUSTMENT",
        bucket=bucket,
        before_qty=old_qty,
        delta_qty=delta,
        after_qty=new_qty,
        reference_id=f"AUDIT-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M')}",
        reason_code=payload.reason,
        performed_by=payload.performed_by or "MANAGER",
        notes=f"Physical stock audit adjustment by {payload.performed_by}: {payload.reason}"
    )
    db.add(ev)

    db.commit()
    db.refresh(prod)

    realtime_manager.broadcast_sync({
        "event": "INVENTORY_UPDATED",
        "product_id": prod.id,
        "action": "AUDIT_ADJUSTMENT",
        "timestamp": datetime.datetime.utcnow().isoformat()
    })

    return {
        "status": "SUCCESS",
        "message": f"Audited '{prod.name}' bucket '{bucket}' adjusted from {old_qty} to {new_qty} (Delta: {delta:+0.2f})",
        "bucket": bucket,
        "new_qty": new_qty,
        "delta": delta,
        "current_stock": prod.current_stock
    }


@router.post("/quarantine-write-off")
def process_quarantine_write_off(payload: QuarantineWriteOffRequest, db: Session = Depends(get_db)):
    """
    Statutory Section 17(5)(h) Damaged / Scrap Goods Write-Off Engine:
    1. Physically removes scrap units from damaged_quarantine_qty (or specified source bucket) with row lock.
    2. Calculates inventory asset write-down based on purchase price (or landed cost).
    3. Reverses Input Tax Credit (ITC) legally required under CGST Act Section 17(5)(h).
    4. Automatically generates a balanced, double-entry General Ledger Journal Entry:
       - Debit: Loss on Damaged Goods / Display Scrap (Direct Expense / P&L)
       - Credit: Inventory Asset Account (Current Assets)
       - Credit: ITC Reversal Account (CGST + SGST Duties & Taxes)
    5. Appends immutable audit event to StockLedgerEvent.
    """
    prod = db.query(Product).filter(Product.id == payload.product_id).with_for_update().first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    qty = float(payload.qty)
    if qty <= 0:
        raise HTTPException(status_code=400, detail="Write-off quantity must be strictly greater than zero")

    src = payload.source_bucket or "damaged_quarantine_qty"
    valid_buckets = ["damaged_quarantine_qty", "godown_available_qty", "showroom_display_qty"]
    if src not in valid_buckets:
        raise HTTPException(status_code=400, detail=f"Invalid bucket specified. Valid: {valid_buckets}")

    src_qty = float(getattr(prod, src, 0.0) or 0.0)
    if src_qty < qty:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot write off {qty} units from '{src}'. Only {src_qty} available in '{prod.name}'."
        )

    # 1. Deduct units from source bucket
    setattr(prod, src, round(src_qty - qty, 2))

    # Recalculate physical and sellable aggregates
    prod.current_stock = (prod.godown_available_qty or 0.0) + (prod.showroom_display_qty or 0.0)
    prod.physical_stock = (prod.godown_available_qty or 0.0) + (prod.showroom_display_qty or 0.0) + (prod.reserved_booked_qty or 0.0) + (prod.damaged_quarantine_qty or 0.0)
    prod.damaged_stock = prod.damaged_quarantine_qty or 0.0

    # 2. Financial valuation of write-off
    unit_cost = float(prod.purchase_price or prod.landed_cost or (prod.retail_price * 0.70) or 0.0)
    cost_amount = round(unit_cost * qty, 2)
    gst_rate = float(prod.gst_rate or 18.0)
    itc_reversal_amt = round(cost_amount * (gst_rate / 100.0), 2)
    cgst_itc = round(itc_reversal_amt / 2.0, 2)
    sgst_itc = round(itc_reversal_amt - cgst_itc, 2)
    total_loss_pnl = round(cost_amount + itc_reversal_amt, 2)

    # 3. Post double-entry journal voucher for Sec 17(5)(h) ITC Reversal
    now_str = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    ref_code = f"WO-175H-{prod.id}-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M')}"

    jv_lines = [
        {
            "account_name": "Loss on Damaged / Scrap Goods (P&L)",
            "account_group": "Direct Expenses",
            "debit": total_loss_pnl,
            "credit": 0.0,
            "party_type": None
        },
        {
            "account_name": "Inventory Asset Account",
            "account_group": "Current Assets",
            "debit": 0.0,
            "credit": cost_amount,
            "party_type": None
        },
        {
            "account_name": "ITC Reversal Account (CGST - Sec 17(5)(h))",
            "account_group": "Duties & Taxes",
            "debit": 0.0,
            "credit": cgst_itc,
            "party_type": None
        },
        {
            "account_name": "ITC Reversal Account (SGST - Sec 17(5)(h))",
            "account_group": "Duties & Taxes",
            "debit": 0.0,
            "credit": sgst_itc,
            "party_type": None
        }
    ]

    jv_entry = post_double_entry_journal(
        db=db,
        voucher_type="DAMAGED_SCRAP_WRITE_OFF",
        reference_no=ref_code,
        narration=f"Statutory Section 17(5)(h) Scrap Write-Off for {qty} units of '{prod.name}' (Asset Cost: ₹{cost_amount:.2f}, ITC Reversal: ₹{itc_reversal_amt:.2f}). Reason: {payload.reason}",
        lines=jv_lines,
        date_str=now_str
    )

    # 4. Record immutable StockLedgerEvent
    ev = StockLedgerEvent(
        product_id=prod.id,
        sku_code=prod.sku_code or prod.p_code,
        event_type="SCRAP_WRITE_OFF_SEC17_5H",
        bucket=src,
        before_qty=src_qty,
        delta_qty=-qty,
        after_qty=src_qty - qty,
        reference_id=jv_entry.entry_number,
        reason_code=payload.reason,
        performed_by=payload.performed_by or "STORE_MANAGER",
        notes=f"Written off under CGST Sec 17(5)(h) with ITC reversal of ₹{itc_reversal_amt:.2f}"
    )
    db.add(ev)

    db.commit()
    db.refresh(prod)

    realtime_manager.broadcast_sync({
        "event": "INVENTORY_UPDATED",
        "product_id": prod.id,
        "action": "QUARANTINE_WRITE_OFF",
        "voucher_no": jv_entry.entry_number,
        "written_off_qty": qty,
        "itc_reversed": itc_reversal_amt,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })

    return {
        "status": "SUCCESS",
        "message": f"Successfully wrote off {qty} scrap unit(s) of '{prod.name}'. Reversed ₹{itc_reversal_amt:.2f} ITC under Section 17(5)(h).",
        "product_id": prod.id,
        "written_off_qty": qty,
        "unit_cost": unit_cost,
        "cost_asset_written_off": cost_amount,
        "itc_reversed_amount": itc_reversal_amt,
        "cgst_itc_reversal": cgst_itc,
        "sgst_itc_reversal": sgst_itc,
        "total_pnl_loss": total_loss_pnl,
        "journal_entry_number": jv_entry.entry_number,
        "remaining_quarantine_qty": prod.damaged_quarantine_qty,
        "current_stock": prod.current_stock,
        "physical_stock": prod.physical_stock
    }




