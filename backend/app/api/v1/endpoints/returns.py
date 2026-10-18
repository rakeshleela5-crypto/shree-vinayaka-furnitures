import datetime
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.services.realtime import realtime_manager
from app.models.returns import SaleReturn, SaleReturnItem, PurchaseReturn, PurchaseReturnItem
from app.models.product import Product
from app.models.customer import Customer, CustomerLedgerEntry
from app.models.supplier import Supplier
from app.schemas.returns import (
    SaleReturnCreate, SaleReturnResponse,
    PurchaseReturnCreate, PurchaseReturnResponse
)

router = APIRouter()

@router.get("/sales", response_model=List[SaleReturnResponse])
def get_sale_returns(db: Session = Depends(get_db)):
    return db.query(SaleReturn).order_by(SaleReturn.id.desc()).all()

@router.post("/sales", response_model=SaleReturnResponse)
def create_sale_return(payload: SaleReturnCreate, db: Session = Depends(get_db)):
    existing = db.query(SaleReturn).filter(SaleReturn.return_no == payload.return_no).first()
    if existing:
        if existing.customer_name == payload.customer_name and abs((existing.grand_total or 0.0) - payload.grand_total) < 0.5:
            return existing
        raise HTTPException(
            status_code=409,
            detail=f"Sale return collision: Voucher '{payload.return_no}' already exists in database with different items/customer."
        )

    sr_data = payload.model_dump(exclude={"items"})
    db_sr = SaleReturn(**sr_data)
    db.add(db_sr)
    db.flush()

    for item in payload.items:
        db_item = SaleReturnItem(sale_return_id=db_sr.id, **item.model_dump())
        db.add(db_item)
        # Restore stock on return atomically with row lock (Video 03)
        if item.product_id:
            prod = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
            if prod:
                prod.current_stock += item.qty

    # Post Credit Note to Customer Ledger if customer linked
    if db_sr.customer_id:
        cust = db.query(Customer).filter(Customer.id == db_sr.customer_id).with_for_update().first()
        if cust:
            # If payment mode is Credit or Adjust, reduce customer's outstanding balance
            if db_sr.payment_mode in ["Credit", "Adjust", "Credit Note"]:
                cust.current_balance = max(0.0, float(cust.current_balance or 0.0) - float(db_sr.grand_total or 0.0))
            
            # Record Credit Note entry
            credit_entry = CustomerLedgerEntry(
                customer_id=cust.id,
                date=db_sr.date,
                voucher_no=db_sr.return_no,
                particulars=f"Credit Note / Sale Return (Inv: {db_sr.original_invoice_no})",
                debit=0.0,
                credit=float(db_sr.grand_total or 0.0),
                balance=cust.current_balance or 0.0
            )
            db.add(credit_entry)

    db.commit()
    db.refresh(db_sr)
    realtime_manager.broadcast_sync({
        "event": "INVENTORY_UPDATED",
        "action": "SALE_RETURN",
        "return_no": db_sr.return_no,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    realtime_manager.broadcast_sync({
        "event": "SALE_CREATED",
        "return_no": db_sr.return_no,
        "grand_total": db_sr.grand_total,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    if db_sr.customer_id:
        realtime_manager.broadcast_sync({
            "event": "LEDGER_UPDATED",
            "customer_id": db_sr.customer_id,
            "return_no": db_sr.return_no,
            "timestamp": datetime.datetime.utcnow().isoformat()
        })
    return db_sr


@router.post("/sales/{return_id}/void", response_model=SaleReturnResponse)
def void_sale_return(return_id: str, db: Session = Depends(get_db)):
    """
    Safely VOID a Sale Return / Credit Note.
    Atomically re-deducts the returned stock, reverses the customer's credit ledger entry,
    and updates status to VOIDED.
    """
    sr = None
    if return_id.isdigit():
        sr = db.query(SaleReturn).filter(SaleReturn.id == int(return_id)).with_for_update().first()
    if not sr:
        sr = db.query(SaleReturn).filter(SaleReturn.return_no == return_id).with_for_update().first()
    if not sr:
        raise HTTPException(status_code=404, detail="Sale return not found")

    if sr.status == "VOIDED":
        raise HTTPException(status_code=400, detail="This sale return is already voided")

    # Verify and deduct back stock from inventory
    for item in sr.items:
        if item.product_id:
            prod = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
            if prod:
                if prod.current_stock < item.qty:
                    db.rollback()
                    raise HTTPException(
                        status_code=400,
                        detail=f"Cannot void sale return: '{prod.name}' has only {prod.current_stock} in stock, but {item.qty} units were previously returned and must be deducted back."
                    )
                prod.current_stock -= item.qty

    # Reverse customer khata balance & insert reversal entry
    if sr.customer_id:
        cust = db.query(Customer).filter(Customer.id == sr.customer_id).with_for_update().first()
        if cust:
            if sr.payment_mode in ["Credit", "Adjust", "Credit Note"]:
                cust.current_balance = float(cust.current_balance or 0.0) + float(sr.grand_total or 0.0)
            
            import datetime
            reversal_entry = CustomerLedgerEntry(
                customer_id=cust.id,
                date=datetime.date.today().isoformat(),
                voucher_no=f"VOID-{sr.return_no}",
                particulars=f"VOID Cancellation: Credit Note {sr.return_no} (Inv: {sr.original_invoice_no})",
                debit=float(sr.grand_total or 0.0),
                credit=0.0,
                balance=cust.current_balance or 0.0
            )
            db.add(reversal_entry)

    sr.status = "VOIDED"
    db.commit()
    db.refresh(sr)
    realtime_manager.broadcast_sync({
        "event": "INVENTORY_UPDATED",
        "action": "VOID_SALE_RETURN",
        "return_no": sr.return_no,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    if sr.customer_id:
        realtime_manager.broadcast_sync({
            "event": "LEDGER_UPDATED",
            "customer_id": sr.customer_id,
            "return_no": sr.return_no,
            "timestamp": datetime.datetime.utcnow().isoformat()
        })
    return sr


@router.get("/purchases", response_model=List[PurchaseReturnResponse])
def get_purchase_returns(db: Session = Depends(get_db)):
    return db.query(PurchaseReturn).order_by(PurchaseReturn.id.desc()).all()

@router.post("/purchases", response_model=PurchaseReturnResponse)
def create_purchase_return(payload: PurchaseReturnCreate, db: Session = Depends(get_db)):
    existing = db.query(PurchaseReturn).filter(PurchaseReturn.return_no == payload.return_no).first()
    if existing:
        if existing.supplier_name == payload.supplier_name and abs((existing.grand_total or 0.0) - payload.grand_total) < 0.5:
            return existing
        raise HTTPException(
            status_code=409,
            detail=f"Purchase return collision: Voucher '{payload.return_no}' already exists with different items/supplier."
        )

    pr_data = payload.model_dump(exclude={"items"})
    if not pr_data.get("supplier_id"):
        sup = None
        if pr_data.get("supplier_name"):
            sup = db.query(Supplier).filter(Supplier.name == pr_data["supplier_name"]).first()
        if not sup:
            sup = db.query(Supplier).first()
        if sup:
            pr_data["supplier_id"] = sup.id

    db_pr = PurchaseReturn(**pr_data)
    db.add(db_pr)
    db.flush()

    for item in payload.items:
        db_item = PurchaseReturnItem(purchase_return_id=db_pr.id, **item.model_dump())
        db.add(db_item)
        # Deduct stock on purchase return with row-level lock and availability check
        if item.product_id:
            prod = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
            if prod:
                if prod.current_stock < item.qty:
                    db.rollback()
                    raise HTTPException(
                        status_code=400,
                        detail=f"Insufficient godown stock for '{prod.name}' to process vendor return! Available: {prod.current_stock}, Returning: {item.qty}."
                    )
                prod.current_stock -= item.qty

    # Reduce accounts payable to supplier
    if db_pr.supplier_id:
        supp = db.query(Supplier).filter(Supplier.id == db_pr.supplier_id).with_for_update().first()
        if supp:
            supp.current_balance = max(0.0, float(supp.current_balance or 0.0) - float(db_pr.grand_total or 0.0))

    db.commit()
    db.refresh(db_pr)
    return db_pr


# ==========================================
# STATUTORY CREDIT NOTE & DEBIT NOTE PDF ENGINES
# ==========================================
def generate_credit_note_pdf_bytes(sr: SaleReturn) -> bytes:
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
    badge_style = ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=10.5, leading=13, textColor=colors.HexColor('#dc2626'), alignment=1)

    story = [
        Paragraph("<b>SHREE VINAYAKA FURNITURES</b>", title_style),
        Paragraph("NH Bypass Road, Kozhikode, Kerala - 673004 | Phone: +91 98470 12345 | GSTIN: 32AABCS1429B1Z8", sub_style),
        Spacer(1, 8),
        Paragraph("<b>CREDIT NOTE (Under Section 34(1) of CGST/SGST Act)</b>", badge_style),
        Spacer(1, 8),
    ]

    try:
        cn_barcode = createBarcodeDrawing('Code128', value=sr.return_no, barHeight=18, width=125)
        barcode_cell = [
            cn_barcode,
            Paragraph("<font size=5.5 color='#64748b'><b>CREDIT NOTE VOUCHER</b></font>", ParagraphStyle('CNBc', fontName='Helvetica-Bold', fontSize=5.5, alignment=1, leading=7))
        ]
    except Exception:
        barcode_cell = Paragraph(f"<b>{sr.return_no}</b>", styles['Normal'])

    meta_info = [
        [Paragraph(f"Credit Note No: <b>{sr.return_no}</b><br/>Original Invoice No: <b>{sr.original_invoice_no}</b><br/>Customer: <b>{sr.customer_name}</b>", styles['Normal']),
         Paragraph(f"Date: <b>{sr.date}</b><br/>Settlement Mode: <b>{sr.payment_mode or 'Credit Note / Adjust'}</b><br/>Status: <b>{sr.status or 'ACTIVE'}</b>", styles['Normal']),
         barcode_cell]
    ]
    meta_table = Table(meta_info, colWidths=[200, 195, 150])
    meta_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fef2f2')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (2,0), (2,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # Items table
    table_data = [["#", "Returned Product Description", "HSN", "Qty", "Rate (₹)", "Taxable (₹)", "CGST", "SGST", "Total Credit (₹)"]]
    for i, it in enumerate(sr.items, 1):
        table_data.append([
            str(i),
            Paragraph(f"<b>{it.product_name}</b>", styles['Normal']),
            str(it.hsn_code or "9403"),
            f"{it.qty:.1f}".rstrip('0').rstrip('.'),
            f"₹{it.sales_rate:,.2f}",
            f"₹{(it.taxable_amount or 0.0):,.2f}",
            f"₹{(it.cgst_amount or 0.0):,.2f}",
            f"₹{(it.sgst_amount or 0.0):,.2f}",
            f"₹{it.total:,.2f}"
        ])

    items_table = Table(table_data, colWidths=[20, 185, 45, 35, 60, 65, 45, 45, 45])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#991b1b')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 7.5),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('ALIGN', (2,0), (3,-1), 'CENTER'),
        ('ALIGN', (4,0), (-1,-1), 'RIGHT'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 10))

    # Summary
    summary_data = [
        ["Total Credit Value (Pre-Tax):", f"₹{(sr.total or 0.0):,.2f}"],
        ["Round Off:", f"₹{(sr.round_off or 0.0):,.2f}"],
        ["<b>TOTAL CREDIT AMOUNT REFUNDED / ADJUSTED:</b>", f"<b>₹{(sr.grand_total or 0.0):,.2f}</b>"]
    ]
    summary_table = Table(summary_data, colWidths=[160, 90])
    summary_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#fee2e2')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))

    notes = """<b>Statutory Declaration (GST Section 34(1)):</b><br/>
1. This Credit Note is issued in respect of outward supply returned by recipient.<br/>
2. Input tax credit / output tax liability has been reversed accordingly.<br/>
3. Adjusted in Customer Khata Account / Cash Refunded."""
    bottom_table = Table([[Paragraph(notes, styles['Normal']), summary_table]], colWidths=[295, 250])
    bottom_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(bottom_table)
    story.append(Spacer(1, 16))

    sig_table = Table([
        ["\n\n___________________________\nCustomer Acknowledgment", "\n\n___________________________\nFor Shree Vinayaka Furnitures (Authorized Signatory)"]
    ], colWidths=[270, 275])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
    ]))
    story.append(sig_table)

    doc.build(story)
    return buf.getvalue()


def generate_debit_note_pdf_bytes(pr: PurchaseReturn) -> bytes:
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
    badge_style = ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=10.5, leading=13, textColor=colors.HexColor('#c2410c'), alignment=1)

    story = [
        Paragraph("<b>SHREE VINAYAKA FURNITURES</b>", title_style),
        Paragraph("NH Bypass Road, Kozhikode, Kerala - 673004 | Phone: +91 98470 12345 | GSTIN: 32AABCS1429B1Z8", sub_style),
        Spacer(1, 8),
        Paragraph("<b>DEBIT NOTE (Under Section 34(3) of CGST/SGST Act)</b>", badge_style),
        Spacer(1, 8),
    ]

    try:
        dn_barcode = createBarcodeDrawing('Code128', value=pr.return_no, barHeight=18, width=125)
        barcode_cell = [
            dn_barcode,
            Paragraph("<font size=5.5 color='#64748b'><b>DEBIT NOTE VOUCHER</b></font>", ParagraphStyle('DNBc', fontName='Helvetica-Bold', fontSize=5.5, alignment=1, leading=7))
        ]
    except Exception:
        barcode_cell = Paragraph(f"<b>{pr.return_no}</b>", styles['Normal'])

    meta_info = [
        [Paragraph(f"Debit Note No: <b>{pr.return_no}</b><br/>Original Vendor Bill No: <b>{pr.original_invoice_no}</b><br/>Supplier: <b>{pr.supplier_name}</b>", styles['Normal']),
         Paragraph(f"Date: <b>{pr.date}</b><br/>Tax Type: <b>{pr.tax_type or 'GST'}</b><br/>Reason: <b>Damaged / Quality Rejection</b>", styles['Normal']),
         barcode_cell]
    ]
    meta_table = Table(meta_info, colWidths=[200, 195, 150])
    meta_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fff7ed')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (2,0), (2,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # Items table
    table_data = [["#", "Returned Goods Description", "HSN", "Qty", "Purchase Rate (₹)", "CGST", "SGST", "Total Debit (₹)"]]
    for i, it in enumerate(pr.items, 1):
        table_data.append([
            str(i),
            Paragraph(f"<b>{it.product_name}</b>", styles['Normal']),
            str(it.hsn_code or "9403"),
            f"{it.qty:.1f}".rstrip('0').rstrip('.'),
            f"₹{it.purchase_rate:,.2f}",
            f"₹{(it.cgst_amount or 0.0):,.2f}",
            f"₹{(it.sgst_amount or 0.0):,.2f}",
            f"₹{it.total:,.2f}"
        ])

    items_table = Table(table_data, colWidths=[20, 215, 55, 40, 75, 45, 45, 50])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#9a3412')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 7.5),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('ALIGN', (2,0), (3,-1), 'CENTER'),
        ('ALIGN', (4,0), (-1,-1), 'RIGHT'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 10))

    # Summary
    summary_data = [
        ["Total Goods Value:", f"₹{(pr.total or 0.0):,.2f}"],
        ["Round Off:", f"₹{(pr.round_off or 0.0):,.2f}"],
        ["<b>TOTAL DEBIT AMOUNT DEDUCTED FROM PAYABLE:</b>", f"<b>₹{(pr.grand_total or 0.0):,.2f}</b>"]
    ]
    summary_table = Table(summary_data, colWidths=[180, 90])
    summary_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#ffedd5')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))

    notes = """<b>Statutory Notice (GST Section 34(3)):</b><br/>
1. We have debited your vendor account with the above amount for rejected/returned goods.<br/>
2. Please issue corresponding Credit Note or adjust against pending account payables.<br/>
3. Material dispatched back via authorized transport."""
    bottom_table = Table([[Paragraph(notes, styles['Normal']), summary_table]], colWidths=[275, 270])
    bottom_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(bottom_table)
    story.append(Spacer(1, 16))

    sig_table = Table([
        ["\n\n___________________________\nReceived / Acknowledged By (Supplier)", "\n\n___________________________\nFor Shree Vinayaka Furnitures (Authorized Signatory)"]
    ], colWidths=[270, 275])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
    ]))
    story.append(sig_table)

    doc.build(story)
    return buf.getvalue()


