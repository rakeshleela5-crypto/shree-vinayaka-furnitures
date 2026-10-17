from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.sale import SaleInvoice, SaleInvoiceItem, HeldCart, EstimateRecord, DeliveryNote, Quotation
from app.models.product import Product, ProductSerial
from app.models.discounts import Coupon, GiftVoucher, EWayBill
from app.schemas.sale import (
    SaleInvoiceCreate, SaleInvoiceResponse,
    HeldCartCreate, HeldCartResponse,
    EstimateCreate, EstimateResponse,
    DeliveryNoteCreate, DeliveryNoteResponse, DeliveryNoteUpdate,
    QuotationCreate, QuotationResponse
)
from app.schemas.discounts import (
    CouponCreate, CouponResponse,
    GiftVoucherCreate, GiftVoucherResponse,
    EWayBillCreate, EWayBillResponse
)

from app.models.customer import Customer, CustomerLedgerEntry, LoyaltyTransaction
from app.models.user import Salesman

router = APIRouter()



@router.get("/next-invoice-no")
def get_next_invoice_no(prefix: str = "SVF", db: Session = Depends(get_db)):
    """
    Generate the strict sequential next invoice number according to Indian GST compliance.
    Format: [PREFIX]-[FY]-[0001] (e.g. SVF-2425-0001)
    """
    from datetime import datetime as dt
    now = dt.utcnow()
    # Indian Financial Year starts 1st April
    fy_start = now.year if now.month >= 4 else now.year - 1
    fy_code = f"{str(fy_start)[-2:]}{str(fy_start + 1)[-2:]}"
    prefix_pattern = f"{prefix}-{fy_code}-"
    
    latest = db.query(SaleInvoice).filter(SaleInvoice.invoice_no.like(f"{prefix_pattern}%")).order_by(SaleInvoice.id.desc()).first()
    next_seq = 1
    if latest and latest.invoice_no:
        try:
            num_part = latest.invoice_no.split("-")[-1]
            next_seq = int(num_part) + 1
        except Exception:
            next_seq = db.query(SaleInvoice).count() + 1
    else:
        total_invoices = db.query(SaleInvoice).count()
        next_seq = total_invoices + 1

    return {
        "next_invoice_no": f"{prefix_pattern}{str(next_seq).zfill(4)}",
        "financial_year": f"{fy_start}-{fy_start + 1}",
        "sequence_number": next_seq
    }

