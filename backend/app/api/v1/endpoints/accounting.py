from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime as dt
import re
from app.core.database import get_db
from app.models.accounting import AccountHead, ExpenseVoucher, IncomeVoucher, BankStatementEntry, ShiftSettlement
from app.models.sale import SaleInvoice, SaleInvoiceItem
from app.models.supplier import Supplier, SupplierPayment
from app.models.customer import Customer, CustomerLedgerEntry
from app.models.returns import SaleReturn
from app.schemas.accounting import (
    AccountHeadCreate, AccountHeadResponse,
    ExpenseVoucherCreate, ExpenseVoucherResponse,
    IncomeVoucherCreate, IncomeVoucherResponse,
    BankStatementEntryCreate, BankStatementEntryResponse,
    ShiftSettlementCreate, ShiftSettlementResponse,
    BankStatementBulkUploadPayload, BankReconciliationCandidatesResponse,
    ReconciliationCandidate, BankReconcileRequest
)

router = APIRouter()

@router.get("/account-heads", response_model=List[AccountHeadResponse])
def get_account_heads(db: Session = Depends(get_db)):
    return db.query(AccountHead).filter(AccountHead.active == True).all()

@router.post("/account-heads", response_model=AccountHeadResponse)
def create_account_head(payload: AccountHeadCreate, db: Session = Depends(get_db)):
    existing = db.query(AccountHead).filter(AccountHead.name == payload.name).first()
    if existing:
        existing.under_group = payload.under_group
        existing.active = payload.active
        db.commit()
        db.refresh(existing)
        return existing
    head = AccountHead(**payload.model_dump())
    db.add(head)
    db.commit()
    db.refresh(head)
    return head

@router.delete("/account-heads/{head_id}")
def delete_account_head(head_id: int, db: Session = Depends(get_db)):
    head = db.query(AccountHead).filter(AccountHead.id == head_id).first()
    if head:
        head.active = False
        db.commit()
    return {"message": "Account head deleted"}

@router.get("/expense-vouchers", response_model=List[ExpenseVoucherResponse])
def get_expense_vouchers(db: Session = Depends(get_db)):
    return db.query(ExpenseVoucher).order_by(ExpenseVoucher.id.desc()).all()

@router.post("/expense-vouchers", response_model=ExpenseVoucherResponse)
def create_expense_voucher(payload: ExpenseVoucherCreate, db: Session = Depends(get_db)):
    ev_data = payload.model_dump()
    existing = db.query(ExpenseVoucher).filter(ExpenseVoucher.voucher_no == payload.voucher_no).first()
    if existing:
        for k, v in ev_data.items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
    ev = ExpenseVoucher(**ev_data)
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev

@router.delete("/expense-vouchers/{voucher_id}")
def delete_expense_voucher(voucher_id: str, db: Session = Depends(get_db)):
    """
    Safely delete an expense voucher from cash book and accounting records.
    """
    ev = None
    if voucher_id.isdigit():
        ev = db.query(ExpenseVoucher).filter(ExpenseVoucher.id == int(voucher_id)).first()
    if not ev:
        ev = db.query(ExpenseVoucher).filter(ExpenseVoucher.voucher_no == voucher_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Expense voucher not found")
    
    v_no = ev.voucher_no
    amt = ev.grand_total
    db.delete(ev)
    db.commit()
    return {"status": "SUCCESS", "message": f"Expense voucher {v_no} of Rs.{amt:,.2f} deleted successfully."}

@router.get("/income-vouchers", response_model=List[IncomeVoucherResponse])
def get_income_vouchers(db: Session = Depends(get_db)):
    return db.query(IncomeVoucher).order_by(IncomeVoucher.id.desc()).all()

@router.post("/income-vouchers", response_model=IncomeVoucherResponse)
def create_income_voucher(payload: IncomeVoucherCreate, db: Session = Depends(get_db)):
    iv_data = payload.model_dump()
    existing = db.query(IncomeVoucher).filter(IncomeVoucher.voucher_no == payload.voucher_no).first()
    if existing:
        for k, v in iv_data.items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
    iv = IncomeVoucher(**iv_data)
    db.add(iv)
    db.commit()
    db.refresh(iv)
    return iv

@router.delete("/income-vouchers/{voucher_id}")
def delete_income_voucher(voucher_id: str, db: Session = Depends(get_db)):
    """
    Safely delete an income voucher from cash book and accounting records.
    """
    iv = None
    if voucher_id.isdigit():
        iv = db.query(IncomeVoucher).filter(IncomeVoucher.id == int(voucher_id)).first()
    if not iv:
        iv = db.query(IncomeVoucher).filter(IncomeVoucher.voucher_no == voucher_id).first()
    if not iv:
        raise HTTPException(status_code=404, detail="Income voucher not found")
    
    v_no = iv.voucher_no
    amt = iv.grand_total
    db.delete(iv)
    db.commit()
    return {"status": "SUCCESS", "message": f"Income voucher {v_no} of Rs.{amt:,.2f} deleted successfully."}

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

def generate_expense_voucher_pdf_bytes(ev: ExpenseVoucher) -> bytes:
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
    badge_style = ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=10.5, leading=13, textColor=colors.HexColor('#b45309'), alignment=1)

    story = [
        Paragraph("<b>SHREE VINAYAKA FURNITURES</b>", title_style),
        Paragraph("NH Bypass Road, Kozhikode, Kerala - 673004 | Phone: +91 98470 12345 | GSTIN: 32AABCS1429B1Z8", sub_style),
        Spacer(1, 8),
        Paragraph("<b>OFFICIAL PETTY CASH / EXPENSE VOUCHER</b>", badge_style),
        Spacer(1, 8),
    ]

    try:
        bc = createBarcodeDrawing('Code128', value=ev.voucher_no, barHeight=18, width=130)
        bc_cell = [bc, Paragraph("<font size=5.5 color='#64748b'><b>EXPENSE VOUCHER BARCODE</b></font>", ParagraphStyle('EVBc', fontName='Helvetica-Bold', fontSize=5.5, alignment=1, leading=7))]
    except Exception:
        bc_cell = Paragraph(f"<b>{ev.voucher_no}</b>", styles['Normal'])

    meta_table = Table([
        [
            Paragraph(f"Voucher No: <b>{ev.voucher_no}</b><br/>Date: <b>{ev.date}</b><br/>Disbursement Mode: <b>{ev.payment_mode or 'Cash'}</b>", styles['Normal']),
            bc_cell
        ]
    ], colWidths=[360, 180])
    meta_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,0), (1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    words = number_to_words_inr(ev.grand_total)
    body_data = [
        ["Expense Category / Account Head:", Paragraph(f"<b>{ev.name or 'General Expense'}</b>", styles['Normal'])],
        ["Disbursement Particulars:", Paragraph(f"<b>{ev.details or 'Petty store operational expenditure'}</b>", styles['Normal'])],
        ["Bank Account (if applicable):", ev.bank_ac_no or "N/A (Cash / Drawer Outflow)"],
        ["Total Amount in Figures:", Paragraph(f"<font size=11 color='#b45309'><b>₹{ev.grand_total:,.2f}</b></font>", styles['Normal'])],
        ["Total Amount in Words:", Paragraph(f"<b>{words}</b>", styles['Normal'])],
    ]

    # Include itemized particulars if present in items_json
    try:
        items = json.loads(ev.items_json) if ev.items_json else []
        if isinstance(items, list) and len(items) > 0 and isinstance(items[0], dict):
            item_text = "<br/>".join([f"• {it.get('particulars', '')}: ₹{float(it.get('amount', 0)):,.2f}" for it in items])
            body_data.append(["Itemized Breakdown:", Paragraph(item_text, styles['Normal'])])
    except Exception:
        pass

    body_table = Table(body_data, colWidths=[180, 360])
    body_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#fef3c7')),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(body_table)
    story.append(Spacer(1, 20))

    sig_data = [
        ["Prepared By (Cashier)", "Passed & Authorized By (Store Manager)", "Received By (Payee Signature)"],
        ["\n\n___________________________", "\n\n___________________________", "\n\n___________________________"]
    ]
    sig_table = Table(sig_data, colWidths=[180, 180, 180])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTSIZE', (0,0), (-1,-1), 7.5),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ]))
    story.append(sig_table)

    doc.build(story)
    return buf.getvalue()

@router.get("/expense-vouchers/{voucher_id}/pdf")
def get_expense_voucher_pdf(voucher_id: str, db: Session = Depends(get_db)):
    """
    Generate official Petty Cash / Expense Voucher PDF.
    """
    ev = None
    if voucher_id.isdigit():
        ev = db.query(ExpenseVoucher).filter(ExpenseVoucher.id == int(voucher_id)).first()
    if not ev:
        ev = db.query(ExpenseVoucher).filter(ExpenseVoucher.voucher_no == voucher_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Expense voucher not found")

    pdf_bytes = generate_expense_voucher_pdf_bytes(ev)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="SVF_Expense_Voucher_{ev.voucher_no}.pdf"'}
    )

@router.get("/bank-statements", response_model=List[BankStatementEntryResponse])
def get_bank_statements(db: Session = Depends(get_db)):
    return db.query(BankStatementEntry).order_by(BankStatementEntry.id.desc()).all()

@router.post("/bank-statements", response_model=BankStatementEntryResponse)
def create_bank_statement(payload: BankStatementEntryCreate, db: Session = Depends(get_db)):
    bs = BankStatementEntry(**payload.model_dump())
    db.add(bs)
    db.commit()
    db.refresh(bs)
    return bs


# ==========================================
# SHIFT SETTLEMENT & DAY-END CASH RECONCILIATION
# ==========================================
@router.get("/shift-settlements", response_model=List[ShiftSettlementResponse])
def get_shift_settlements(
    date: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(ShiftSettlement)
    if date:
        query = query.filter(ShiftSettlement.date == date)
    return query.order_by(ShiftSettlement.id.desc()).offset(skip).limit(limit).all()


@router.post("/shift-settlement", response_model=ShiftSettlementResponse)
def record_shift_settlement(payload: ShiftSettlementCreate, db: Session = Depends(get_db)):
    """
    Lock shift closing with physical cash reconciliation against digital POS sales.
    Calculates exact difference between counted drawer cash and expected cash.
    """
    existing = db.query(ShiftSettlement).filter(ShiftSettlement.shift_code == payload.shift_code).first()
    if existing:
        for k, v in payload.model_dump().items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing

    # Re-calculate expected drawer cash
    calc_expected = payload.opening_cash + payload.cash_sales - payload.cash_expenses
    calc_diff = payload.actual_physical_cash - calc_expected

    settlement_dict = payload.model_dump()
    settlement_dict["expected_drawer_cash"] = calc_expected
    settlement_dict["cash_difference"] = calc_diff

    shift = ShiftSettlement(**settlement_dict)
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return shift


@router.get("/day-close-summary")
def get_day_close_summary(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD or DD/MM/YYYY"),
    db: Session = Depends(get_db)
):
    """
    Live Day-End / Z-Report aggregation for retail showroom closing.
    Reconciles all physical cash movements:
      + Non-voided Cash Sales
      + Cash Customer Receipts (Khata collections)
      - Cash Expenses
      - Cash Supplier Payments
      - Cash Sale Return Refunds
    """
    target_date = date or dt.utcnow().strftime("%Y-%m-%d")

    # Invoices for this date (excluding voided bills)
    invoices = db.query(SaleInvoice).filter(
        ((SaleInvoice.date == target_date) | (SaleInvoice.date.like(f"%{target_date}%"))),
        SaleInvoice.status != "Voided"
    ).all()

    total_sales = sum(inv.grand_total or 0.0 for inv in invoices)
    cash_sales = sum(inv.paid_amount or 0.0 for inv in invoices if "cash" in (inv.payment_mode or "").lower())
    upi_sales = sum(inv.paid_amount or 0.0 for inv in invoices if "upi" in (inv.payment_mode or "").lower() or "qr" in (inv.payment_mode or "").lower())
    card_sales = sum(inv.paid_amount or 0.0 for inv in invoices if "card" in (inv.payment_mode or "").lower())
    credit_sales = sum(inv.balance_due or 0.0 for inv in invoices if (inv.balance_due or 0.0) > 0)

    # Customer Khata Receipts / Income Vouchers in Cash
    incomes = db.query(IncomeVoucher).filter(
        (IncomeVoucher.date == target_date) | (IncomeVoucher.date.like(f"%{target_date}%"))
    ).all()
    cash_incomes = sum(iv.grand_total or 0.0 for iv in incomes if "cash" in (iv.payment_mode or "").lower())

    # Cash expenses for this date
    expenses = db.query(ExpenseVoucher).filter(
        (ExpenseVoucher.date == target_date) | (ExpenseVoucher.date.like(f"%{target_date}%"))
    ).all()
    cash_expenses = sum(e.grand_total or 0.0 for e in expenses if "cash" in (e.payment_mode or "").lower())

    # Supplier cash payouts for this date
    supplier_payments = db.query(SupplierPayment).filter(
        (SupplierPayment.date == target_date) | (SupplierPayment.date.like(f"%{target_date}%"))
    ).all()
    cash_supplier_payments = sum(sp.amount or 0.0 for sp in supplier_payments if "cash" in (sp.payment_mode or "").lower())

    # Sale Return cash refunds for this date
    sale_returns = db.query(SaleReturn).filter(
        (SaleReturn.date == target_date) | (SaleReturn.date.like(f"%{target_date}%"))
    ).all()
    cash_sale_returns = sum(sr.grand_total or 0.0 for sr in sale_returns if "cash" in (sr.payment_mode or "").lower())

    # Exact physical currency in drawer
    expected_cash = (cash_sales + cash_incomes) - (cash_expenses + cash_supplier_payments + cash_sale_returns)

    return {
        "date": target_date,
        "total_bills_count": len(invoices),
        "total_sales_amount": total_sales,
        "breakdown": {
            "cash_sales": cash_sales,
            "upi_sales": upi_sales,
            "card_sales": card_sales,
            "credit_sales": credit_sales
        },
        "cash_incomes": cash_incomes,
        "cash_expenses": cash_expenses,
        "cash_supplier_payments": cash_supplier_payments,
        "cash_sale_returns": cash_sale_returns,
        "net_cash_in_drawer": expected_cash,
        "expense_count": len(expenses)
    }


# ==========================================
# GSTR-1 TABLE 12 (HSN-WISE SUMMARY OF OUTWARD SUPPLIES)
# ==========================================
@router.get("/gst-hsn-summary")
def get_gst_hsn_summary(
    from_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD or DD/MM/YYYY"),
    to_date: Optional[str] = Query(None, description="End date YYYY-MM-DD or DD/MM/YYYY"),
    db: Session = Depends(get_db)
):
    """
    Generate Statutory GSTR-1 Table 12 HSN-wise summary of outward supplies:
    Aggregates all non-voided sale invoice items grouped by HSN code.
    Complies with CBIC GST Portal GSTR-1 Table 12 schema requirements.
    """
    query = db.query(SaleInvoiceItem).join(SaleInvoice).filter(SaleInvoice.status != "Voided")
    if from_date:
        query = query.filter(SaleInvoice.date >= from_date)
    if to_date:
        query = query.filter(SaleInvoice.date <= to_date)

    items = query.all()
    
    hsn_descriptions = {
        "9403": "Wooden, Metal & Home/Office Furniture",
        "9401": "Seats & Sofas (Chairs, Loungers, Recliners)",
        "9404": "Mattresses, Pillows & Bedding Supports",
        "8303": "High Security Safes, Cash Boxes & Strongboxes",
        "4410": "Particle Board & Wood Panels",
        "4412": "Plywood & Veneered Panels",
        "9402": "Medical / Salon Furniture & Fittings"
    }

    groups = {}
    for it in items:
        raw_hsn = str(it.hsn_code or "9403").strip()
        hsn = raw_hsn if raw_hsn else "9403"
        if hsn not in groups:
            prefix4 = hsn[:4]
            desc = hsn_descriptions.get(prefix4, f"Furniture & Allied Products ({hsn})")
            groups[hsn] = {
                "hsn_code": hsn,
                "description": desc,
                "uqc": "NOS",
                "total_quantity": 0.0,
                "total_value": 0.0,
                "taxable_value": 0.0,
                "integrated_tax_amount": 0.0,
                "central_tax_amount": 0.0,
                "state_tax_amount": 0.0,
                "cess_amount": 0.0
            }
        
        g = groups[hsn]
        g["total_quantity"] += float(it.qty or 0.0)
        g["total_value"] += float(it.total or 0.0)
        g["taxable_value"] += float(it.taxable_amount or 0.0)
        g["integrated_tax_amount"] += float(it.igst_amount or 0.0)
        g["central_tax_amount"] += float(it.cgst_amount or 0.0)
        g["state_tax_amount"] += float(it.sgst_amount or 0.0)
        g["cess_amount"] += float(it.cess_amount or 0.0)

    # Format numbers to 2 decimal places
    hsn_list = []
    tot_qty = 0.0
    tot_val = 0.0
    tot_taxable = 0.0
    tot_igst = 0.0
    tot_cgst = 0.0
    tot_sgst = 0.0
    tot_cess = 0.0

    for hsn_code in sorted(groups.keys()):
        row = groups[hsn_code]
        row["total_quantity"] = round(row["total_quantity"], 2)
        row["total_value"] = round(row["total_value"], 2)
        row["taxable_value"] = round(row["taxable_value"], 2)
        row["integrated_tax_amount"] = round(row["integrated_tax_amount"], 2)
        row["central_tax_amount"] = round(row["central_tax_amount"], 2)
        row["state_tax_amount"] = round(row["state_tax_amount"], 2)
        row["cess_amount"] = round(row["cess_amount"], 2)
        
        tot_qty += row["total_quantity"]
        tot_val += row["total_value"]
        tot_taxable += row["taxable_value"]
        tot_igst += row["integrated_tax_amount"]
        tot_cgst += row["central_tax_amount"]
        tot_sgst += row["state_tax_amount"]
        tot_cess += row["cess_amount"]
        hsn_list.append(row)

    return {
        "financial_year": "2026-2027",
        "table_name": "GSTR-1 Table 12 (HSN-wise summary of outward supplies)",
        "from_date": from_date or "All Time",
        "to_date": to_date or "Present",
        "hsn_summary": hsn_list,
        "totals": {
            "total_hsn_count": len(hsn_list),
            "total_quantity": round(tot_qty, 2),
            "total_value": round(tot_val, 2),
            "total_taxable_value": round(tot_taxable, 2),
            "total_igst": round(tot_igst, 2),
            "total_cgst": round(tot_cgst, 2),
            "total_sgst": round(tot_sgst, 2),
            "total_cess": round(tot_cess, 2)
        }
    }


# ==========================================
# DAY-END Z-REPORT CASHIER SETTLEMENT PDF
# ==========================================
@router.get("/day-close-summary/pdf")
def get_day_close_summary_pdf(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD or DD/MM/YYYY"),
    db: Session = Depends(get_db)
):
    """
    Generate professional Day-End Cashier Settlement & Z-Report PDF.
    """
    summary = get_day_close_summary(date=date, db=db)
    
    import io
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, rightMargin=28, leftMargin=28, topMargin=28, bottomMargin=28)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('StoreTitle', fontName='Helvetica-Bold', fontSize=15, leading=18, alignment=1)
    sub_style = ParagraphStyle('StoreSub', fontName='Helvetica', fontSize=8.5, leading=11, textColor=colors.HexColor('#475569'), alignment=1)
    badge_style = ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=11, leading=14, textColor=colors.HexColor('#0f766e'), alignment=1)
    h2_style = ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=9.5, leading=12, textColor=colors.HexColor('#1e293b'))

    story = [
        Paragraph("<b>SHREE VINAYAKA FURNITURES</b>", title_style),
        Paragraph("NH Bypass Road, Kozhikode, Kerala - 673004 | Phone: +91 98470 12345 | GSTIN: 32AABCS1429B1Z8", sub_style),
        Spacer(1, 8),
        Paragraph("<b>OFFICIAL DAY-END CASHIER SETTLEMENT & Z-REPORT</b>", badge_style),
        Paragraph(f"<font size=8 color='#64748b'>Closing Date: <b>{summary['date']}</b> | Printed: {dt.now().strftime('%d-%m-%Y %H:%M:%S')} | Register: <b>REG-01 (Main Counter)</b></font>", sub_style),
        Spacer(1, 12),
    ]

    # Table 1: Sales Revenue by Tender Mode
    bd = summary["breakdown"]
    sales_rows = [
        ["Payment Mode / Tender", "Transaction Count", "Settled Revenue (₹)"],
        ["Cash Sales (Immediate Inflow)", "-", f"₹{bd['cash_sales']:,.2f}"],
        ["UPI / Dynamic QR Payments", "-", f"₹{bd['upi_sales']:,.2f}"],
        ["Credit / Debit Card Terminal (POS)", "-", f"₹{bd['card_sales']:,.2f}"],
        ["Credit Invoices (Khata Receivables)", "-", f"₹{bd['credit_sales']:,.2f}"],
        ["<b>TOTAL GROSS SALES TURNOVER</b>", f"<b>{summary['total_bills_count']} Invoices</b>", f"<b>₹{summary['total_sales_amount']:,.2f}</b>"]
    ]
    t1 = Table(sales_rows, colWidths=[240, 140, 160])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f766e')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#f1f5f9')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(Paragraph("<b>1. SHOWROOM SALES SUMMARY</b>", h2_style))
    story.append(Spacer(1, 4))
    story.append(t1)
    story.append(Spacer(1, 12))

    # Table 2: Physical Cash Drawer Movement
    drawer_rows = [
        ["Drawer Cash Movement Particulars", "Inflow (+)", "Outflow (-)", "Net (₹)"],
        ["Cash Sales Revenue Collected at POS", f"₹{bd['cash_sales']:,.2f}", "-", f"₹{bd['cash_sales']:,.2f}"],
        ["Customer Khata Ledger Receipts (Income Vouchers)", f"₹{summary['cash_incomes']:,.2f}", "-", f"+₹{summary['cash_incomes']:,.2f}"],
        ["Petty Cash Store Expenses (Vouchers)", "-", f"₹{summary['cash_expenses']:,.2f}", f"-₹{summary['cash_expenses']:,.2f}"],
        ["Direct Cash Payouts to Suppliers/Transport", "-", f"₹{summary['cash_supplier_payments']:,.2f}", f"-₹{summary['cash_supplier_payments']:,.2f}"],
        ["Cash Refunds on Customer Sale Returns", "-", f"₹{summary['cash_sale_returns']:,.2f}", f"-₹{summary['cash_sale_returns']:,.2f}"],
        ["<b>NET EXPECTED CASH IN PHYSICAL DRAWER</b>", "", "", f"<b>₹{summary['net_cash_in_drawer']:,.2f}</b>"]
    ]
    t2 = Table(drawer_rows, colWidths=[240, 100, 100, 100])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#dcfce7')),
        ('TEXTCOLOR', (0,-1), (-1,-1), colors.HexColor('#14532d')),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(Paragraph("<b>2. CASH DRAWER AUDIT & RECONCILIATION</b>", h2_style))
    story.append(Spacer(1, 4))
    story.append(t2)
    story.append(Spacer(1, 24))

    # Signatures
    sig_data = [
        ["Counted & Handed Over By:", "Verified & Deposited to Safe By:"],
        ["\n\n___________________________\n<b>Cashier Signature</b>", "\n\n___________________________\n<b>Store Manager / Accountant</b>"]
    ]
    st = Table(sig_data, colWidths=[270, 270])
    st.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
    ]))
    story.append(st)

    doc.build(story)
    return Response(
        content=buf.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="SVF_Day_Close_Z_Report_{summary["date"]}.pdf"'}
    )