@router.get("/sales/{return_id}/pdf")
def get_sale_return_pdf(return_id: str, db: Session = Depends(get_db)):
    """
    Generate professional Credit Note PDF by ID or Return Voucher Number.
    """
    sr = None
    if return_id.isdigit():
        sr = db.query(SaleReturn).filter(SaleReturn.id == int(return_id)).first()
    if not sr:
        sr = db.query(SaleReturn).filter(SaleReturn.return_no == return_id).first()
    if not sr:
        raise HTTPException(status_code=404, detail="Sale return / Credit note not found")

    pdf_bytes = generate_credit_note_pdf_bytes(sr)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="SVF_Credit_Note_{sr.return_no}.pdf"'}
    )


@router.get("/purchases/{return_id}/pdf")
def get_purchase_return_pdf(return_id: str, db: Session = Depends(get_db)):
    """
    Generate professional Debit Note PDF by ID or Return Voucher Number.
    """
    pr = None
    if return_id.isdigit():
        pr = db.query(PurchaseReturn).filter(PurchaseReturn.id == int(return_id)).first()
    if not pr:
        pr = db.query(PurchaseReturn).filter(PurchaseReturn.return_no == return_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Purchase return / Debit note not found")

    pdf_bytes = generate_debit_note_pdf_bytes(pr)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="SVF_Debit_Note_{pr.return_no}.pdf"'}
    )


@router.delete("/purchases/{return_id}")
def delete_purchase_return(return_id: str, db: Session = Depends(get_db)):
    """
    Safely delete a purchase return with atomic stock restoration and accounts payable re-instatement.
    """
    pr = None
    if return_id.isdigit():
        pr = db.query(PurchaseReturn).filter(PurchaseReturn.id == int(return_id)).with_for_update().first()
    if not pr:
        pr = db.query(PurchaseReturn).filter(PurchaseReturn.return_no == return_id).with_for_update().first()
    if not pr:
        raise HTTPException(status_code=404, detail="Purchase return not found")

    # Restore stock for each returned item
    for item in pr.items:
        if item.product_id:
            prod = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
            if prod:
                prod.current_stock += item.qty

    # Restore accounts payable to supplier
    if pr.supplier_id:
        supp = db.query(Supplier).filter(Supplier.id == pr.supplier_id).with_for_update().first()
        if supp:
            supp.current_balance = float(supp.current_balance or 0.0) + float(pr.grand_total or 0.0)

    return_no = pr.return_no
    db.delete(pr)
    db.commit()
    return {"status": "SUCCESS", "message": f"Purchase return {return_no} deleted and stock/payable restored."}