@router.get("/", response_model=List[SaleInvoiceResponse])
def get_sales_invoices(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return db.query(SaleInvoice).order_by(SaleInvoice.id.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=SaleInvoiceResponse)
def create_sale_invoice(payload: SaleInvoiceCreate, db: Session = Depends(get_db)):
    existing = db.query(SaleInvoice).filter(SaleInvoice.invoice_no == payload.invoice_no).first()
    if existing:
        # Idempotency check: if exact retry from same customer and identical grand total, return existing
        if existing.customer_name == payload.customer_name and abs((existing.grand_total or 0.0) - payload.grand_total) < 0.5:
            return existing
        # Otherwise real collision: Cashier B attempted to reuse an issued invoice number
        raise HTTPException(
            status_code=409,
            detail=f"Invoice collision: Invoice number '{payload.invoice_no}' already exists in database with different items/customer. Please fetch the next sequential invoice number."
        )

    # Server-Side Math Verification against DevTools / client tampering
    if abs((payload.paid_amount + payload.balance_due) - payload.grand_total) > 2.0:
        raise HTTPException(
            status_code=400,
            detail=f"Settlement mismatch: Paid amount (₹{payload.paid_amount:,.2f}) + Balance due (₹{payload.balance_due:,.2f}) must equal Grand Total (₹{payload.grand_total:,.2f})."
        )

    from datetime import datetime as dt
    invoice_dict = payload.model_dump(exclude={"items"})
    if not invoice_dict.get("date"):
        invoice_dict["date"] = invoice_dict.get("invoice_date") or dt.utcnow().strftime("%Y-%m-%d")

    # Map aliases if present
    if not invoice_dict.get("sub_total") and invoice_dict.get("gross_amount"):
        invoice_dict["sub_total"] = invoice_dict["gross_amount"]
    if not invoice_dict.get("cgst_total") and invoice_dict.get("cgst_amount"):
        invoice_dict["cgst_total"] = invoice_dict["cgst_amount"]
    if not invoice_dict.get("sgst_total") and invoice_dict.get("sgst_amount"):
        invoice_dict["sgst_total"] = invoice_dict["sgst_amount"]
    if not invoice_dict.get("igst_total") and invoice_dict.get("igst_amount"):
        invoice_dict["igst_total"] = invoice_dict["igst_amount"]

    inv_cols = {c.name for c in SaleInvoice.__table__.columns}
    filtered_inv = {k: v for k, v in invoice_dict.items() if k in inv_cols and v is not None}

    db_invoice = SaleInvoice(**filtered_inv)
    db.add(db_invoice)
    db.flush()

    item_cols = {c.name for c in SaleInvoiceItem.__table__.columns}
    for item_data in payload.items:
        raw_item = item_data.model_dump()
        if not raw_item.get("taxable_amount") and raw_item.get("taxable_value"):
            raw_item["taxable_amount"] = raw_item["taxable_value"]
        if not raw_item.get("total") and raw_item.get("net_amount"):
            raw_item["total"] = raw_item["net_amount"]
        if not raw_item.get("cgst_percent") and raw_item.get("cgst_rate"):
            raw_item["cgst_percent"] = raw_item["cgst_rate"]
        if not raw_item.get("sgst_percent") and raw_item.get("sgst_rate"):
            raw_item["sgst_percent"] = raw_item["sgst_rate"]
        if not raw_item.get("igst_percent") and raw_item.get("igst_rate"):
            raw_item["igst_percent"] = raw_item["igst_rate"]

        filtered_item = {k: v for k, v in raw_item.items() if k in item_cols and v is not None}
        db_item = SaleInvoiceItem(invoice_id=db_invoice.id, **filtered_item)
        db.add(db_item)
        
        # Atomic stock deduction with row-level locking (PostgreSQL SELECT FOR UPDATE)
        if item_data.product_id:
            prod = db.query(Product).filter(Product.id == item_data.product_id).with_for_update().first()
            if prod:
                # Stock availability verification to prevent double-selling
                if prod.current_stock < item_data.qty:
                    db.rollback()
                    raise HTTPException(
                        status_code=400,
                        detail=f"Insufficient godown stock for '{prod.name}'! Available: {prod.current_stock}, Requested: {item_data.qty}. Transaction rejected to prevent double-selling."
                    )
                prod.current_stock -= item_data.qty

        # Track individual furniture serial numbers if provided
        if item_data.serial_no:
            sn = db.query(ProductSerial).filter(ProductSerial.serial_no == item_data.serial_no).with_for_update().first()
            if sn:
                sn.status = "Sold"
                sn.sale_invoice_no = db_invoice.invoice_no

    # Automatically update Customer balance, Ledger, and Loyalty Points
    if db_invoice.customer_id:
        cust = db.query(Customer).filter(Customer.id == db_invoice.customer_id).with_for_update().first()
        if cust:
            # Enforce credit limit constraint at DB level
            if db_invoice.balance_due and db_invoice.balance_due > 0:
                new_balance = (cust.current_balance or 0.0) + db_invoice.balance_due
                if cust.credit_limit and new_balance > (cust.credit_limit + 1.0):
                    db.rollback()
                    raise HTTPException(
                        status_code=400,
                        detail=f"Credit limit exceeded for customer '{cust.name}'! Credit Limit: ₹{cust.credit_limit:,.2f}, Resulting Balance: ₹{new_balance:,.2f}"
                    )
                cust.current_balance = new_balance
            
            # Post entry into CustomerLedger
            ledger_entry = CustomerLedgerEntry(
                customer_id=cust.id,
                date=db_invoice.date,
                voucher_no=db_invoice.invoice_no,
                particulars=f"Sale Invoice ({db_invoice.payment_mode or 'Cash'})",
                debit=db_invoice.grand_total or 0.0,
                credit=db_invoice.paid_amount or 0.0,
                balance=cust.current_balance or 0.0
            )
            db.add(ledger_entry)

            # Deduct redeemed loyalty points if applied
            if db_invoice.loyalty_redeemed_amt and db_invoice.loyalty_redeemed_amt > 0:
                pts_redeemed = round(float(db_invoice.loyalty_redeemed_amt) / 0.10, 2)
                cust.loyalty_points = max(0.0, float(cust.loyalty_points or 0.0) - pts_redeemed)
                redeem_tx = LoyaltyTransaction(
                    customer_id=cust.id,
                    date=db_invoice.date,
                    bill_no=db_invoice.invoice_no,
                    type="Redeemed",
                    bill_amount=float(db_invoice.grand_total or 0.0),
                    points=pts_redeemed,
                    balance_points_after=cust.loyalty_points,
                    remarks="Loyalty points redeemed against invoice"
                )
                db.add(redeem_tx)
            
            # Award earned loyalty points on purchase (1 point per Rs.100 spent)
            if db_invoice.grand_total and db_invoice.grand_total > 0:
                pts_earned = round(float(db_invoice.grand_total) * 0.01, 2)
                cust.loyalty_points = float(cust.loyalty_points or 0.0) + pts_earned
                earn_tx = LoyaltyTransaction(
                    customer_id=cust.id,
                    date=db_invoice.date,
                    bill_no=db_invoice.invoice_no,
                    type="Earned",
                    bill_amount=float(db_invoice.grand_total or 0.0),
                    points=pts_earned,
                    balance_points_after=cust.loyalty_points,
                    remarks="Loyalty points earned from purchase"
                )
                db.add(earn_tx)

    # Automatically credit Salesman commission with row-level lock
    if db_invoice.salesman_id:
        sm = db.query(Salesman).filter(Salesman.id == db_invoice.salesman_id).with_for_update().first()
        if sm:
            grand_total = float(db_invoice.grand_total or 0.0)
            sm.total_sales = float(sm.total_sales or 0.0) + grand_total
            comm = (grand_total * float(sm.commission_percent or 0.0)) / 100.0
            sm.total_commission = float(sm.total_commission or 0.0) + comm
            sm.balance_commission = float(sm.balance_commission or 0.0) + comm

    # Update coupon usage if coupon applied
    if db_invoice.coupon_discount and db_invoice.coupon_discount > 0:
        cp = db.query(Coupon).filter(Coupon.is_active == True).first()
        if cp:
            cp.used_count = (cp.used_count or 0) + 1

    db.commit()
    db.refresh(db_invoice)
    return db_invoice


@router.post("/{invoice_id}/void")
@router.delete("/{invoice_id}")
def void_sale_invoice(invoice_id: str, db: Session = Depends(get_db)):
    """
    Safely void an issued sale invoice with full ACID reversal:
    1. Row-lock invoice and verify it is not already voided.
    2. Atomically restore all product stock quantities to Godown/Showroom.
    3. Reverse customer balance, customer ledger entry, and loyalty points.
    4. Reverse salesman commissions.
    5. Restore serialized furniture to InStock.
    6. Set invoice status to 'Voided'.
    """
    invoice = None
    if invoice_id.isdigit():
        invoice = db.query(SaleInvoice).filter(SaleInvoice.id == int(invoice_id)).with_for_update().first()
    if not invoice:
        invoice = db.query(SaleInvoice).filter(SaleInvoice.invoice_no == invoice_id).with_for_update().first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail=f"Invoice '{invoice_id}' not found")
    
    if invoice.status == "Voided":
        return {"message": "Invoice already voided", "invoice_no": invoice.invoice_no, "status": "Voided"}
    
    # 1. Restore Product Stock atomically
    items = db.query(SaleInvoiceItem).filter(SaleInvoiceItem.invoice_id == invoice.id).all()
    for item in items:
        if item.product_id:
            prod = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
            if prod:
                prod.current_stock += item.qty
    
    # 2. Reverse Customer Ledger, Balance & Loyalty
    if invoice.customer_id:
        cust = db.query(Customer).filter(Customer.id == invoice.customer_id).with_for_update().first()
        if cust:
            if invoice.balance_due and invoice.balance_due > 0:
                cust.current_balance = max(0.0, float(cust.current_balance or 0.0) - float(invoice.balance_due))
            from datetime import datetime as dt
            rev_entry = CustomerLedgerEntry(
                customer_id=cust.id,
                date=dt.utcnow().strftime("%Y-%m-%d"),
                voucher_no=f"VOID-{invoice.invoice_no}",
                particulars=f"Reversal of Voided Invoice {invoice.invoice_no}",
                debit=0.0,
                credit=float(invoice.balance_due or 0.0),
                balance=cust.current_balance or 0.0
            )
            db.add(rev_entry)

            # Revert loyalty points: refund redeemed, forfeit earned
            if invoice.loyalty_redeemed_amt and invoice.loyalty_redeemed_amt > 0:
                pts_refund = round(float(invoice.loyalty_redeemed_amt) / 0.10, 2)
                cust.loyalty_points = float(cust.loyalty_points or 0.0) + pts_refund
            if invoice.grand_total and invoice.grand_total > 0:
                pts_earned = round(float(invoice.grand_total) * 0.01, 2)
                cust.loyalty_points = max(0.0, float(cust.loyalty_points or 0.0) - pts_earned)
            
            revert_tx = LoyaltyTransaction(
                customer_id=cust.id,
                date=dt.utcnow().strftime("%Y-%m-%d"),
                bill_no=f"VOID-{invoice.invoice_no}",
                type="Adjusted",
                bill_amount=float(invoice.grand_total or 0.0),
                points=0.0,
                balance_points_after=cust.loyalty_points,
                remarks="Loyalty points adjusted due to invoice void"
            )
            db.add(revert_tx)

    # 3. Reverse Salesman Commissions
    if invoice.salesman_id:
        sm = db.query(Salesman).filter(Salesman.id == invoice.salesman_id).with_for_update().first()
        if sm:
            grand_total = float(invoice.grand_total or 0.0)
            sm.total_sales = max(0.0, float(sm.total_sales or 0.0) - grand_total)
            comm = (grand_total * float(sm.commission_percent or 0.0)) / 100.0
            sm.total_commission = max(0.0, float(sm.total_commission or 0.0) - comm)
            sm.balance_commission = max(0.0, float(sm.balance_commission or 0.0) - comm)

    # 4. Restore sold furniture serial numbers to InStock
    db.query(ProductSerial).filter(ProductSerial.sale_invoice_no == invoice.invoice_no).update(
        {"status": "InStock", "sale_invoice_no": None}
    )

    invoice.status = "Voided"
    db.commit()
    db.refresh(invoice)
    return {
        "status": "SUCCESS",
        "message": f"Invoice {invoice.invoice_no} has been voided successfully. Stock restored and ledgers reversed.",
        "invoice_no": invoice.invoice_no,
        "invoice_status": invoice.status
    }



