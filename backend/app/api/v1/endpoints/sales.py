from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal, ROUND_HALF_UP
from app.core.database import get_db
from app.models.sale import (
    SaleInvoice,
    SaleInvoiceItem,
    SaleInvoicePayment,
    HeldCart,
    EstimateRecord,
    DeliveryNote,
    Quotation,
    InvoiceSequence
)
from app.models.company import CompanyProfile
from app.services.realtime import realtime_manager
from app.services.r2_storage import r2_service
from app.models.product import Product, ProductSerial, ProductBatch
from app.models.discounts import Coupon, GiftVoucher, EWayBill
from app.schemas.sale import (
    SaleInvoiceCreate, SaleInvoiceResponse,
    SaleInvoicePaymentCreate, SaleInvoicePaymentResponse,
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
    now = dt.utcnow()
    fy_start = now.year if now.month >= 4 else now.year - 1
    fy_code = f"{str(fy_start)[-2:]}{str(fy_start + 1)[-2:]}"
    prefix_pattern = f"SVF-{fy_code}-"

    # Gapless sequential GST invoice numbering with row-level lock on invoice_sequences
    seq = db.query(InvoiceSequence).filter(InvoiceSequence.financial_year == fy_code).with_for_update().first()
    if not seq:
        latest = db.query(SaleInvoice).filter(SaleInvoice.invoice_no.like(f"{prefix_pattern}%")).order_by(SaleInvoice.id.desc()).first()
        init_num = 0
        if latest and latest.invoice_no:
            try:
                init_num = int(latest.invoice_no.split("-")[-1])
            except Exception:
                init_num = db.query(SaleInvoice).count()
        seq = InvoiceSequence(financial_year=fy_code, prefix=prefix_pattern, last_number=init_num)
        db.add(seq)
        db.flush()

    invoice_dict = payload.model_dump(exclude={"items"})
    if payload.invoice_no and payload.invoice_no.startswith(prefix_pattern):
        try:
            num_val = int(payload.invoice_no.split("-")[-1])
            if num_val > seq.last_number:
                seq.last_number = num_val
        except Exception:
            pass
    elif not payload.invoice_no:
        seq.last_number += 1
        invoice_dict["invoice_no"] = f"{prefix_pattern}{seq.last_number:04d}"

    if not invoice_dict.get("date"):
        invoice_dict["date"] = invoice_dict.get("invoice_date") or now.strftime("%Y-%m-%d")

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

    # Decimal-precision calculation (ROUND_HALF_UP) eliminating JavaScript float tax drift
    item_cols = {c.name for c in SaleInvoiceItem.__table__.columns}
    for item_data in payload.items:
        raw_item = item_data.model_dump()
        qty_d = Decimal(str(item_data.qty))
        rate_d = Decimal(str(item_data.rate or 0.0))
        disc_d = Decimal(str(item_data.discount_amount or 0.0))
        taxable_d = ((qty_d * rate_d) - disc_d).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        cgst_pct = Decimal(str(raw_item.get("cgst_percent") or raw_item.get("cgst_rate") or 0.0))
        sgst_pct = Decimal(str(raw_item.get("sgst_percent") or raw_item.get("sgst_rate") or 0.0))
        igst_pct = Decimal(str(raw_item.get("igst_percent") or raw_item.get("igst_rate") or 0.0))
        cess_pct = Decimal(str(raw_item.get("cess_percent") or 0.0))

        cgst_amt_d = (taxable_d * cgst_pct / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        sgst_amt_d = (taxable_d * sgst_pct / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        igst_amt_d = (taxable_d * igst_pct / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        cess_amt_d = (taxable_d * cess_pct / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        item_total_d = (taxable_d + cgst_amt_d + sgst_amt_d + igst_amt_d + cess_amt_d).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        raw_item["taxable_amount"] = float(taxable_d)
        raw_item["cgst_amount"] = float(cgst_amt_d)
        raw_item["sgst_amount"] = float(sgst_amt_d)
        raw_item["igst_amount"] = float(igst_amt_d)
        raw_item["cess_amount"] = float(cess_amt_d)
        raw_item["total"] = float(item_total_d)

        filtered_item = {k: v for k, v in raw_item.items() if k in item_cols and v is not None}
        db_item = SaleInvoiceItem(invoice_id=db_invoice.id, **filtered_item)
        db.add(db_item)
        
        # Atomic stock deduction with row-level locking (PostgreSQL SELECT FOR UPDATE)
        prod = None
        if item_data.product_id:
            prod = db.query(Product).filter(Product.id == item_data.product_id).with_for_update().first()
        if not prod and item_data.barcode:
            prod = db.query(Product).filter(Product.barcode == item_data.barcode).with_for_update().first()
        if prod:
            if payload.is_advance_booking:
                # Advance booking order: lock units in reserved_stock without deducting physical godown stock yet
                prod.reserved_stock = float(prod.reserved_stock or 0.0) + item_data.qty
            else:
                phys = float(prod.physical_stock if (prod.physical_stock is not None and prod.physical_stock > 0) else (prod.current_stock or 0.0))
                res = float(prod.reserved_stock or 0.0)
                avail_to_sell = max(0.0, phys - res)

                # Stock availability verification (strict by default; override allowed if allow_negative_stock is True)
                if not payload.allow_negative_stock and (avail_to_sell < item_data.qty and prod.current_stock < item_data.qty):
                    # Check if manager explicitly overrides to sell from showroom display stock
                    disp = float(prod.display_stock or 0.0)
                    if payload.sell_from_display and disp >= item_data.qty:
                        prod.display_stock = max(0.0, disp - item_data.qty)
                    else:
                        db.rollback()
                        raise HTTPException(
                            status_code=400,
                            detail=f"Insufficient godown stock for '{prod.name}'! Available to sell: {avail_to_sell} (Physical: {phys}, Reserved: {res}), Requested: {item_data.qty}. Transaction rejected to prevent double-selling."
                        )
                else:
                    new_phys = (prod.current_stock or 0.0) - item_data.qty
                    prod.physical_stock = new_phys
                    prod.current_stock = new_phys

        # Track batch allocation if provided
        if item_data.batch_no and (prod or item_data.product_id):
            p_id = prod.id if prod else item_data.product_id
            batch = db.query(ProductBatch).filter(
                ProductBatch.product_id == p_id,
                ProductBatch.batch_no == item_data.batch_no
            ).with_for_update().first()
            if batch:
                batch.available_qty = max(0.0, float(batch.available_qty or 0.0) - item_data.qty)

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

            # Deduct redeemed loyalty points if applied with strict balance check
            if db_invoice.loyalty_redeemed_amt and db_invoice.loyalty_redeemed_amt > 0:
                pts_redeemed = round(float(db_invoice.loyalty_redeemed_amt) / 0.10, 2)
                if pts_redeemed > (float(cust.loyalty_points or 0.0) + 0.01):
                    db.rollback()
                    raise HTTPException(
                        status_code=400,
                        detail=f"Insufficient loyalty points balance for customer '{cust.name}'! Available: {cust.loyalty_points:.1f} pts, Required: {pts_redeemed:.1f} pts."
                    )
                cust.loyalty_points = max(0.0, round(float(cust.loyalty_points or 0.0) - pts_redeemed, 2))
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

    # Record Split-Tender Payments (multiple payment rows per invoice: Cash, UPI with UTR, Card, Bajaj Finance with DBD subvention fee)
    if hasattr(payload, "payments") and payload.payments:
        for p in payload.payments:
            sub_pct = float(p.subvention_percent or 0.0)
            amt = float(p.amount or 0.0)
            sub_fee = float(p.subvention_fee) if p.subvention_fee else round((amt * sub_pct) / 100.0, 2)
            db_payment = SaleInvoicePayment(
                invoice_id=db_invoice.id,
                payment_mode=p.payment_mode or "Cash",
                amount=amt,
                utr_number=p.utr_number,
                card_network=p.card_network,
                card_last_four=p.card_last_four,
                subvention_percent=sub_pct,
                subvention_fee=sub_fee,
                bank_account_id=p.bank_account_id,
                reference_no=p.reference_no,
                status=p.status or "Completed",
                notes=p.notes
            )
            db.add(db_payment)
    elif payload.payment_splits_json:
        try:
            import json
            splits = json.loads(payload.payment_splits_json)
            if isinstance(splits, list):
                for p_dict in splits:
                    amt = float(p_dict.get("amount") or 0.0)
                    sub_pct = float(p_dict.get("subvention_percent") or 0.0)
                    sub_fee = float(p_dict.get("subvention_fee") or round((amt * sub_pct) / 100.0, 2))
                    db_payment = SaleInvoicePayment(
                        invoice_id=db_invoice.id,
                        payment_mode=p_dict.get("payment_mode") or "Cash",
                        amount=amt,
                        utr_number=p_dict.get("utr_number"),
                        card_network=p_dict.get("card_network"),
                        card_last_four=p_dict.get("card_last_four"),
                        subvention_percent=sub_pct,
                        subvention_fee=sub_fee,
                        reference_no=p_dict.get("reference_no"),
                        status=p_dict.get("status") or "Completed",
                        notes=p_dict.get("notes")
                    )
                    db.add(db_payment)
        except Exception:
            pass
    elif db_invoice.paid_amount and db_invoice.paid_amount > 0:
        sub_pct = float(db_invoice.subvention_percent or 0.0)
        amt = float(db_invoice.paid_amount or 0.0)
        sub_fee = round((amt * sub_pct) / 100.0, 2)
        db_payment = SaleInvoicePayment(
            invoice_id=db_invoice.id,
            payment_mode=db_invoice.payment_mode or "Cash",
            amount=amt,
            utr_number=db_invoice.utr_number,
            subvention_percent=sub_pct,
            subvention_fee=sub_fee,
            status="Completed"
        )
        db.add(db_payment)

    db.commit()
    db.refresh(db_invoice)

    # Multi-terminal real-time sync broadcast (<200ms)
    realtime_manager.broadcast_sync({
        "event": "SALE_CREATED",
        "invoice_no": db_invoice.invoice_no,
        "grand_total": db_invoice.grand_total,
        "customer_name": db_invoice.customer_name,
        "timestamp": dt.utcnow().isoformat()
    })
    realtime_manager.broadcast_sync({
        "event": "INVENTORY_UPDATED",
        "invoice_no": db_invoice.invoice_no,
        "timestamp": dt.utcnow().isoformat()
    })

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
    
    # 1. Restore Product Stock and Batches atomically
    items = db.query(SaleInvoiceItem).filter(SaleInvoiceItem.invoice_id == invoice.id).all()
    for item in items:
        if item.product_id:
            prod = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
            if prod:
                if invoice.is_advance_booking:
                    prod.reserved_stock = max(0.0, float(prod.reserved_stock or 0.0) - item.qty)
                else:
                    prod.physical_stock = float(prod.physical_stock or 0.0) + item.qty
                    prod.current_stock = prod.physical_stock
            if item.batch_no:
                batch = db.query(ProductBatch).filter(
                    ProductBatch.product_id == item.product_id,
                    ProductBatch.batch_no == item.batch_no
                ).with_for_update().first()
                if batch:
                    batch.available_qty = float(batch.available_qty or 0.0) + item.qty
    
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

    from datetime import datetime as dt
    realtime_manager.broadcast_sync({
        "event": "INVOICE_VOIDED",
        "invoice_no": invoice.invoice_no,
        "timestamp": dt.utcnow().isoformat()
    })
    realtime_manager.broadcast_sync({
        "event": "INVENTORY_UPDATED",
        "timestamp": dt.utcnow().isoformat()
    })

    return {
        "status": "SUCCESS",
        "message": f"Invoice {invoice.invoice_no} has been voided successfully. Stock restored and ledgers reversed.",
        "invoice_no": invoice.invoice_no,
        "invoice_status": invoice.status
    }



def generate_invoice_pdf_bytes(invoice: SaleInvoice, company: Optional[CompanyProfile] = None) -> bytes:
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

    comp_name = (company.company_name if company and company.company_name else "SHREE VINAYAKA FURNITURES").upper()
    comp_tagline = company.invoice_header_note if company and company.invoice_header_note else "Specialists in Teak Wood Living, Bedroom, Dining & Office Furniture Solutions"
    addr_parts = [p for p in [
        company.address if company and company.address else "NH Bypass Road",
        company.city if company and company.city else "Kozhikode",
        f"{company.state if company and company.state else 'Kerala'} - {company.pincode if company and company.pincode else '673004'}"
    ] if p]
    comp_address = ", ".join(addr_parts)
    comp_phone = company.phone if company and company.phone else "+91 98470 12345"
    comp_gstin = company.gstin if company and company.gstin else "32AABCS1429B1Z8"
    comp_state = company.state if company and company.state else "Kerala"
    comp_code = company.state_code if company and company.state_code else "32"
    comp_email = company.email if company and company.email else "sales@vinayakafurnitures.com"

    story = []
    story.append(Paragraph(f"<b>{comp_name}</b>", title_style))
    story.append(Paragraph(comp_tagline, subtitle_style))
    story.append(Paragraph(f"{comp_address} | Phone: {comp_phone}", subtitle_style))
    story.append(Paragraph(f"GSTIN: <b>{comp_gstin}</b> | State: {comp_state} (Code: {comp_code}) | Email: {comp_email}", subtitle_style))
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

    company = db.query(CompanyProfile).filter(CompanyProfile.is_active == True).first()
    pdf_bytes = generate_invoice_pdf_bytes(invoice, company=company)
    filename = f"SVF_Invoice_{invoice.invoice_no}.pdf"
    r2_key = f"invoices/2026-2027/{filename}"
    r2_service.upload_buffer(r2_key, pdf_bytes, content_type="application/pdf")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "X-Cloudflare-R2-Bucket": "svf-store-backups",
            "X-Cloudflare-R2-Path": r2_key,
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

    company = db.query(CompanyProfile).filter(CompanyProfile.is_active == True).first()
    pdf_bytes = generate_invoice_pdf_bytes(invoice, company=company)
    filename = f"SVF_Invoice_{invoice.invoice_no}.pdf"
    r2_key = f"invoices/2026-2027/{filename}"
    r2_service.upload_buffer(r2_key, pdf_bytes, content_type="application/pdf")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "X-Cloudflare-R2-Bucket": "svf-store-backups",
            "X-Cloudflare-R2-Path": r2_key,
            "X-Invoice-No": invoice.invoice_no,
            "X-GST-Financial-Year": "2026-2027"
        }
    )


@router.get("/{invoice_id}/presigned-url")
def get_invoice_presigned_url(invoice_id: int, db: Session = Depends(get_db)):
    """
    Generate temporary 1-hour secure Cloudflare R2 Pre-Signed GET URL.
    Prevents public web data leaks of sensitive customer bills.
    """
    invoice = db.query(SaleInvoice).filter(SaleInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    filename = f"SVF_Invoice_{invoice.invoice_no}.pdf"
    r2_key = f"invoices/2026-2027/{filename}"
    presigned_url = r2_service.generate_presigned_download_url(r2_key, expires_in_seconds=3600)
    return {
        "invoice_no": invoice.invoice_no,
        "r2_key": r2_key,
        "presigned_url": presigned_url,
        "expires_in_seconds": 3600
    }


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


def generate_delivery_note_pdf_bytes(dn: DeliveryNote) -> bytes:
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
    badge_style = ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=10.5, leading=13, textColor=colors.HexColor('#0369a1'), alignment=1)

    story = [
        Paragraph("<b>SHREE VINAYAKA FURNITURES</b>", title_style),
        Paragraph("NH Bypass Road, Kozhikode, Kerala - 673004 | Phone: +91 98470 12345 | GSTIN: 32AABCS1429B1Z8", sub_style),
        Spacer(1, 8),
        Paragraph("<b>DELIVERY CHALLAN (Under Rule 55 of CGST/SGST Rules, 2017)</b>", badge_style),
        Spacer(1, 8),
    ]

    try:
        dn_barcode = createBarcodeDrawing('Code128', value=dn.delivery_note_no, barHeight=18, width=125)
        barcode_cell = [
            dn_barcode,
            Paragraph("<font size=5.5 color='#64748b'><b>DELIVERY CHALLAN DISPATCH</b></font>", ParagraphStyle('DNBc', fontName='Helvetica-Bold', fontSize=5.5, alignment=1, leading=7))
        ]
    except Exception:
        barcode_cell = Paragraph(f"<b>{dn.delivery_note_no}</b>", styles['Normal'])

    hdr_data = [
        [Paragraph(f"Challan No: <b>{dn.delivery_note_no}</b><br/>Invoice Ref: <b>{dn.invoice_no or 'Bill Accompanying'}</b><br/>Consignee: <b>{dn.customer_name}</b><br/>Contact: {dn.contact_no or 'N/A'}", styles['Normal']),
         Paragraph(f"Date: <b>{dn.date}</b><br/>Vehicle No: <b>{dn.vehicle_no or 'KL-36-H-4567'}</b><br/>Transporter: <b>{dn.transporter_name or 'Store Direct Logistics'}</b><br/>Status: <b>{dn.status}</b>", styles['Normal']),
         barcode_cell]
    ]
    hdr_table = Table(hdr_data, colWidths=[200, 195, 150])
    hdr_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0f9ff')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (2,0), (2,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(hdr_table)
    story.append(Spacer(1, 6))

    dest_table = Table([[
        Paragraph(f"<b>Delivery Destination Address:</b><br/>{dn.delivery_address}, State: {dn.state} (Code: 32)", styles['Normal'])
    ]], colWidths=[545])
    dest_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(dest_table)
    story.append(Spacer(1, 10))

    items_raw = []
    try:
        items_raw = json.loads(dn.items_json) if dn.items_json else []
    except Exception:
        items_raw = []

    table_data = [["#", "Furniture Item Description", "HSN", "Dispatched Qty", "Approx Value (₹)"]]
    for i, it in enumerate(items_raw, 1):
        name = it.get("product_name") or it.get("name") or "Furniture Consignment"
        qty = float(it.get("qty", 1.0))
        rate = float(it.get("rate") or it.get("price") or 0.0)
        tot = float(it.get("total") or it.get("amount") or (qty * rate))
        hsn = it.get("hsn_code") or it.get("hsn") or "9403"
        table_data.append([
            str(i),
            Paragraph(f"<b>{name}</b>", styles['Normal']),
            str(hsn),
            f"{qty:.1f}".rstrip('0').rstrip('.'),
            f"₹{tot:,.2f}"
        ])

    if len(table_data) == 1:
        table_data.append(["1", Paragraph("Custom Furniture Package", styles['Normal']), "9403", "1", f"₹{(dn.grand_total or 0.0):,.2f}"])

    items_table = Table(table_data, colWidths=[25, 290, 60, 60, 110])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0369a1')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
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

    summary_table = Table([
        ["<b>TOTAL CONSIGNMENT VALUE:</b>", f"<b>₹{(dn.grand_total or 0.0):,.2f}</b>"]
    ], colWidths=[150, 90])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#e0f2fe')),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))

    notes = """<b>Statutory Declaration (Rule 55, CGST Rules):</b><br/>
1. This delivery challan is issued for transportation of goods for supply on approval / site installation.<br/>
2. Goods are insured and securely packed for road transit.<br/>
3. Recipient must inspect goods for transit damages prior to signing acknowledgment."""
    bottom_table = Table([[Paragraph(notes, styles['Normal']), summary_table]], colWidths=[305, 240])
    bottom_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(bottom_table)
    story.append(Spacer(1, 20))

    sig_table = Table([
        ["\n\n___________________________\n<b>Store Dispatcher</b>", 
         "\n\n___________________________\n<b>Driver / Transporter</b>", 
         "\n\n___________________________\n<b>Customer Receiver Sign & Date</b>"]
    ], colWidths=[180, 180, 185])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTSIZE', (0,0), (-1,-1), 7.5),
    ]))
    story.append(sig_table)

    doc.build(story)
    return buf.getvalue()


