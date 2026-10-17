from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime as dt
from app.core.database import get_db
from app.models.accounting import AccountHead, ExpenseVoucher, IncomeVoucher, BankStatementEntry, ShiftSettlement
from app.models.sale import SaleInvoice, SaleInvoiceItem
from app.models.supplier import SupplierPayment
from app.models.returns import SaleReturn
from app.schemas.accounting import (
    AccountHeadCreate, AccountHeadResponse,
    ExpenseVoucherCreate, ExpenseVoucherResponse,
    IncomeVoucherCreate, IncomeVoucherResponse,
    BankStatementEntryCreate, BankStatementEntryResponse,
    ShiftSettlementCreate, ShiftSettlementResponse
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