def generate_invoice_pdf_bytes(invoice: SaleInvoice) -> bytes:
    import io
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.graphics.barcode import qr, createBarcodeDrawing
    from reportlab.graphics.shapes import Drawing

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, rightMargin=24, leftMargin=24, topMargin=24, bottomMargin=24)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'StoreTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#0f172a'),
        alignment=1
    )
    subtitle_style = ParagraphStyle(
        'StoreSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#475569'),
        alignment=1
    )
    badge_style = ParagraphStyle(
        'TaxBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=12,
        textColor=colors.HexColor('#0f766e'),
        alignment=1
    )

    story = []
    story.append(Paragraph("<b>SHREE VINAYAKA FURNITURES</b>", title_style))
    story.append(Paragraph("Specialists in Teak Wood Living, Bedroom, Dining & Office Furniture Solutions", subtitle_style))
    story.append(Paragraph("NH Bypass Road, Kozhikode, Kerala - 673004 | Phone: +91 98470 12345, 0495-2765432", subtitle_style))
    story.append(Paragraph("GSTIN: <b>32AABCS1429B1Z8</b> | State: Kerala (Code: 32) | Email: sales@vinayakafurnitures.com", subtitle_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph("<b>TAX INVOICE</b> (Under Section 31 of CGST/SGST Act)", badge_style))
    story.append(Spacer(1, 6))

    left_meta = f"""<b>Invoice No:</b> {invoice.invoice_no}<br/>
<b>Date:</b> {invoice.date} {invoice.time or ''}<br/>
<b>Bill Type:</b> {invoice.bill_type or 'Cash'}<br/>
<b>Payment Mode:</b> {invoice.payment_mode or 'Cash'}
"""
    right_meta = f"""<b>Billed To:</b> {invoice.customer_name or 'Cash Customer'}<br/>
<b>Phone:</b> {invoice.customer_phone or 'N/A'}<br/>
<b>State:</b> {invoice.state or 'Kerala'} (Code: {invoice.state_code or '32'})<br/>
<b>GSTIN:</b> {invoice.customer_gstin or 'Unregistered Consumer'}
"""
    try:
        inv_barcode = createBarcodeDrawing('Code128', value=invoice.invoice_no, barHeight=20, width=130)
        barcode_cell = [
            inv_barcode,
            Paragraph("<font size=6 color='#64748b'><b>DISPATCH / AUDIT BARCODE</b></font>", ParagraphStyle('BcSub', fontName='Helvetica-Bold', fontSize=6, alignment=1, leading=8))
        ]
    except Exception:
        barcode_cell = Paragraph(f"<b>{invoice.invoice_no}</b>", styles['Normal'])

    meta_table = Table([[Paragraph(left_meta, styles['Normal']), Paragraph(right_meta, styles['Normal']), barcode_cell]], colWidths=[185, 210, 150])
    meta_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (2,0), (2,-1), 'CENTER'),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    is_interstate = (invoice.igst_total or 0.0) > 0

    if is_interstate:
        item_header = ["#", "Item Description", "HSN", "Qty", "Rate", "Taxable", "IGST", "Total (₹)"]
        col_widths = [20, 205, 45, 30, 60, 65, 60, 60]
    else:
        item_header = ["#", "Item Description", "HSN", "Qty", "Rate", "Taxable", "CGST", "SGST", "Total (₹)"]
        col_widths = [20, 175, 42, 28, 58, 62, 50, 50, 60]

    table_data = [item_header]

    for idx, it in enumerate(invoice.items, 1):
        desc = it.product_name
        if it.barcode:
            desc += f"<br/><font size=6.5 color='#64748b'>Barcode: {it.barcode}</font>"
        
        if is_interstate:
            igst_txt = f"{it.igst_percent:.0f}%<br/>₹{it.igst_amount:.2f}" if it.igst_amount else "-"
            table_data.append([
                str(idx),
                Paragraph(desc, styles['Normal']),
                str(it.hsn_code or "9403"),
                f"{it.qty:.1f}".rstrip('0').rstrip('.'),
                f"₹{it.rate:,.2f}",
                f"₹{it.taxable_amount:,.2f}",
                Paragraph(igst_txt, styles['Normal']),
                f"₹{it.total:,.2f}"
            ])
        else:
            cgst_txt = f"{it.cgst_percent:.0f}%<br/>₹{it.cgst_amount:.2f}" if it.cgst_amount else "-"
            sgst_txt = f"{it.sgst_percent:.0f}%<br/>₹{it.sgst_amount:.2f}" if it.sgst_amount else "-"
            table_data.append([
                str(idx),
                Paragraph(desc, styles['Normal']),
                str(it.hsn_code or "9403"),
                f"{it.qty:.1f}".rstrip('0').rstrip('.'),
                f"₹{it.rate:,.2f}",
                f"₹{it.taxable_amount:,.2f}",
                Paragraph(cgst_txt, styles['Normal']),
                Paragraph(sgst_txt, styles['Normal']),
                f"₹{it.total:,.2f}"
            ])

    item_table = Table(table_data, colWidths=col_widths)
    item_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f766e')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 7.5),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('FONTSIZE', (0,1), (-1,-1), 7.5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,1), (0,-1), 'CENTER'),
        ('ALIGN', (2,1), (3,-1), 'CENTER'),
        ('ALIGN', (4,1), (-1,-1), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(item_table)
    story.append(Spacer(1, 8))

    summary_data = [
        ["Sub Total (Taxable):", f"₹{invoice.sub_total:,.2f}"]
    ]
    if (invoice.igst_total or 0.0) > 0:
        summary_data.append(["IGST Total (Interstate):", f"₹{invoice.igst_total:,.2f}"])
    else:
        summary_data.append(["CGST Total:", f"₹{invoice.cgst_total:,.2f}"])
        summary_data.append(["SGST Total:", f"₹{invoice.sgst_total:,.2f}"])
    if (invoice.cess_total or 0.0) > 0:
        summary_data.append(["Cess Total:", f"₹{invoice.cess_total:,.2f}"])
    if (invoice.bill_discount or 0.0) > 0:
        summary_data.append(["Bill Discount:", f"-₹{invoice.bill_discount:,.2f}"])
    if (invoice.coupon_discount or 0.0) > 0:
        summary_data.append(["Coupon Discount:", f"-₹{invoice.coupon_discount:,.2f}"])
    if (invoice.loyalty_redeemed_amt or 0.0) > 0:
        summary_data.append(["Loyalty Redeemed:", f"-₹{invoice.loyalty_redeemed_amt:,.2f}"])
    summary_data.extend([
        ["Round Off:", f"₹{invoice.round_off:,.2f}"],
        ["Grand Total:", f"₹{invoice.grand_total:,.2f}"],
        ["Paid Amount:", f"₹{invoice.paid_amount:,.2f}"],
        ["Balance Due:", f"₹{invoice.balance_due:,.2f}"]
    ])
    gt_idx = next(i for i, r in enumerate(summary_data) if r[0] == "Grand Total:")

    summary_table = Table(summary_data, colWidths=[120, 90])
    summary_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('FONTNAME', (0, gt_idx), (-1, gt_idx), 'Helvetica-Bold'),
        ('FONTSIZE', (0, gt_idx), (-1, gt_idx), 8.5),
        ('BACKGROUND', (0, gt_idx), (-1, gt_idx), colors.HexColor('#f1f5f9')),
        ('LINEBELOW', (0, gt_idx), (-1, gt_idx), 1, colors.HexColor('#0f766e')),
        ('TOPPADDING', (0,0), (-1,-1), 1.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1.5),
    ]))


    balance_payable = invoice.balance_due if (invoice.balance_due is not None and invoice.balance_due > 0) else invoice.grand_total
    upi_url = f"upi://pay?pa=shreevinayakafurnitures@icici&pn=SHREE%20VINAYAKA%20FURNITURES&am={balance_payable:.2f}&cu=INR&tr={invoice.invoice_no}&tn=Invoice%20{invoice.invoice_no}"
    try:
        qr_widget = qr.QrCodeWidget(upi_url)
        b = qr_widget.getBounds()
        w = b[2] - b[0]
        h = b[3] - b[1]
        qr_size = 62
        qr_draw = Drawing(qr_size, qr_size, transform=[qr_size/w, 0, 0, qr_size/h, 0, 0])
        qr_draw.add(qr_widget)
        qr_cell = [
            qr_draw,
            Paragraph("<font size=6 color='#0f766e'><b>SCAN TO PAY UPI</b></font><br/><font size=5 color='#64748b'>GPay / PhonePe / Paytm<br/>VPA: shreevinayakafurnitures@icici</font>", ParagraphStyle('QRTxt', alignment=1, leading=7))
        ]
    except Exception:
        qr_cell = [Paragraph("<font size=7 color='#64748b'>UPI: shreevinayakafurnitures@icici</font>", styles['Normal'])]

    eway_statutory = "<br/><b><font color='#b45309'>[STATUTORY: E-WAY BILL REQUIRED (CGST RULE 138 - VALUE &gt;= ₹50,000)]</font></b>" if (invoice.grand_total or 0.0) >= 50000.0 else ""
    terms_text = f"""<b>Terms & Conditions:</b><br/>
1. Goods received in good condition. 1-Year Wood Protection Warranty applies.<br/>
2. Teak wood grains & color variations are natural characteristics of hardwood.<br/>
3. Pending balance due to be settled in full upon delivery.<br/>
4. Disputes subject to Kozhikode Jurisdiction.{eway_statutory}<br/>
<i>Thank you for your patronage!</i>
"""
    bottom_table = Table([[Paragraph(terms_text, styles['Normal']), qr_cell, summary_table]], colWidths=[240, 105, 200])
    bottom_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,-1), 'CENTER'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(bottom_table)
    story.append(Spacer(1, 20))

    sig_data = [
        ["Customer Signature", "", "For SHREE VINAYAKA FURNITURES\n\n\nAuthorized Signatory"]
    ]
    sig_table = Table(sig_data, colWidths=[180, 185, 180])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('ALIGN', (2,0), (2,-1), 'RIGHT'),
        ('FONTSIZE', (0,0), (-1,-1), 7.5),
        ('LINEABOVE', (0,0), (0,0), 0.5, colors.HexColor('#94a3b8')),
        ('LINEABOVE', (2,0), (2,0), 0.5, colors.HexColor('#94a3b8')),
    ]))
    story.append(sig_table)

    doc.build(story)
    return buf.getvalue()


