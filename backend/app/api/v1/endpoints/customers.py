from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.customer import Customer, CustomerLedgerEntry, LoyaltyTransaction
from app.models.accounting import IncomeVoucher
from app.schemas.customer import (
    CustomerCreate, CustomerUpdate, CustomerResponse,
    CustomerLedgerEntryResponse, LoyaltyTransactionResponse
)

router = APIRouter()

@router.get("/", response_model=List[CustomerResponse])
def get_customers(
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Customer).filter(Customer.active == True)
    if search:
        s = f"%{search}%"
        query = query.filter((Customer.name.ilike(s)) | (Customer.phone.ilike(s)) | (Customer.code.ilike(s)))
    return query.offset(skip).limit(limit).all()

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.post("/", response_model=CustomerResponse)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    existing = db.query(Customer).filter(Customer.code == payload.code).first()
    if existing:
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    
    db_customer = Customer(**payload.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: int, payload: CustomerUpdate, db: Session = Depends(get_db)):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_customer, key, value)
    
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if db_customer:
        db_customer.active = False
        db.commit()
    return {"message": "Customer deactivated successfully"}

# Customer Account Ledger (Video 07 & 20)
@router.get("/{customer_id}/ledger", response_model=List[CustomerLedgerEntryResponse])
def get_customer_ledger(customer_id: int, db: Session = Depends(get_db)):
    return db.query(CustomerLedgerEntry).filter(CustomerLedgerEntry.customer_id == customer_id).order_by(CustomerLedgerEntry.id.desc()).all()

@router.post("/{customer_id}/ledger", response_model=CustomerLedgerEntryResponse)
def add_customer_ledger_entry(customer_id: int, payload: dict, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).with_for_update().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    debit = float(payload.get("debit", 0.0))
    credit = float(payload.get("credit", 0.0))
    customer.current_balance = float(customer.current_balance or 0.0) + debit - credit
    
    entry = CustomerLedgerEntry(
        customer_id=customer_id,
        date=payload.get("date", ""),
        voucher_no=payload.get("voucher_no", ""),
        particulars=payload.get("particulars", ""),
        debit=debit,
        credit=credit,
        balance=customer.current_balance
    )
    db.add(entry)

    # Automatically sync customer cash/bank receipts into IncomeVouchers for Cash Book / Z-Report till reconciliation
    if credit > 0:
        import json, datetime
        part_text = (payload.get("particulars") or "").lower()
        if "upi" in part_text or "gpay" in part_text or "phonepe" in part_text or "qr" in part_text:
            pm = "UPI"
        elif "card" in part_text or "pos" in part_text:
            pm = "Card"
        elif "bank" in part_text or "neft" in part_text or "rtgs" in part_text or "cheque" in part_text:
            pm = "Bank Transfer"
        else:
            pm = payload.get("payment_mode", "Cash")

        v_no = payload.get('voucher_no') or f"RCPT-{int(datetime.datetime.utcnow().timestamp())}"
        inc = IncomeVoucher(
            voucher_no=f"INC-{v_no}",
            date=payload.get("date") or datetime.date.today().isoformat(),
            name=customer.name,
            details=f"Customer Khata Settlement: {payload.get('particulars', '')}",
            payment_mode=pm,
            grand_total=credit,
            items_json=json.dumps([{
                "particulars": f"Ledger Credit Settlement from {customer.name}",
                "amount": credit,
                "notes": f"Voucher: {v_no}"
            }])
        )
        db.add(inc)

    db.commit()
    db.refresh(entry)
    return entry

# Customer Loyalty Transactions (Video 09 & 13)
@router.get("/{customer_id}/loyalty", response_model=List[LoyaltyTransactionResponse])
def get_customer_loyalty(customer_id: int, db: Session = Depends(get_db)):
    return db.query(LoyaltyTransaction).filter(LoyaltyTransaction.customer_id == customer_id).order_by(LoyaltyTransaction.id.desc()).all()