# =====================================================================
# BANK SYNCHRONIZATION & UTR RECONCILIATION ENGINE (STEP 5)
# =====================================================================

def extract_utr_from_text(description: str) -> Optional[str]:
    """
    Extract UTR / Transaction Reference number from Indian banking narrations.
    Handles NEFT, RTGS, IMPS, UPI, CMS, and INB statement strings.
    """
    if not description:
        return None
    
    # 1. Standard Prefix Pattern: e.g. NEFT-SBIN00482910, CMS/ICIC00012345, RTGS/HDFC0000004
    prefix_match = re.search(r'(?:NEFT|RTGS|CMS|IMPS|UPI|UTR|INB|REF)[-/: ]+([A-Za-z0-9]{8,22})', description, re.IGNORECASE)
    if prefix_match:
        return prefix_match.group(1).upper()

    # 2. Bank IFSC + Sequence pattern (e.g. SBIN48291024, HDFC00921820)
    ifsc_utr_match = re.search(r'\b([A-Z]{4}0[A-Z0-9]{6,16})\b', description)
    if ifsc_utr_match:
        return ifsc_utr_match.group(1).upper()

    # 3. 12-digit UPI / IMPS Reference number (RRN)
    rrn_match = re.search(r'\b(\d{12})\b', description)
    if rrn_match:
        return rrn_match.group(1)

    return None