@router.get("/{invoice_id}/pdf")
def get_invoice_pdf_by_id(invoice_id: int, db: Session = Depends(get_db)):
    """
    Generate professional GST Tax Invoice PDF with Cloudflare R2 object archive metadata.
    """
    invoice = db.query(SaleInvoice).filter(SaleInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    pdf_bytes = generate_invoice_pdf_bytes(invoice)
    filename = f"SVF_Invoice_{invoice.invoice_no}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "X-Cloudflare-R2-Bucket": "svf-store-backups",
            "X-Cloudflare-R2-Path": f"invoices/2026-2027/{filename}",
            "X-Invoice-No": invoice.invoice_no,
            "X-GST-Financial-Year": "2026-2027"
        }
    )


@router.get("/by-no/{invoice_no}/pdf")
def get_invoice_pdf_by_number(invoice_no: str, db: Session = Depends(get_db)):
    """
    Generate professional GST Tax Invoice PDF by invoice number (e.g. SVF-2627-0001).
    """
    invoice = db.query(SaleInvoice).filter(SaleInvoice.invoice_no == invoice_no).first()
    if not invoice:
        raise HTTPException(status_code=404, detail=f"Invoice '{invoice_no}' not found")

    pdf_bytes = generate_invoice_pdf_bytes(invoice)
    filename = f"SVF_Invoice_{invoice.invoice_no}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "X-Cloudflare-R2-Bucket": "svf-store-backups",
            "X-Cloudflare-R2-Path": f"invoices/2026-2027/{filename}",
            "X-Invoice-No": invoice.invoice_no,
            "X-GST-Financial-Year": "2026-2027"
        }
    )