@router.post("/{customer_id}/loyalty", response_model=LoyaltyTransactionResponse)
def add_customer_loyalty_transaction(customer_id: int, payload: dict, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).with_for_update().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    pts = float(payload.get("points", 0.0))
    if payload.get("type") == "Redeemed":
        customer.loyalty_points = max(0.0, float(customer.loyalty_points or 0.0) - pts)
    else:
        customer.loyalty_points = float(customer.loyalty_points or 0.0) + pts
        
    tx = LoyaltyTransaction(
        customer_id=customer_id,
        date=payload.get("date", ""),
        bill_no=payload.get("bill_no", ""),
        type=payload.get("type", "Earned"),
        bill_amount=float(payload.get("bill_amount", 0.0)),
        points=pts,
        point_value_rate=float(payload.get("point_value_rate", 0.10)),
        equivalent_amount=float(payload.get("equivalent_amount", 0.0)),
        balance_points_after=customer.loyalty_points,
        remarks=payload.get("remarks")
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.get("/{customer_id}/statement/pdf")
def get_customer_statement_pdf(customer_id: int, db: Session = Depends(get_db)):
    """
    Generate professional Customer Account Statement (Khata Ledger) PDF.
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    ledger_entries = db.query(CustomerLedgerEntry).filter(
        CustomerLedgerEntry.customer_id == customer_id
    ).order_by(CustomerLedgerEntry.id.asc()).all()

    import io
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

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
        Paragraph("<b>CUSTOMER ACCOUNT STATEMENT (KHATA LEDGER)</b>", badge_style),
        Spacer(1, 10),
    ]

    cust_info = [
        [f"Customer: {customer.name} ({customer.code})", f"Phone: {customer.phone}"],
        [f"Address: {customer.address or 'N/A'}, {customer.city or ''} ({customer.state})", f"Credit Limit: Rs.{customer.credit_limit:,.2f}"],
        [f"Total Pending Balance: Rs.{customer.current_balance:,.2f}", f"Loyalty Points: {customer.loyalty_points:,.1f} pts"]
    ]
    info_table = Table(cust_info, colWidths=[330, 215])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('FONTNAME', (0,2), (0,2), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0,2), (0,2), colors.HexColor('#b91c1c')),
        ('TOPPADDING', (0,0), (-1,-1), 1),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 10))

    headers = ["Date", "Voucher No", "Particulars", "Debit (Dr)", "Credit (Cr)", "Balance"]
    rows = [headers]
    for e in ledger_entries:
        rows.append([
            e.date,
            e.voucher_no,
            Paragraph(e.particulars, styles['Normal']),
            f"Rs.{e.debit:,.2f}" if e.debit else "-",
            f"Rs.{e.credit:,.2f}" if e.credit else "-",
            f"Rs.{e.balance:,.2f}"
        ])

    if len(rows) == 1:
        rows.append(["-", "-", "No transactions recorded yet", "-", "-", f"Rs.{customer.current_balance:,.2f}"])

    table = Table(rows, colWidths=[65, 80, 190, 70, 70, 70])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f766e')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 7.5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ALIGN', (0,0), (1,-1), 'CENTER'),
        ('ALIGN', (3,1), (-1,-1), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(table)
    doc.build(story)

    return Response(
        content=buf.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="SVF_Statement_{customer.code}.pdf"'}
    )


# ==========================================
# CUSTOMER PAYMENT MONEY RECEIPT PDF (GST SEC 31(3)(d))
# ==========================================
def number_to_words_inr(amount: float) -> str:
    ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
            "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
    
    n = int(round(amount))
    if n == 0:
        return "Rupees Zero Only"
    
    def convert_hundreds(num):
        res = ""
        if num >= 100:
            res += ones[num // 100] + " Hundred "
            num %= 100
        if num >= 20:
            res += tens[num // 10] + " "
            num %= 10
        if num > 0:
            res += ones[num] + " "
        return res.strip()
    
    parts = []
    crore = n // 10000000
    n %= 10000000
    if crore > 0:
        parts.append(convert_hundreds(crore) + " Crore")
    lakh = n // 100000
    n %= 100000
    if lakh > 0:
        parts.append(convert_hundreds(lakh) + " Lakh")
    thousand = n // 1000
    n %= 1000
    if thousand > 0:
        parts.append(convert_hundreds(thousand) + " Thousand")
    if n > 0:
        parts.append(convert_hundreds(n))
        
    return "Rupees " + " ".join(parts).strip() + " Only"


@router.get("/{customer_id}/ledger/{entry_id}/receipt/pdf")
def get_customer_receipt_pdf(customer_id: int, entry_id: int, db: Session = Depends(get_db)):
    """
    Generate professional Payment Receipt / Money Receipt PDF for Khata settlement.
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    entry = db.query(CustomerLedgerEntry).filter(
        CustomerLedgerEntry.id == entry_id,
        CustomerLedgerEntry.customer_id == customer_id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Ledger entry not found")

    amount_received = float(entry.credit or 0.0)
    if amount_received <= 0.0:
        raise HTTPException(status_code=400, detail="Ledger entry is a debit charge, not a cash/credit receipt")

    balance_before = float(entry.balance or 0.0) + amount_received

    import io
    from reportlab.lib.pagesizes import A5, landscape
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.graphics.barcode import createBarcodeDrawing

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A5), rightMargin=20, leftMargin=20, topMargin=16, bottomMargin=16)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('StoreTitle', fontName='Helvetica-Bold', fontSize=13, leading=16, alignment=1)
    sub_style = ParagraphStyle('StoreSub', fontName='Helvetica', fontSize=7.5, leading=10, textColor=colors.HexColor('#475569'), alignment=1)
    badge_style = ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=10, leading=13, textColor=colors.HexColor('#0f766e'), alignment=1)

    story = [
        Paragraph("<b>SHREE VINAYAKA FURNITURES</b>", title_style),
        Paragraph("NH Bypass Road, Kozhikode, Kerala - 673004 | Phone: +91 98470 12345 | GSTIN: 32AABCS1429B1Z8", sub_style),
        Spacer(1, 4),
        Paragraph("<b>OFFICIAL PAYMENT RECEIPT / MONEY ACKNOWLEDGMENT</b>", badge_style),
        Paragraph("<font size=6.5 color='#64748b'>Issued under Section 31(3)(d) of CGST Act for Customer Ledger Credit</font>", sub_style),
        Spacer(1, 6),
    ]

    try:
        rcpt_barcode = createBarcodeDrawing('Code128', value=entry.voucher_no, barHeight=15, width=110)
        barcode_cell = [
            rcpt_barcode,
            Paragraph(f"<font size=5.5 color='#64748b'><b>{entry.voucher_no}</b></font>", ParagraphStyle('RcptBc', fontName='Helvetica-Bold', fontSize=5.5, alignment=1, leading=7))
        ]
    except Exception:
        barcode_cell = Paragraph(f"<b>{entry.voucher_no}</b>", styles['Normal'])

    hdr_data = [
        [Paragraph(f"Receipt No: <b>{entry.voucher_no}</b><br/>Customer: <b>{customer.name}</b> (Code: {customer.code})<br/>Contact: {customer.phone}", styles['Normal']),
         Paragraph(f"Receipt Date: <b>{entry.date}</b><br/>State: {customer.state} (Code: 32)<br/>GSTIN: {customer.gstin or 'Unregistered Consumer'}", styles['Normal']),
         barcode_cell]
    ]
    hdr_table = Table(hdr_data, colWidths=[210, 190, 140])
    hdr_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (2,0), (2,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(hdr_table)
    story.append(Spacer(1, 8))

    words = number_to_words_inr(amount_received)
    body_data = [
        ["Payment Particulars:", Paragraph(f"<b>{entry.particulars}</b>", styles['Normal'])],
        ["Amount Received in Figures:", Paragraph(f"<font size=11 color='#0f766e'><b>₹{amount_received:,.2f}</b></font>", styles['Normal'])],
        ["Amount Received in Words:", Paragraph(f"<b>{words}</b>", styles['Normal'])],
        ["Balance Due Before Payment:", f"₹{balance_before:,.2f}"],
        ["Remaining Balance After Receipt:", Paragraph(f"<font size=9.5 color='#b45309'><b>₹{float(entry.balance or 0.0):,.2f}</b></font>", styles['Normal'])],
    ]
    body_table = Table(body_data, colWidths=[180, 360])
    body_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f1f5f9')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(body_table)
    story.append(Spacer(1, 14))

    sig_data = [
        ["Customer Signature / Payer", "For Shree Vinayaka Furnitures (Cashier / Authorized Signatory)"],
        ["\n___________________________", "\n___________________________"]
    ]
    sig_table = Table(sig_data, colWidths=[270, 270])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTSIZE', (0,0), (-1,-1), 7.5),
    ]))
    story.append(sig_table)

    doc.build(story)
    return Response(
        content=buf.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="SVF_Receipt_{entry.voucher_no}.pdf"'}
    )


