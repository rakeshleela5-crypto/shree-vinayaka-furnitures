from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.core.database import get_db
from app.models.supplier import Supplier, SupplierPayment
from app.models.purchase import PurchaseInvoice
from app.models.returns import PurchaseReturn
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse, SupplierPaymentCreate, SupplierPaymentResponse

router = APIRouter()

@router.get("/", response_model=List[SupplierResponse])
def get_suppliers(
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Supplier).filter(Supplier.active == True)
    if search:
        s = f"%{search}%"
        query = query.filter((Supplier.name.ilike(s)) | (Supplier.code.ilike(s)) | (Supplier.contact_no.ilike(s)))
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=SupplierResponse)
def create_supplier(payload: SupplierCreate, db: Session = Depends(get_db)):
    existing = db.query(Supplier).filter(Supplier.code == payload.code).first()
    if existing:
        for k, v in payload.model_dump().items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
    
    db_supplier = Supplier(**payload.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@router.get("/payments", response_model=List[SupplierPaymentResponse])
def get_supplier_payments(
    supplier_id: Optional[int] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(SupplierPayment)
    if supplier_id:
        query = query.filter(SupplierPayment.supplier_id == supplier_id)
    return query.order_by(SupplierPayment.id.desc()).offset(skip).limit(limit).all()

@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(supplier_id: int, payload: SupplierUpdate, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(supplier, k, v)
    db.commit()
    db.refresh(supplier)
    return supplier

@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    supplier.active = False
    db.commit()
    return {"message": "Supplier deleted successfully", "id": supplier_id}

@router.post("/payments", response_model=SupplierPaymentResponse)
def record_supplier_payment(payload: SupplierPaymentCreate, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == payload.supplier_id).with_for_update().first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    payment = SupplierPayment(**payload.model_dump())
    supplier.current_balance = max(0.0, supplier.current_balance - payload.amount)
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def compute_supplier_statement_data(
    supplier: Supplier,
    db: Session,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None
) -> Dict[str, Any]:
    purchases = db.query(PurchaseInvoice).filter(PurchaseInvoice.supplier_id == supplier.id).all()
    payments = db.query(SupplierPayment).filter(SupplierPayment.supplier_id == supplier.id).all()
    returns = db.query(PurchaseReturn).filter(PurchaseReturn.supplier_id == supplier.id).all()

    all_tx = []
    for p in purchases:
        all_tx.append({
            "id": p.id,
            "date": p.date or "",
            "voucher_no": p.invoice_no,
            "type": "PURCHASE",
            "particulars": f"Purchase Inv #{p.invoice_no}" + (f" (Ref: {p.supplier_invoice_no})" if p.supplier_invoice_no else ""),
            "debit": 0.0,
            "credit": float(p.grand_total or 0.0),
            "created_at": p.created_at
        })

    for pay in payments:
        all_tx.append({
            "id": pay.id,
            "date": pay.date or "",
            "voucher_no": pay.voucher_no,
            "type": "PAYMENT",
            "particulars": f"Payment: {pay.payment_mode}" + (f" ({pay.details})" if pay.details else ""),
            "debit": float(pay.amount or 0.0),
            "credit": 0.0,
            "created_at": pay.created_at
        })

    for ret in returns:
        all_tx.append({
            "id": ret.id,
            "date": ret.date or "",
            "voucher_no": ret.return_no,
            "type": "DEBIT_NOTE",
            "particulars": f"Debit Note / Return (Orig Inv: {ret.original_invoice_no})",
            "debit": float(ret.grand_total or 0.0),
            "credit": 0.0,
            "created_at": ret.created_at
        })

    all_tx.sort(key=lambda x: (x["date"] or "", str(x.get("created_at") or "")))

    running_balance = float(supplier.opening_balance or 0.0)
    effective_opening = running_balance

    filtered_tx = []
    for tx in all_tx:
        if from_date and tx["date"] < from_date:
            running_balance += (tx["credit"] - tx["debit"])
            effective_opening = running_balance
            continue
        
        if to_date and tx["date"] > to_date:
            continue

        running_balance += (tx["credit"] - tx["debit"])
        tx_copy = dict(tx)
        tx_copy["balance"] = round(running_balance, 2)
        filtered_tx.append(tx_copy)

    total_purchases = sum(t["credit"] for t in filtered_tx if t["type"] == "PURCHASE")
    total_payments = sum(t["debit"] for t in filtered_tx if t["type"] == "PAYMENT")
    total_returns = sum(t["debit"] for t in filtered_tx if t["type"] == "DEBIT_NOTE")

    return {
        "supplier": {
            "id": supplier.id,
            "code": supplier.code,
            "name": supplier.name,
            "company_name": supplier.company_name,
            "gstin": supplier.gstin,
            "contact_no": supplier.contact_no,
            "email": supplier.email,
            "address": supplier.address,
            "bank_name": supplier.bank_name,
            "bank_ac_no": supplier.bank_ac_no,
            "bank_ifsc": supplier.bank_ifsc,
            "current_balance": supplier.current_balance
        },
        "from_date": from_date,
        "to_date": to_date,
        "opening_balance": round(effective_opening, 2),
        "total_purchases": round(total_purchases, 2),
        "total_payments": round(total_payments, 2),
        "total_returns": round(total_returns, 2),
        "closing_balance": round(running_balance, 2),
        "transactions": filtered_tx
    }


def generate_supplier_statement_pdf_bytes(stmt: Dict[str, Any]) -> bytes:
    import io
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, rightMargin=22, leftMargin=22, topMargin=24, bottomMargin=24)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('StoreTitle', fontName='Helvetica-Bold', fontSize=14, leading=17, alignment=1)
    sub_style = ParagraphStyle('StoreSub', fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor('#475569'), alignment=1)
    badge_style = ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=10.5, leading=13, textColor=colors.HexColor('#0f766e'), alignment=1)

    supp = stmt["supplier"]
    period_str = f"{stmt['from_date'] or 'Inception'} to {stmt['to_date'] or 'Present'}"

    story = [
        Paragraph("<b>SHREE VINAYAKA FURNITURES</b>", title_style),
        Paragraph("NH Bypass Road, Kozhikode, Kerala - 673004 | Phone: +91 98470 12345 | GSTIN: 32AABCS1429B1Z8", sub_style),
        Spacer(1, 8),
        Paragraph("<b>SUPPLIER STATEMENT OF ACCOUNT (AP LEDGER AUDIT)</b>", badge_style),
        Spacer(1, 8),
    ]

    supp_info = [
        [
            Paragraph(f"Supplier: <b>{supp['name']}</b><br/>Company: {supp['company_name'] or 'N/A'}<br/>Code: <b>{supp['code']}</b><br/>GSTIN: <b>{supp['gstin'] or 'URP / Not Registered'}</b>", styles['Normal']),
            Paragraph(f"Statement Period: <b>{period_str}</b><br/>Contact: {supp['contact_no']}<br/>Bank A/c: {supp['bank_ac_no'] or 'N/A'} ({supp['bank_ifsc'] or ''})<br/>Address: {supp['address'] or 'N/A'}", styles['Normal']),
        ]
    ]
    supp_table = Table(supp_info, colWidths=[275, 275])
    supp_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0fdfa')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(supp_table)
    story.append(Spacer(1, 8))

    kpi_data = [
        ["Opening Balance", "Total Purchases (+)", "Total Payments (-)", "Debit Notes (-)", "Closing Balance Due"],
        [f"₹{stmt['opening_balance']:,.2f}", f"₹{stmt['total_purchases']:,.2f}", f"₹{stmt['total_payments']:,.2f}", f"₹{stmt['total_returns']:,.2f}", f"₹{stmt['closing_balance']:,.2f}"]
    ]
    kpi_table = Table(kpi_data, colWidths=[110, 110, 110, 110, 110])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f766e')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 7.5),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#99f6e4')),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#ccfbf1')),
        ('FONTNAME', (0,1), (-1,1), 'Helvetica-Bold'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 10))

    tx_table_data = [["Date", "Voucher No", "Type", "Particulars / Description", "Debit (₹)", "Credit (₹)", "Balance (₹)"]]
    for tx in stmt["transactions"]:
        tx_type_color = "#047857" if tx["type"] == "PAYMENT" else ("#b91c1c" if tx["type"] == "DEBIT_NOTE" else "#1e293b")
        tx_table_data.append([
            tx["date"],
            tx["voucher_no"],
            Paragraph(f"<font color='{tx_type_color}'><b>{tx['type']}</b></font>", styles['Normal']),
            Paragraph(tx["particulars"], styles['Normal']),
            f"₹{tx['debit']:,.2f}" if tx["debit"] > 0 else "-",
            f"₹{tx['credit']:,.2f}" if tx["credit"] > 0 else "-",
            f"₹{tx['balance']:,.2f}"
        ])

    if len(tx_table_data) == 1:
        tx_table_data.append(["-", "-", "-", "No transactions found in selected period", "-", "-", f"₹{stmt['closing_balance']:,.2f}"])

    tx_table = Table(tx_table_data, colWidths=[55, 80, 60, 165, 60, 60, 70])
    tx_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#134e4a')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 7),
        ('ALIGN', (0,0), (2,-1), 'CENTER'),
        ('ALIGN', (3,0), (3,-1), 'LEFT'),
        ('ALIGN', (4,0), (-1,-1), 'RIGHT'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(tx_table)
    story.append(Spacer(1, 14))

    notes = """<b>Statutory Audit Confirmation:</b><br/>
1. This is a computer-generated statement of accounts payable for supplier reconciliation.<br/>
2. Please verify all invoices, returns, and payment entries. Report differences within 7 days.<br/>
3. Closing balance reflects net liability payable as per books of Shree Vinayaka Furnitures."""
    story.append(Paragraph(notes, styles['Normal']))
    story.append(Spacer(1, 20))

    sig_table = Table([
        ["\n\n___________________________\n<b>Accounts Department</b>", 
         "\n\n___________________________\n<b>Finance Head / Signatory</b>", 
         "\n\n___________________________\n<b>Supplier Acknowledgment & Stamp</b>"]
    ], colWidths=[180, 185, 185])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTSIZE', (0,0), (-1,-1), 7.5),
    ]))
    story.append(sig_table)

    doc.build(story)
    return buf.getvalue()


@router.get("/{supplier_id}/statement")
def get_supplier_statement(
    supplier_id: int,
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get chronological Supplier Statement of Account (AP Ledger) with running balances.
    """
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return compute_supplier_statement_data(supplier, db, from_date, to_date)


@router.get("/{supplier_id}/statement/pdf")
def get_supplier_statement_pdf(
    supplier_id: int,
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Generate professional printable PDF for Supplier Statement of Account (AP Ledger).
    """
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    stmt_data = compute_supplier_statement_data(supplier, db, from_date, to_date)
    pdf_bytes = generate_supplier_statement_pdf_bytes(stmt_data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="SVF_Supplier_Statement_{supplier.code}.pdf"'}
    )