def generate_quotation_pdf_bytes(quotation: Quotation) -> bytes:
    import io, json
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
    badge_style = ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=10.5, leading=13, textColor=colors.HexColor('#0f766e'), alignment=1)

    story = [
        Paragraph("<b>SHREE VINAYAKA FURNITURES</b>", title_style),
        Paragraph("NH Bypass Road, Kozhikode, Kerala - 673004 | Phone: +91 98470 12345 | GSTIN: 32AABCS1429B1Z8", sub_style),
        Spacer(1, 8),
        Paragraph("<b>OFFICIAL PRICE QUOTATION</b>", badge_style),
        Spacer(1, 8),
    ]

    try:
        quo_barcode = createBarcodeDrawing('Code128', value=quotation.quotation_no, barHeight=18, width=125)
        barcode_cell = [
            quo_barcode,
            Paragraph("<font size=5.5 color='#64748b'><b>SCAN TO BILL AT POS</b></font>", ParagraphStyle('QBcSub', fontName='Helvetica-Bold', fontSize=5.5, alignment=1, leading=7))
        ]
    except Exception:
        barcode_cell = Paragraph(f"<b>{quotation.quotation_no}</b>", styles['Normal'])

    header_info = [
        [Paragraph(f"Quotation No: <b>{quotation.quotation_no}</b><br/>Customer: <b>{quotation.customer_name}</b><br/>GSTIN: {quotation.gstin or 'Unregistered / B2C'}", styles['Normal']),
         Paragraph(f"Date: <b>{quotation.date}</b><br/>Phone: {quotation.contact_no or 'N/A'}<br/>State: {quotation.state} (Code: 32)", styles['Normal']),
         barcode_cell]
    ]
    info_table = Table(header_info, colWidths=[200, 195, 150])
    info_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (2,0), (2,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 10))

    raw_items = []
    try:
        raw_items = json.loads(quotation.items_json) if quotation.items_json else []
    except Exception:
        raw_items = []

    table_data = [["#", "Item Description", "Qty", "Unit Rate", "Total (₹)"]]
    for i, it in enumerate(raw_items, 1):
        name = it.get("product_name") or it.get("name") or "Furniture Item"
        qty = float(it.get("qty", 1.0))
        rate = float(it.get("rate") or it.get("price") or 0.0)
        tot = float(it.get("total") or it.get("amount") or (qty * rate))
        table_data.append([
            str(i),
            Paragraph(f"<b>{name}</b>", styles['Normal']),
            f"{qty:.1f}".rstrip('0').rstrip('.'),
            f"₹{rate:,.2f}",
            f"₹{tot:,.2f}"
        ])

    if len(table_data) == 1:
        table_data.append(["1", "Custom Furniture Package", "1", f"₹{quotation.grand_total:,.2f}", f"₹{quotation.grand_total:,.2f}"])

    item_table = Table(table_data, colWidths=[30, 285, 55, 85, 90])
    item_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f766e')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('ALIGN', (2,0), (2,-1), 'CENTER'),
        ('ALIGN', (3,0), (-1,-1), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(item_table)
    story.append(Spacer(1, 10))

    summary_data = [
        ["Sub Total:", f"₹{quotation.sub_total:,.2f}"],
        ["Total Discount:", f"-₹{quotation.total_discount:,.2f}"],
        ["Grand Total:", f"₹{quotation.grand_total:,.2f}"]
    ]
    summary_table = Table(summary_data, colWidths=[120, 90])
    summary_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#f1f5f9')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))

    terms = """<b>Quotation Terms:</b><br/>
1. Prices quoted are valid for 30 days from date of issue.<br/>
2. Delivery within 5-7 business days upon order confirmation.<br/>
3. 1-Year Wood Protection & Craftsmanship Warranty included.
"""
    bottom_table = Table([[Paragraph(terms, styles['Normal']), summary_table]], colWidths=[335, 210])
    bottom_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(bottom_table)

    doc.build(story)
    return buf.getvalue()


def generate_estimate_pdf_bytes(estimate: EstimateRecord) -> bytes:
    import io, json
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
    badge_style = ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=10.5, leading=13, textColor=colors.HexColor('#0f766e'), alignment=1)

    story = [
        Paragraph("<b>SHREE VINAYAKA FURNITURES</b>", title_style),
        Paragraph("NH Bypass Road, Kozhikode, Kerala - 673004 | Phone: +91 98470 12345 | GSTIN: 32AABCS1429B1Z8", sub_style),
        Spacer(1, 8),
        Paragraph("<b>ESTIMATE BILL / VALUATION</b>", badge_style),
        Spacer(1, 8),
    ]

    try:
        est_barcode = createBarcodeDrawing('Code128', value=estimate.estimate_no, barHeight=18, width=125)
        barcode_cell = [
            est_barcode,
            Paragraph("<font size=5.5 color='#64748b'><b>SCAN TO BILL AT POS</b></font>", ParagraphStyle('EBcSub', fontName='Helvetica-Bold', fontSize=5.5, alignment=1, leading=7))
        ]
    except Exception:
        barcode_cell = Paragraph(f"<b>{estimate.estimate_no}</b>", styles['Normal'])

    header_info = [
        [Paragraph(f"Estimate No: <b>{estimate.estimate_no}</b><br/>Customer: <b>{estimate.customer_name}</b><br/>Address: {estimate.address or 'Walk-in Customer'}", styles['Normal']),
         Paragraph(f"Date: <b>{estimate.date}</b><br/>Phone: {estimate.contact_no or 'N/A'}<br/>State: {estimate.state}", styles['Normal']),
         barcode_cell]
    ]
    info_table = Table(header_info, colWidths=[200, 195, 150])
    info_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (2,0), (2,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 10))

    raw_items = []
    try:
        raw_items = json.loads(estimate.items_json) if estimate.items_json else []
    except Exception:
        raw_items = []

    table_data = [["#", "Item Description", "Qty", "Rate (₹)", "Total (₹)"]]
    for i, it in enumerate(raw_items, 1):
        name = it.get("product_name") or it.get("name") or "Furniture Item"
        qty = float(it.get("qty", 1.0))
        rate = float(it.get("rate") or it.get("price") or 0.0)
        tot = float(it.get("total") or it.get("amount") or (qty * rate))
        table_data.append([
            str(i),
            Paragraph(f"<b>{name}</b>", styles['Normal']),
            f"{qty:.1f}".rstrip('0').rstrip('.'),
            f"₹{rate:,.2f}",
            f"₹{tot:,.2f}"
        ])

    if len(table_data) == 1:
        table_data.append(["1", "Custom Furniture Estimate", "1", f"₹{estimate.grand_total:,.2f}", f"₹{estimate.grand_total:,.2f}"])

    item_table = Table(table_data, colWidths=[30, 285, 55, 85, 90])
    item_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f766e')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('ALIGN', (2,0), (2,-1), 'CENTER'),
        ('ALIGN', (3,0), (-1,-1), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(item_table)
    story.append(Spacer(1, 10))

    summary_data = [
        ["Sub Total:", f"₹{estimate.sub_total:,.2f}"],
        ["Discount:", f"-₹{estimate.discount:,.2f}"],
        ["Estimated Total:", f"₹{estimate.grand_total:,.2f}"]
    ]
    summary_table = Table(summary_data, colWidths=[120, 90])
    summary_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#f1f5f9')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))

    terms = """<b>Notice:</b><br/>
1. This is a preliminary price estimation, not a tax invoice.<br/>
2. Subject to final material availability and dimensional inspection.
"""
    bottom_table = Table([[Paragraph(terms, styles['Normal']), summary_table]], colWidths=[335, 210])
    bottom_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(bottom_table)

    doc.build(story)
    return buf.getvalue()


@router.get("/quotations/{quotation_id}/pdf")
def get_quotation_pdf(quotation_id: str, db: Session = Depends(get_db)):
    """
    Generate professional Quotation PDF by ID or quotation number.
    """
    quot = None
    if quotation_id.isdigit():
        quot = db.query(Quotation).filter(Quotation.id == int(quotation_id)).first()
    if not quot:
        quot = db.query(Quotation).filter(Quotation.quotation_no == quotation_id).first()
    if not quot:
        raise HTTPException(status_code=404, detail="Quotation not found")

    pdf_bytes = generate_quotation_pdf_bytes(quot)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="SVF_Quotation_{quot.quotation_no}.pdf"'}
    )