@router.get("/bank-sync/entries", response_model=List[BankStatementEntryResponse])
def get_bank_statement_entries(
    account_no: Optional[str] = Query(None),
    status: Optional[str] = Query(None, description="Unreconciled / Reconciled"),
    search: Optional[str] = Query(None),
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Fetch imported bank statement entries with reconciliation statuses and UTR tags.
    """
    query = db.query(BankStatementEntry)
    if account_no:
        query = query.filter(BankStatementEntry.account_no == account_no)
    if status:
        query = query.filter(BankStatementEntry.status.ilike(status))
    if search:
        s = f"%{search}%"
        query = query.filter(
            (BankStatementEntry.description.ilike(s)) |
            (BankStatementEntry.utr_number.ilike(s)) |
            (BankStatementEntry.reconciled_party_name.ilike(s))
        )
    return query.order_by(BankStatementEntry.id.desc()).limit(limit).all()


@router.post("/bank-sync/upload-statement")
def upload_bank_statement(payload: BankStatementBulkUploadPayload, db: Session = Depends(get_db)):
    """
    Bulk import bank statement lines with automatic UTR extraction.
    """
    imported_count = 0
    created_entries = []
    
    for item in payload.entries:
        utr = item.utr_number or extract_utr_from_text(item.description)
        entry = BankStatementEntry(
            date=item.date,
            account_no=payload.account_no or item.account_no,
            receipt_no=item.receipt_no,
            description=item.description,
            debit=float(item.debit or 0.0),
            credit=float(item.credit or 0.0),
            balance=float(item.balance or 0.0),
            utr_number=utr,
            status="Unreconciled"
        )
        db.add(entry)
        imported_count += 1
        created_entries.append(entry)

    db.commit()
    return {
        "status": "SUCCESS",
        "message": f"Successfully parsed and imported {imported_count} bank statement entries.",
        "imported_count": imported_count
    }


@router.get("/bank-sync/candidates/{entry_id}", response_model=BankReconciliationCandidatesResponse)
def get_reconciliation_candidates(entry_id: int, db: Session = Depends(get_db)):
    """
    Smart algorithmic candidate matching for a bank statement line:
    - For Credits (inflows): matches against open SaleInvoices and Customers with balance.
    - For Debits (outflows): matches against Suppliers and outstanding purchase invoices.
    """
    entry = db.query(BankStatementEntry).filter(BankStatementEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Bank statement entry not found")

    candidates: List[ReconciliationCandidate] = []
    amount = float(entry.credit if entry.credit > 0 else entry.debit)
    is_credit = entry.credit > 0
    desc_clean = (entry.description or "").lower()

    if is_credit:
        # 1. Search Open Customer Invoices
        open_invoices = db.query(SaleInvoice).filter(SaleInvoice.balance_due > 0).all()
        for inv in open_invoices:
            cust_name = (inv.customer_name or "").lower()
            inv_no = (inv.invoice_no or "").lower()
            bal_due = float(inv.balance_due or 0.0)
            inv_total = float(inv.grand_total or 0.0)

            score = 0
            reasons = []

            # Check exact invoice number in description
            if inv_no in desc_clean or (inv.invoice_no and inv.invoice_no.split("-")[-1] in desc_clean):
                score += 50
                reasons.append(f"Invoice #{inv.invoice_no} found in narration")

            # Check customer name match in description
            name_parts = [p for p in cust_name.split() if len(p) > 2]
            name_matched = any(p in desc_clean for p in name_parts) if name_parts else False
            if name_matched:
                score += 40
                reasons.append("Customer name matches bank narration")

            # Check amount matching
            if abs(bal_due - amount) < 1.0:
                score += 50
                reasons.append(f"Exact balance match: ₹{bal_due:,.2f}")
            elif abs(inv_total - amount) < 1.0:
                score += 40
                reasons.append(f"Matches full invoice total: ₹{inv_total:,.2f}")
            elif amount < bal_due:
                score += 15
                reasons.append("Valid partial invoice payment")

            if score >= 30:
                candidates.append(ReconciliationCandidate(
                    party_type="Customer",
                    party_id=inv.customer_id or 0,
                    party_code=f"CUST-{inv.customer_id}",
                    party_name=inv.customer_name or "Retail Customer",
                    phone=inv.customer_phone,
                    invoice_id=inv.id,
                    invoice_no=inv.invoice_no,
                    invoice_date=inv.date,
                    amount_due=bal_due,
                    confidence_score=min(100, score),
                    match_reason=" & ".join(reasons)
                ))

        # 2. Check Customer direct Khata balances if not already listed
        customers = db.query(Customer).filter(Customer.current_balance > 0).all()
        for cust in customers:
            c_name = cust.name.lower()
            parts = [p for p in c_name.split() if len(p) > 2]
            if any(p in desc_clean for p in parts) or cust.phone in desc_clean:
                # If already listed with invoice, skip or upgrade
                already_has = any(c.party_id == cust.id for c in candidates)
                if not already_has:
                    candidates.append(ReconciliationCandidate(
                        party_type="Customer",
                        party_id=cust.id,
                        party_code=cust.code,
                        party_name=cust.name,
                        phone=cust.phone,
                        invoice_id=None,
                        invoice_no=None,
                        invoice_date=None,
                        amount_due=float(cust.current_balance or 0.0),
                        confidence_score=75,
                        match_reason=f"Customer name/phone matched narration (Khata Due: ₹{cust.current_balance:,.2f})"
                    ))

    else:
        # Debit outflow: Check Suppliers
        suppliers = db.query(Supplier).filter(Supplier.active == True).all()
        for sup in suppliers:
            s_name = (sup.name or "").lower()
            comp_name = (sup.company_name or "").lower()
            score = 0
            reasons = []

            if s_name and any(p in desc_clean for p in s_name.split() if len(p) > 2):
                score += 50
                reasons.append(f"Supplier '{sup.name}' matched")
            if comp_name and any(p in desc_clean for p in comp_name.split() if len(p) > 2):
                score += 50
                reasons.append(f"Company '{sup.company_name}' matched")

            cur_bal = float(sup.current_balance or 0.0)
            if abs(cur_bal - amount) < 1.0:
                score += 40
                reasons.append("Exact supplier ledger balance match")

            if score >= 30:
                candidates.append(ReconciliationCandidate(
                    party_type="Supplier",
                    party_id=sup.id,
                    party_code=sup.code,
                    party_name=sup.company_name or sup.name,
                    phone=sup.contact_no,
                    invoice_id=None,
                    invoice_no=None,
                    invoice_date=None,
                    amount_due=cur_bal,
                    confidence_score=min(100, score),
                    match_reason=" & ".join(reasons)
                ))

    # Sort candidates by confidence score descending
    candidates.sort(key=lambda c: c.confidence_score, reverse=True)

    return BankReconciliationCandidatesResponse(
        entry_id=entry.id,
        date=entry.date,
        description=entry.description,
        amount=amount,
        type="Credit" if is_credit else "Debit",
        utr_number=entry.utr_number,
        candidates=candidates[:8]
    )


@router.post("/bank-sync/reconcile-entry")
def reconcile_bank_statement_entry(payload: BankReconcileRequest, db: Session = Depends(get_db)):
    """
    Atomically reconcile a bank statement entry:
    - Deducts customer/supplier open balance.
    - If SaleInvoice is linked, updates paid_amount and balance_due.
    - Records CustomerLedgerEntry or SupplierPayment.
    - Flags BankStatementEntry as Reconciled with audit metadata.
    """
    entry = db.query(BankStatementEntry).filter(BankStatementEntry.id == payload.entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Bank statement entry not found")
    if entry.status == "Reconciled":
        raise HTTPException(status_code=400, detail="This bank entry is already reconciled")

    amount = float(entry.credit if entry.credit > 0 else entry.debit)
    utr_ref = entry.utr_number or payload.ref_no or f"BANK-{entry.id}"
    party_name = "Direct Bank Adjustment"

    if payload.party_type == "Customer" and payload.party_id:
        customer = db.query(Customer).filter(Customer.id == payload.party_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Selected Customer not found")
        party_name = customer.name

        # 1. Update customer current balance
        customer.current_balance = float(customer.current_balance or 0.0) - amount

        # 2. Add customer ledger entry
        particulars = f"Bank Sync Receipt (UTR: {utr_ref})"
        if payload.invoice_id:
            inv = db.query(SaleInvoice).filter(SaleInvoice.id == payload.invoice_id).first()
            if inv:
                particulars += f" against #{inv.invoice_no}"
                inv.paid_amount = float(inv.paid_amount or 0.0) + amount
                inv.balance_due = max(0.0, float(inv.balance_due or 0.0) - amount)
                if inv.balance_due <= 0.01:
                    inv.status = "PAID"
                else:
                    inv.status = "PARTIAL"
        
        ledger_entry = CustomerLedgerEntry(
            customer_id=customer.id,
            date=entry.date,
            voucher_no=utr_ref,
            particulars=particulars,
            debit=0.0,
            credit=amount,
            balance=customer.current_balance
        )
        db.add(ledger_entry)

    elif payload.party_type == "Supplier" and payload.party_id:
        supplier = db.query(Supplier).filter(Supplier.id == payload.party_id).first()
        if not supplier:
            raise HTTPException(status_code=404, detail="Selected Supplier not found")
        party_name = supplier.company_name or supplier.name

        # 1. Update supplier balance
        supplier.current_balance = float(supplier.current_balance or 0.0) - amount

        # 2. Add SupplierPayment
        sp = SupplierPayment(
            supplier_id=supplier.id,
            voucher_no=f"SP-{utr_ref[:16]}",
            date=entry.date,
            amount=amount,
            payment_mode="Bank Transfer",
            bank_ac_no=entry.account_no,
            details=f"Bank statement auto-reconciled (UTR: {utr_ref}) - {entry.description}"
        )
        db.add(sp)

    # Update Bank Statement Entry
    entry.status = "Reconciled"
    entry.reconciled_party_type = payload.party_type
    entry.reconciled_party_id = payload.party_id
    entry.reconciled_party_name = party_name
    entry.reconciled_ref_no = utr_ref
    entry.reconciled_at = dt.utcnow()

    db.commit()
    db.refresh(entry)

    return {
        "status": "SUCCESS",
        "message": f"Successfully reconciled ₹{amount:,.2f} with {party_name} (UTR: {utr_ref})",
        "entry": BankStatementEntryResponse.model_validate(entry)
    }


@router.post("/bank-sync/seed-sample-statement")
def seed_sample_bank_statement(db: Session = Depends(get_db)):
    """
    Seed realistic Godrej Interio showroom bank transactions for demonstration & testing.
    """
    today_str = dt.now().strftime("%d/%m/%Y")
    sample_data = [
        {
            "date": today_str,
            "account_no": "99999999",
            "receipt_no": "REC-9102",
            "description": "NEFT-SBIN00482910-KUMAR RESIDENCIES-LIVING ROOM SUITE ADVANCE",
            "credit": 85000.0,
            "debit": 0.0,
            "balance": 485000.0,
            "utr_number": "SBIN00482910"
        },
        {
            "date": today_str,
            "account_no": "99999999",
            "receipt_no": "REC-9103",
            "description": "CMS/ICIC00012345/GODREJ INTERIO DEALER DISPATCH PAYMENT",
            "credit": 0.0,
            "debit": 125000.0,
            "balance": 360000.0,
            "utr_number": "ICIC00012345"
        },
        {
            "date": today_str,
            "account_no": "99999999",
            "receipt_no": "REC-9104",
            "description": "RTGS/HDFC0000004/MRS PRIYA ANAND/SOFA SET FINAL SETTLEMENT",
            "credit": 42000.0,
            "debit": 0.0,
            "balance": 402000.0,
            "utr_number": "HDFC0000004"
        },
        {
            "date": today_str,
            "account_no": "99999999",
            "receipt_no": "REC-9105",
            "description": "UPI/629102849102/PAYMENT/FROM MOHAMMED FAISAL MODULAR BED",
            "credit": 28500.0,
            "debit": 0.0,
            "balance": 430500.0,
            "utr_number": "629102849102"
        },
        {
            "date": today_str,
            "account_no": "99999999",
            "receipt_no": "REC-9106",
            "description": "IMPS/528919201948/KERALA LOGISTICS EXPRESS INTERIOR DELIVERY TRUCK",
            "credit": 0.0,
            "debit": 14500.0,
            "balance": 416000.0,
            "utr_number": "528919201948"
        }
    ]

    inserted = 0
    for s in sample_data:
        existing = db.query(BankStatementEntry).filter(
            BankStatementEntry.utr_number == s["utr_number"]
        ).first()
        if not existing:
            entry = BankStatementEntry(
                date=s["date"],
                account_no=s["account_no"],
                receipt_no=s["receipt_no"],
                description=s["description"],
                credit=s["credit"],
                debit=s["debit"],
                balance=s["balance"],
                utr_number=s["utr_number"],
                status="Unreconciled"
            )
            db.add(entry)
            inserted += 1

    db.commit()
    return {
        "status": "SUCCESS",
        "message": f"Successfully seeded {inserted} showroom bank statement transactions.",
        "seeded_count": inserted
    }