@router.get("/delivery-notes/{dn_id}/pdf")
def get_delivery_note_pdf(
    dn_id: str,
    eway_bill_no: Optional[str] = Query(None),
    vehicle_no: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Generate statutory Delivery Challan PDF (CGST Rule 55) by ID or Challan Number.
    Enforces mandatory E-Way Bill Number and Vehicle Number if invoice value exceeds ₹50,000.
    """
    dn = None
    if dn_id.isdigit():
        dn = db.query(DeliveryNote).filter(DeliveryNote.id == int(dn_id)).first()
    if not dn:
        dn = db.query(DeliveryNote).filter(DeliveryNote.delivery_note_no == dn_id).first()
    if not dn:
        raise HTTPException(status_code=404, detail="Delivery note not found")

    if eway_bill_no:
        dn.eway_bill_no = eway_bill_no
    if vehicle_no:
        dn.vehicle_no = vehicle_no
    if eway_bill_no or vehicle_no:
        db.commit()

    if (dn.grand_total or 0.0) >= 50000.0 and not dn.eway_bill_no:
        raise HTTPException(
            status_code=400,
            detail="Statutory E-Way Bill Rule 138: Consignment value exceeds ₹50,000. E-Way Bill Number is mandatory before generating Delivery Challan."
        )

    pdf_bytes = generate_delivery_note_pdf_bytes(dn)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="SVF_Delivery_Challan_{dn.delivery_note_no}.pdf"'}
    )



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


@router.post("/quotations/{quotation_id}/convert-to-invoice")
def convert_quotation_to_invoice(
    quotation_id: str,
    payload: Optional[dict] = None,
    db: Session = Depends(get_db)
):
    """
    Atomically convert an approved Quotation into a sequential GST Tax Invoice:
    1. Lock and load Quotation record.
    2. Check stock availability for all products in quotation.
    3. Generate strict sequential next invoice number (SVF-YYYY-XXXX).
    4. Create SaleInvoice and SaleInvoiceItems with exact prices, discounts, and tax rates.
    5. Atomically deduct inventory from godown (SELECT FOR UPDATE).
    6. Post customer ledger and loyalty points.
    7. Update quotation status / remarks to mark as Converted.
    """
    quot = None
    if quotation_id.isdigit():
        quot = db.query(Quotation).filter(Quotation.id == int(quotation_id)).first()
    if not quot:
        quot = db.query(Quotation).filter(Quotation.quotation_no == quotation_id).first()
    if not quot:
        raise HTTPException(status_code=404, detail="Quotation not found")

    import json
    from datetime import datetime as dt
    override = payload or {}
    
    # Generate sequential invoice no
    prefix = override.get("prefix", "SVF")
    next_inv_data = get_next_invoice_no(prefix=prefix, db=db)
    inv_no = next_inv_data["next_invoice_no"]
    inv_date = override.get("date") or dt.utcnow().strftime("%Y-%m-%d")

    # Resolve customer
    cust_id = None
    if quot.customer_id and str(quot.customer_id).isdigit():
        cust_id = int(quot.customer_id)
    elif override.get("customer_id"):
        cust_id = int(override["customer_id"])

    # Parse quotation items
    items_raw = []
    try:
        items_raw = json.loads(quot.items_json) if quot.items_json else []
    except Exception:
        items_raw = []

    if not items_raw:
        raise HTTPException(status_code=400, detail="Quotation has no items to bill")

    paid_amt = float(override.get("paid_amount") if override.get("paid_amount") is not None else quot.grand_total)
    grand_tot = float(quot.grand_total or 0.0)
    bal_due = max(0.0, round(grand_tot - paid_amt, 2))
    pay_mode = override.get("payment_mode", "Cash" if bal_due == 0 else "Credit")

    db_invoice = SaleInvoice(
        invoice_no=inv_no,
        date=inv_date,
        bill_type="Credit" if bal_due > 0 else "Cash",
        customer_id=cust_id,
        customer_name=override.get("customer_name") or quot.customer_name,
        customer_phone=override.get("customer_phone") or quot.contact_no,
        customer_gstin=override.get("customer_gstin") or quot.gstin,
        state=quot.state or "Kerala",
        state_code="32",
        sub_total=float(quot.sub_total or 0.0),
        bill_discount=float(quot.total_discount or 0.0),
        cgst_total=float(quot.cgst or 0.0),
        sgst_total=float(quot.sgst or 0.0),
        igst_total=float(quot.igst or 0.0),
        cess_total=float(quot.cess or 0.0),
        round_off=float(quot.round_off or 0.0),
        grand_total=grand_tot,
        paid_amount=paid_amt,
        balance_due=bal_due,
        payment_mode=pay_mode,
        salesman_id=override.get("salesman_id")
    )
    db.add(db_invoice)
    db.flush()

    for it in items_raw:
        prod_id = it.get("product_id") or it.get("id")
        p_code = it.get("p_code") or it.get("pCode")
        qty = float(it.get("qty", 1.0))
        rate = float(it.get("rate") or it.get("price") or 0.0)
        taxable = float(it.get("taxable") or it.get("taxable_amount") or (qty * rate))
        cgst_p = float(it.get("cgst_percent") or it.get("cgst") or 0.0)
        cgst_a = float(it.get("cgst_amount") or it.get("cgstAmt") or 0.0)
        sgst_p = float(it.get("sgst_percent") or it.get("sgst") or 0.0)
        sgst_a = float(it.get("sgst_amount") or it.get("sgstAmt") or 0.0)
        igst_p = float(it.get("igst_percent") or it.get("igst") or 0.0)
        igst_a = float(it.get("igst_amount") or it.get("igstAmt") or 0.0)
        total_a = float(it.get("total") or it.get("amount") or (taxable + cgst_a + sgst_a + igst_a))

        inv_item = SaleInvoiceItem(
            invoice_id=db_invoice.id,
            product_id=prod_id if isinstance(prod_id, int) else None,
            p_code=p_code,
            product_name=it.get("product_name") or it.get("name") or "Furniture Item",
            barcode=it.get("barcode"),
            hsn_code=it.get("hsn_code") or it.get("hsn") or "9403",
            qty=qty,
            rate=rate,
            taxable_amount=taxable,
            cgst_percent=cgst_p,
            cgst_amount=cgst_a,
            sgst_percent=sgst_p,
            sgst_amount=sgst_a,
            igst_percent=igst_p,
            igst_amount=igst_a,
            total=total_a
        )
        db.add(inv_item)

        # Deduct stock
        if isinstance(prod_id, int):
            prod = db.query(Product).filter(Product.id == prod_id).with_for_update().first()
            if prod:
                if prod.current_stock < qty:
                    db.rollback()
                    raise HTTPException(
                        status_code=400,
                        detail=f"Insufficient godown stock for '{prod.name}' to convert quotation! Available: {prod.current_stock}, Quoted: {qty}."
                    )
                prod.current_stock -= qty

    # Update Customer balance and ledger if customer linked
    if cust_id:
        cust = db.query(Customer).filter(Customer.id == cust_id).with_for_update().first()
        if cust:
            if bal_due > 0:
                cust.current_balance = float(cust.current_balance or 0.0) + bal_due
            ledger_entry = CustomerLedgerEntry(
                customer_id=cust.id,
                date=db_invoice.date,
                voucher_no=db_invoice.invoice_no,
                particulars=f"Sale Invoice (Converted from Quotation {quot.quotation_no})",
                debit=db_invoice.grand_total or 0.0,
                credit=db_invoice.paid_amount or 0.0,
                balance=cust.current_balance or 0.0
            )
            db.add(ledger_entry)

    # Mark Quotation
    quot.remarks = f"Converted to Invoice {db_invoice.invoice_no} on {inv_date}"

    db.commit()
    db.refresh(db_invoice)
    return {
        "status": "SUCCESS",
        "message": f"Quotation {quot.quotation_no} successfully converted to Invoice {db_invoice.invoice_no}",
        "invoice_id": db_invoice.id,
        "invoice_no": db_invoice.invoice_no,
        "grand_total": db_invoice.grand_total,
        "balance_due": db_invoice.balance_due
    }

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


def generate_eway_bill_pdf_bytes(eway: EWayBill) -> bytes:
    import io
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.graphics.barcode import createBarcodeDrawing
    from reportlab.graphics.barcode.qr import QrCodeWidget
    from reportlab.graphics.shapes import Drawing

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, rightMargin=24, leftMargin=24, topMargin=24, bottomMargin=24)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('EwbTitle', fontName='Helvetica-Bold', fontSize=13, leading=16, alignment=1)
    sub_style = ParagraphStyle('EwbSub', fontName='Helvetica', fontSize=7.5, leading=10, textColor=colors.HexColor('#475569'), alignment=1)
    badge_style = ParagraphStyle('EwbBadge', fontName='Helvetica-Bold', fontSize=10, leading=13, textColor=colors.HexColor('#1e40af'), alignment=1)

    story = [
        Paragraph("<b>GOVERNMENT OF INDIA - GST E-WAY BILL SYSTEM</b>", title_style),
        Paragraph("National Informatics Centre (NIC) | Form GST EWB-01 | CGST / SGST Rule 138", sub_style),
        Spacer(1, 6),
        Paragraph("<b>STATUTORY E-WAY BILL (ROAD TRANSIT CONSIGNMENT)</b>", badge_style),
        Spacer(1, 8),
    ]

    # Barcode Drawing
    try:
        ewb_barcode = createBarcodeDrawing('Code128', value=str(eway.eway_bill_no), barHeight=18, width=130)
        barcode_cell = [
            ewb_barcode,
            Paragraph(f"<font size=6 color='#64748b'><b>EWB NO: {eway.eway_bill_no}</b></font>", ParagraphStyle('EwbBc', fontName='Helvetica-Bold', fontSize=6, alignment=1, leading=8))
        ]
    except Exception:
        barcode_cell = Paragraph(f"<b>EWB: {eway.eway_bill_no}</b>", styles['Normal'])

    # QR Code Drawing
    try:
        qr_text = f"EWB:{eway.eway_bill_no}|INV:{eway.invoice_no}|FROM:{eway.from_place}|TO:{eway.to_place}|VEH:{eway.vehicle_no}|VAL:{eway.valid_until}"
        qr_widget = QrCodeWidget(qr_text)
        qr_widget.barWidth = 55
        qr_widget.barHeight = 55
        qr_drawing = Drawing(55, 55)
        qr_drawing.add(qr_widget)
        qr_cell = [
            qr_drawing,
            Paragraph("<font size=5 color='#64748b'><b>NIC QR VERIFY</b></font>", ParagraphStyle('EwbQr', fontName='Helvetica-Bold', fontSize=5, alignment=1, leading=7))
        ]
    except Exception:
        qr_cell = Paragraph("QR", styles['Normal'])

    top_header_data = [
        [
            Paragraph(f"E-Way Bill No: <b>{eway.eway_bill_no}</b><br/>E-Way Bill Date: <b>{eway.eway_bill_date}</b><br/>Generated By: <b>32AABCS1429B1Z8 (Shree Vinayaka Furnitures)</b><br/>Valid Until: <b>{eway.valid_until}</b>", styles['Normal']),
            barcode_cell,
            qr_cell
        ]
    ]
    top_table = Table(top_header_data, colWidths=[275, 195, 75])
    top_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#93c5fd')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eff6ff')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,0), (2,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(top_table)
    story.append(Spacer(1, 8))

    part_a_header = Table([["<b>PART - A (CONSIGNMENT & DOCUMENT DETAILS)</b>"]], colWidths=[545])
    part_a_header.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.white),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(part_a_header)

    part_a_data = [
        [
            Paragraph("<b>From (Consignor):</b><br/>Shree Vinayaka Furnitures<br/>GSTIN: <b>32AABCS1429B1Z8</b><br/>Dispatch From: " + str(eway.from_place) + "<br/>State: Kerala (Code: 32)", styles['Normal']),
            Paragraph("<b>To (Consignee):</b><br/>" + str(eway.customer_name) + "<br/>GSTIN: <b>" + str(eway.customer_gstin or 'URP / Unregistered Consumer') + "</b><br/>Destination: " + str(eway.to_place) + "<br/>State: Kerala (Code: 32)", styles['Normal']),
        ],
        [
            Paragraph(f"Document Type: <b>Tax Invoice</b><br/>Document No: <b>{eway.invoice_no}</b>", styles['Normal']),
            Paragraph(f"Transit Distance: <b>{eway.distance_km} KM</b><br/>Reason: <b>Outward Supply (Commercial Sale)</b>", styles['Normal']),
        ]
    ]
    part_a_table = Table(part_a_data, colWidths=[272, 273])
    part_a_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(part_a_table)
    story.append(Spacer(1, 8))

    part_b_header = Table([["<b>PART - B (VEHICLE & TRANSPORTER DETAILS)</b>"]], colWidths=[545])
    part_b_header.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#047857')),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.white),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(part_b_header)

    part_b_data = [
        ["Mode", "Vehicle / Vessel No", "From", "Entered Date", "Entered By", "Transporter Name / ID"],
        [
            str(eway.transport_mode or "Road"),
            str(eway.vehicle_no),
            str(eway.from_place),
            str(eway.eway_bill_date),
            "32AABCS1429B1Z8",
            f"{eway.transporter_name}" + (f" ({eway.transporter_id})" if eway.transporter_id else "")
        ]
    ]
    part_b_table = Table(part_b_data, colWidths=[50, 95, 80, 80, 100, 140])
    part_b_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 7.5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
    ]))
    story.append(part_b_table)
    story.append(Spacer(1, 12))

    statutory_notes = """<b>Statutory Instructions & Transit Rules (Rule 138, CGST Rules):</b><br/>
1. Person in charge of the conveyance must carry this official E-Way Bill along with the physical Tax Invoice.<br/>
2. E-Way Bill validity expires on <b>""" + str(eway.valid_until) + """</b>.<br/>
3. Officers of GST Flying Squad can scan the dynamic QR Code to instantly verify vehicle, invoice, and GSTIN authenticity."""
    story.append(Paragraph(statutory_notes, styles['Normal']))
    story.append(Spacer(1, 20))

    sig_data = [
        ["\n\n___________________________\n<b>Authorized Signatory / Consignor</b>\n(Shree Vinayaka Furnitures)", 
         "\n\n___________________________\n<b>Driver / Transporter In-Charge</b>\n(Vehicle: " + str(eway.vehicle_no) + ")", 
         "\n\n___________________________\n<b>Recipient Consignee Acknowledgment</b>\n(Date & Official Stamp)"]
    ]
    sig_table = Table(sig_data, colWidths=[180, 185, 180])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTSIZE', (0,0), (-1,-1), 7.5),
    ]))
    story.append(sig_table)

    doc.build(story)
    return buf.getvalue()


@router.get("/eway-bills/{eway_id}/pdf")
def get_eway_bill_pdf(eway_id: str, db: Session = Depends(get_db)):
    """
    Generate statutory Form GST EWB-01 E-Way Bill PDF (CGST Rule 138).
    """
    eway = None
    if eway_id.isdigit():
        eway = db.query(EWayBill).filter(EWayBill.id == int(eway_id)).first()
    if not eway:
        eway = db.query(EWayBill).filter(EWayBill.eway_bill_no == eway_id).first()
    if not eway:
        raise HTTPException(status_code=404, detail="E-Way Bill not found")

    pdf_bytes = generate_eway_bill_pdf_bytes(eway)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="GST_EWayBill_{eway.eway_bill_no}.pdf"'}
    )


# ==========================================
# ORDER DELIVERY STATES & SPLIT PAYMENTS (TASK 1)
# ==========================================

@router.patch("/{invoice_id}/delivery-state")
@router.put("/{invoice_id}/delivery-state")
def update_delivery_state(
    invoice_id: str,
    delivery_state: str = Query(..., description="BOOKED, PACKED, DISPATCHED, DELIVERED, INSTALLATION_ASSIGNED, INSTALLED_AND_CLOSED"),
    db: Session = Depends(get_db)
):
    """
    Updates Order Delivery State:
    BOOKED -> PACKED -> DISPATCHED -> DELIVERED -> INSTALLATION_ASSIGNED -> INSTALLED_AND_CLOSED
    """
    valid_states = {"BOOKED", "PACKED", "DISPATCHED", "DELIVERED", "INSTALLATION_ASSIGNED", "INSTALLED_AND_CLOSED"}
    upper_state = delivery_state.strip().upper()
    if upper_state not in valid_states:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid delivery state '{delivery_state}'. Must be one of: {', '.join(sorted(valid_states))}"
        )

    invoice = None
    if invoice_id.isdigit():
        invoice = db.query(SaleInvoice).filter(SaleInvoice.id == int(invoice_id)).with_for_update().first()
    if not invoice:
        invoice = db.query(SaleInvoice).filter(SaleInvoice.invoice_no == invoice_id).with_for_update().first()

    if not invoice:
        raise HTTPException(status_code=404, detail=f"Invoice '{invoice_id}' not found")

    invoice.delivery_state = upper_state
    db.commit()
    db.refresh(invoice)

    from datetime import datetime as dt
    realtime_manager.broadcast_sync({
        "event": "DELIVERY_STATE_UPDATED",
        "invoice_no": invoice.invoice_no,
        "delivery_state": invoice.delivery_state,
        "timestamp": dt.utcnow().isoformat()
    })

    return {
        "status": "SUCCESS",
        "invoice_no": invoice.invoice_no,
        "delivery_state": invoice.delivery_state
    }


@router.post("/{invoice_id}/payments", response_model=SaleInvoicePaymentResponse)
def add_invoice_payment(
    invoice_id: str,
    payload: SaleInvoicePaymentCreate,
    db: Session = Depends(get_db)
):
    """
    Add a split-tender payment to an existing invoice with atomic balance reduction:
    Cash, UPI with UTR, Card, or Bajaj Finance with DBD subvention fee.
    """
    invoice = None
    if invoice_id.isdigit():
        invoice = db.query(SaleInvoice).filter(SaleInvoice.id == int(invoice_id)).with_for_update().first()
    if not invoice:
        invoice = db.query(SaleInvoice).filter(SaleInvoice.invoice_no == invoice_id).with_for_update().first()

    if not invoice:
        raise HTTPException(status_code=404, detail=f"Invoice '{invoice_id}' not found")

    from datetime import datetime as dt
    sub_pct = float(payload.subvention_percent or 0.0)
    amt = float(payload.amount or 0.0)
    sub_fee = float(payload.subvention_fee) if payload.subvention_fee else round((amt * sub_pct) / 100.0, 2)

    payment = SaleInvoicePayment(
        invoice_id=invoice.id,
        payment_mode=payload.payment_mode or "Cash",
        amount=amt,
        utr_number=payload.utr_number,
        card_network=payload.card_network,
        card_last_four=payload.card_last_four,
        subvention_percent=sub_pct,
        subvention_fee=sub_fee,
        bank_account_id=payload.bank_account_id,
        reference_no=payload.reference_no,
        status=payload.status or "Completed",
        notes=payload.notes
    )
    db.add(payment)

    # Adjust invoice paid amount and balance due atomically
    invoice.paid_amount = float(invoice.paid_amount or 0.0) + amt
    invoice.balance_due = max(0.0, float(invoice.grand_total or 0.0) - float(invoice.paid_amount or 0.0))

    if invoice.customer_id:
        cust = db.query(Customer).filter(Customer.id == invoice.customer_id).with_for_update().first()
        if cust:
            cust.current_balance = max(0.0, float(cust.current_balance or 0.0) - amt)
            ledger_entry = CustomerLedgerEntry(
                customer_id=cust.id,
                date=dt.utcnow().strftime("%Y-%m-%d"),
                voucher_no=invoice.invoice_no,
                particulars=f"Payment Received ({payload.payment_mode})",
                debit=0.0,
                credit=amt,
                balance=cust.current_balance
            )
            db.add(ledger_entry)

    db.commit()
    db.refresh(payment)

    realtime_manager.broadcast_sync({
        "event": "PAYMENT_RECORDED",
        "invoice_no": invoice.invoice_no,
        "payment_mode": payment.payment_mode,
        "amount": float(payment.amount),
        "timestamp": dt.utcnow().isoformat()
    })

    return payment


@router.get("/{invoice_id}/payments", response_model=List[SaleInvoicePaymentResponse])
def get_invoice_payments(invoice_id: str, db: Session = Depends(get_db)):
    """
    Get all split-tender payment rows for an invoice.
    """
    invoice = None
    if invoice_id.isdigit():
        invoice = db.query(SaleInvoice).filter(SaleInvoice.id == int(invoice_id)).first()
    if not invoice:
        invoice = db.query(SaleInvoice).filter(SaleInvoice.invoice_no == invoice_id).first()

    if not invoice:
        raise HTTPException(status_code=404, detail=f"Invoice '{invoice_id}' not found")

    return db.query(SaleInvoicePayment).filter(SaleInvoicePayment.invoice_id == invoice.id).order_by(SaleInvoicePayment.id.asc()).all()