@router.get("/estimates/{estimate_id}/pdf")
def get_estimate_pdf(estimate_id: str, db: Session = Depends(get_db)):
    """
    Generate professional Estimate PDF by ID or estimate number.
    """
    est = None
    if estimate_id.isdigit():
        est = db.query(EstimateRecord).filter(EstimateRecord.id == int(estimate_id)).first()
    if not est:
        est = db.query(EstimateRecord).filter(EstimateRecord.estimate_no == estimate_id).first()
    if not est:
        raise HTTPException(status_code=404, detail="Estimate not found")

    pdf_bytes = generate_estimate_pdf_bytes(est)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="SVF_Estimate_{est.estimate_no}.pdf"'}
    )


# Held Carts (Video 17 & 20)
@router.get("/held-carts", response_model=List[HeldCartResponse])
def get_held_carts(db: Session = Depends(get_db)):
    return db.query(HeldCart).order_by(HeldCart.id.desc()).all()

@router.post("/held-carts", response_model=HeldCartResponse)
def hold_cart(payload: HeldCartCreate, db: Session = Depends(get_db)):
    db_hold = HeldCart(**payload.model_dump())
    db.add(db_hold)
    db.commit()
    db.refresh(db_hold)
    return db_hold

@router.delete("/held-carts/{hold_id}")
def delete_held_cart(hold_id: str, db: Session = Depends(get_db)):
    cart = db.query(HeldCart).filter(HeldCart.hold_id == hold_id).first()
    if cart:
        db.delete(cart)
        db.commit()
    return {"message": "Held cart cleared"}

# Estimates (Video 16)
@router.get("/estimates", response_model=List[EstimateResponse])
def get_estimates(db: Session = Depends(get_db)):
    return db.query(EstimateRecord).order_by(EstimateRecord.id.desc()).all()

@router.post("/estimates", response_model=EstimateResponse)
def create_estimate(payload: EstimateCreate, db: Session = Depends(get_db)):
    est = EstimateRecord(**payload.model_dump())
    db.add(est)
    db.commit()
    db.refresh(est)
    return est

# Delivery Notes (Video 16)
@router.get("/delivery-notes", response_model=List[DeliveryNoteResponse])
def get_delivery_notes(db: Session = Depends(get_db)):
    return db.query(DeliveryNote).order_by(DeliveryNote.id.desc()).all()

@router.post("/delivery-notes", response_model=DeliveryNoteResponse)
def create_delivery_note(payload: DeliveryNoteCreate, db: Session = Depends(get_db)):
    dn = DeliveryNote(**payload.model_dump())
    db.add(dn)
    db.commit()
    db.refresh(dn)
    return dn

@router.put("/delivery-notes/{dn_id}", response_model=DeliveryNoteResponse)
def update_delivery_note(dn_id: int, payload: DeliveryNoteUpdate, db: Session = Depends(get_db)):
    dn = db.query(DeliveryNote).filter(DeliveryNote.id == dn_id).first()
    if not dn:
        raise HTTPException(status_code=404, detail="Delivery note not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        if v is not None:
            setattr(dn, k, v)
    db.commit()
    db.refresh(dn)
    return dn


# Quotations (Video 17 & 20)
@router.get("/quotations", response_model=List[QuotationResponse])
def get_quotations(db: Session = Depends(get_db)):
    return db.query(Quotation).order_by(Quotation.id.desc()).all()

@router.post("/quotations", response_model=QuotationResponse)
def create_quotation(payload: QuotationCreate, db: Session = Depends(get_db)):
    existing = db.query(Quotation).filter(Quotation.quotation_no == payload.quotation_no).first()
    if existing:
        for k, v in payload.model_dump().items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
    quot = Quotation(**payload.model_dump())
    db.add(quot)
    db.commit()
    db.refresh(quot)
    return quot

@router.delete("/quotations/{quotation_id}")
def delete_quotation(quotation_id: str, db: Session = Depends(get_db)):
    quot = None
    if quotation_id.isdigit():
        quot = db.query(Quotation).filter(Quotation.id == int(quotation_id)).first()
    if not quot:
        quot = db.query(Quotation).filter(Quotation.quotation_no == quotation_id).first()
    if quot:
        db.delete(quot)
        db.commit()
    return {"message": "Quotation deleted"}

# Coupons (Video 13 & 16)
@router.get("/coupons", response_model=List[CouponResponse])
def get_coupons(db: Session = Depends(get_db)):
    return db.query(Coupon).filter(Coupon.is_active == True).all()

@router.post("/coupons", response_model=CouponResponse)
def create_coupon(payload: CouponCreate, db: Session = Depends(get_db)):
    existing = db.query(Coupon).filter(Coupon.code == payload.code).first()
    if existing:
        for k, v in payload.model_dump().items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
    coupon = Coupon(**payload.model_dump())
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon

# Gift Vouchers (Video 13)
@router.get("/gift-vouchers", response_model=List[GiftVoucherResponse])
def get_gift_vouchers(db: Session = Depends(get_db)):
    return db.query(GiftVoucher).all()

@router.post("/gift-vouchers", response_model=GiftVoucherResponse)
def create_gift_voucher(payload: GiftVoucherCreate, db: Session = Depends(get_db)):
    existing = db.query(GiftVoucher).filter(GiftVoucher.voucher_code == payload.voucher_code).first()
    if existing:
        for k, v in payload.model_dump().items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
    voucher = GiftVoucher(**payload.model_dump())
    db.add(voucher)
    db.commit()
    db.refresh(voucher)
    return voucher

# E-Way Bills (Video 16 & 19)
@router.get("/eway-bills", response_model=List[EWayBillResponse])
def get_eway_bills(db: Session = Depends(get_db)):
    return db.query(EWayBill).order_by(EWayBill.id.desc()).all()

@router.post("/eway-bills", response_model=EWayBillResponse)
def create_eway_bill(payload: EWayBillCreate, db: Session = Depends(get_db)):
    existing = db.query(EWayBill).filter(EWayBill.eway_bill_no == payload.eway_bill_no).first()
    if existing:
        for k, v in payload.model_dump().items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
    eway = EWayBill(**payload.model_dump())
    db.add(eway)
    db.commit()
    db.refresh(eway)
    return eway
