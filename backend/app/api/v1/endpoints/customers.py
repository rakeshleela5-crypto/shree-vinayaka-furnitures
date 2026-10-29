from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime as dt, timedelta
from urllib.parse import quote
from app.core.database import get_db
from app.services.realtime import realtime_manager
from app.models.customer import Customer, CustomerLedgerEntry, LoyaltyTransaction, CustomerWishlist, CustomerReceipt
from app.models.accounting import IncomeVoucher
from app.models.sale import SaleInvoice
from app.models.product import Product
from app.schemas.customer import (
    CustomerCreate, CustomerUpdate, CustomerResponse,
    CustomerLedgerEntryResponse, LoyaltyTransactionResponse,
    CustomerAgingRow, CustomerCreditAgingSummary,
    CustomerInvoiceAgingItem, CustomerCreditAgingDetailResponse,
    PaymentReminderResponse,
    CustomerWishlistCreate, CustomerWishlistResponse,
    CustomerReceiptCreate, CustomerReceiptResponse
)

router = APIRouter()

def parse_date_safely(d_str: Optional[str], default_dt: dt) -> dt:
    if not d_str:
        return default_dt
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return dt.strptime(d_str.strip(), fmt)
        except Exception:
            continue
    return default_dt

@router.get("/", response_model=List[CustomerResponse])
def get_customers(
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 5000,
    db: Session = Depends(get_db)
):
    query = db.query(Customer).filter(Customer.active == True)
    if search:
        s = f"%{search}%"
        query = query.filter((Customer.name.ilike(s)) | (Customer.phone.ilike(s)) | (Customer.code.ilike(s)))
    return query.offset(skip).limit(limit).all()

# =====================================================================
# CUSTOMER CREDIT AGING SUMMARY (0-30, 31-60, 61-90, 91-120, >120 DAYS)
# =====================================================================
@router.get("/credit-aging", response_model=CustomerCreditAgingSummary)
def get_customer_credit_aging(
    min_days: Optional[int] = Query(None, description="Filter customers with dues older than N days"),
    db: Session = Depends(get_db)
):
    now = dt.now()
    customers = db.query(Customer).filter(Customer.active == True).all()
    
    rows: List[CustomerAgingRow] = []
    bucket_0_30_total = 0.0
    bucket_31_60_total = 0.0
    bucket_61_90_total = 0.0
    bucket_91_120_total = 0.0
    bucket_over_120_total = 0.0
    total_receivables = 0.0
    
    for c in customers:
        cur_bal = float(c.current_balance or 0.0)
        unpaid_invoices = db.query(SaleInvoice).filter(
            SaleInvoice.customer_id == c.id,
            SaleInvoice.balance_due > 0
        ).order_by(SaleInvoice.id.asc()).all()
        
        if cur_bal <= 0.0 and len(unpaid_invoices) == 0:
            continue

        b_0_30 = 0.0
        b_31_60 = 0.0
        b_61_90 = 0.0
        b_91_120 = 0.0
        b_over_120 = 0.0
        oldest_days = 0
        oldest_inv_no = None

        if unpaid_invoices:
            for inv in unpaid_invoices:
                inv_dt = parse_date_safely(inv.date, inv.created_at or now)
                days = max(0, (now - inv_dt).days)
                if days > oldest_days:
                    oldest_days = days
                    oldest_inv_no = inv.invoice_no
                
                bal = float(inv.balance_due or 0.0)
                if days <= 30:
                    b_0_30 += bal
                elif days <= 60:
                    b_31_60 += bal
                elif days <= 90:
                    b_61_90 += bal
                elif days <= 120:
                    b_91_120 += bal
                else:
                    b_over_120 += bal
        else:
            created_dt = c.created_at or now
            days = max(0, (now - created_dt).days)
            oldest_days = days
            oldest_inv_no = "Khata Opening Balance"
            if days <= 30:
                b_0_30 += cur_bal
            elif days <= 60:
                b_31_60 += cur_bal
            elif days <= 90:
                b_61_90 += cur_bal
            elif days <= 120:
                b_91_120 += cur_bal
            else:
                b_over_120 += cur_bal

        total_customer_due = max(cur_bal, (b_0_30 + b_31_60 + b_61_90 + b_91_120 + b_over_120))
        if total_customer_due <= 0.0:
            continue

        if min_days is not None and oldest_days < min_days:
            continue

        risk = "Current"
        if b_over_120 > 0 or oldest_days > 120:
            risk = "Critical"
        elif b_91_120 > 0 or oldest_days > 90:
            risk = "Warning"
        elif b_61_90 > 0 or oldest_days > 60:
            risk = "Notice"
        elif b_31_60 > 0 or oldest_days > 30:
            risk = "Follow-up"

        row = CustomerAgingRow(
            customer_id=c.id,
            code=c.code,
            name=c.name,
            phone=c.phone,
            credit_limit=float(c.credit_limit or 50000.0),
            current_balance=cur_bal,
            total_unpaid_invoices_amount=round(b_0_30 + b_31_60 + b_61_90 + b_91_120 + b_over_120, 2),
            bucket_0_30=round(b_0_30, 2),
            bucket_31_60=round(b_31_60, 2),
            bucket_61_90=round(b_61_90, 2),
            bucket_91_120=round(b_91_120, 2),
            bucket_over_120=round(b_over_120, 2),
            oldest_overdue_days=oldest_days,
            oldest_invoice_no=oldest_inv_no,
            risk_level=risk,
            unpaid_invoices_count=len(unpaid_invoices)
        )
        rows.append(row)

        bucket_0_30_total += b_0_30
        bucket_31_60_total += b_31_60
        bucket_61_90_total += b_61_90
        bucket_91_120_total += b_91_120
        bucket_over_120_total += b_over_120
        total_receivables += total_customer_due

    rows.sort(key=lambda r: (r.bucket_over_120 + r.bucket_91_120, r.oldest_overdue_days), reverse=True)

    return CustomerCreditAgingSummary(
        total_receivables=round(total_receivables, 2),
        total_customers_with_dues=len(rows),
        bucket_0_30_total=round(bucket_0_30_total, 2),
        bucket_31_60_total=round(bucket_31_60_total, 2),
        bucket_61_90_total=round(bucket_61_90_total, 2),
        bucket_91_120_total=round(bucket_91_120_total, 2),
        bucket_over_120_total=round(bucket_over_120_total, 2),
        high_risk_amount=round(bucket_91_120_total + bucket_over_120_total, 2),
        rows=rows
    )

# ==========================================
# CUSTOMER WISHLIST (SHOWROOM PORTAL)
# ==========================================

@router.get("/wishlist", response_model=List[CustomerWishlistResponse])
def get_customer_wishlist(
    customer_id: Optional[int] = Query(None),
    phone: Optional[str] = Query(None),
    session_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Retrieve customer wishlist items filtered by customer_id, phone, or session_id.
    """
    query = db.query(CustomerWishlist)
    if customer_id:
        query = query.filter(CustomerWishlist.customer_id == customer_id)
    elif phone:
        query = query.filter(CustomerWishlist.customer_phone == phone)
    elif session_id:
        query = query.filter(CustomerWishlist.session_id == session_id)
    else:
        # Default return latest 100
        query = query.order_by(CustomerWishlist.id.desc()).limit(100)

    items = query.all()
    results = []
    for it in items:
        prod = db.query(Product).filter(Product.id == it.product_id).first()
        results.append(CustomerWishlistResponse(
            id=it.id,
            product_id=it.product_id,
            customer_id=it.customer_id,
            customer_phone=it.customer_phone,
            session_id=it.session_id,
            created_at=it.created_at,
            product_title=prod.name if prod else f"Product #{it.product_id}",
            product_price=float(prod.retail_price or prod.mrp or 0.0) if prod else 0.0,
            product_image=prod.image_url if prod else None
        ))
    return results


@router.post("/wishlist", response_model=CustomerWishlistResponse)
def add_to_customer_wishlist(
    payload: CustomerWishlistCreate,
    db: Session = Depends(get_db)
):
    """
    Add a product to the customer wishlist (idempotent).
    """
    query = db.query(CustomerWishlist).filter(CustomerWishlist.product_id == payload.product_id)
    if payload.customer_id:
        query = query.filter(CustomerWishlist.customer_id == payload.customer_id)
    elif payload.customer_phone:
        query = query.filter(CustomerWishlist.customer_phone == payload.customer_phone)
    elif payload.session_id:
        query = query.filter(CustomerWishlist.session_id == payload.session_id)

    existing = query.first()
    if existing:
        prod = db.query(Product).filter(Product.id == existing.product_id).first()
        return CustomerWishlistResponse(
            id=existing.id,
            product_id=existing.product_id,
            customer_id=existing.customer_id,
            customer_phone=existing.customer_phone,
            session_id=existing.session_id,
            created_at=existing.created_at,
            product_title=prod.name if prod else f"Product #{existing.product_id}",
            product_price=float(prod.retail_price or prod.mrp or 0.0) if prod else 0.0,
            product_image=prod.image_url if prod else None
        )

    item = CustomerWishlist(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)

    prod = db.query(Product).filter(Product.id == item.product_id).first()
    return CustomerWishlistResponse(
        id=item.id,
        product_id=item.product_id,
        customer_id=item.customer_id,
        customer_phone=item.customer_phone,
        session_id=item.session_id,
        created_at=item.created_at,
        product_title=prod.name if prod else f"Product #{item.product_id}",
        product_price=float(prod.retail_price or prod.mrp or 0.0) if prod else 0.0,
        product_image=prod.image_url if prod else None
    )


@router.delete("/wishlist/{product_id}")
def remove_from_customer_wishlist(
    product_id: int,
    customer_id: Optional[int] = Query(None),
    phone: Optional[str] = Query(None),
    session_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Remove a product from the wishlist.
    """
    query = db.query(CustomerWishlist).filter(CustomerWishlist.product_id == product_id)
    if customer_id:
        query = query.filter(CustomerWishlist.customer_id == customer_id)
    elif phone:
        query = query.filter(CustomerWishlist.customer_phone == phone)
    elif session_id:
        query = query.filter(CustomerWishlist.session_id == session_id)

    deleted_count = query.delete(synchronize_session=False)
    db.commit()
    return {"status": "SUCCESS", "deleted_count": deleted_count, "product_id": product_id}


# ==========================================
# CUSTOMER PAYMENT RECEIPTS
# ==========================================

@router.get("/receipts", response_model=List[CustomerReceiptResponse])
def get_customer_receipts(
    customer_id: Optional[int] = Query(None),
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    List customer money receipts.
    """
    query = db.query(CustomerReceipt)
    if customer_id:
        query = query.filter(CustomerReceipt.customer_id == customer_id)
    receipts = query.order_by(CustomerReceipt.id.desc()).limit(limit).all()

    results = []
    for r in receipts:
        cust = db.query(Customer).filter(Customer.id == r.customer_id).first()
        results.append(CustomerReceiptResponse(
            id=r.id,
            receipt_no=r.receipt_no,
            customer_id=r.customer_id,
            amount=float(r.amount),
            payment_mode=r.payment_mode or "Cash",
            bank_ac_no=r.bank_ac_no,
            transaction_ref=r.transaction_ref,
            remarks=r.remarks,
            date=r.date,
            created_at=r.created_at,
            customer_name=cust.name if cust else f"Customer #{r.customer_id}"
        ))
    return results


@router.post("/receipts", response_model=CustomerReceiptResponse)
def create_customer_receipt(
    payload: CustomerReceiptCreate,
    db: Session = Depends(get_db)
):
    """
    Post a customer money receipt with atomic ledger posting and balance deduction.
    """
    cust = db.query(Customer).filter(Customer.id == payload.customer_id).with_for_update().first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    existing = db.query(CustomerReceipt).filter(CustomerReceipt.receipt_no == payload.receipt_no).first()
    if existing:
        return CustomerReceiptResponse(
            id=existing.id,
            receipt_no=existing.receipt_no,
            customer_id=existing.customer_id,
            amount=float(existing.amount),
            payment_mode=existing.payment_mode or "Cash",
            bank_ac_no=existing.bank_ac_no,
            transaction_ref=existing.transaction_ref,
            remarks=existing.remarks,
            date=existing.date,
            created_at=existing.created_at,
            customer_name=cust.name
        )

    receipt = CustomerReceipt(**payload.model_dump())
    db.add(receipt)

    amt = float(payload.amount or 0.0)
    cust.current_balance = max(0.0, float(cust.current_balance or 0.0) - amt)

    # Post to Customer Ledger
    ledger_entry = CustomerLedgerEntry(
        customer_id=cust.id,
        date=payload.date,
        voucher_no=payload.receipt_no,
        particulars=f"Money Receipt ({payload.payment_mode}) - {payload.remarks or 'Payment'}",
        debit=0.0,
        credit=amt,
        balance=cust.current_balance
    )
    db.add(ledger_entry)

    db.commit()
    db.refresh(receipt)

    realtime_manager.broadcast_sync({
        "event": "CUSTOMER_RECEIPT_POSTED",
        "receipt_no": receipt.receipt_no,
        "customer_name": cust.name,
        "amount": amt,
        "payment_mode": receipt.payment_mode,
        "timestamp": dt.utcnow().isoformat()
    })

    return CustomerReceiptResponse(
        id=receipt.id,
        receipt_no=receipt.receipt_no,
        customer_id=receipt.customer_id,
        amount=float(receipt.amount),
        payment_mode=receipt.payment_mode or "Cash",
        bank_ac_no=receipt.bank_ac_no,
        transaction_ref=receipt.transaction_ref,
        remarks=receipt.remarks,
        date=receipt.date,
        created_at=receipt.created_at,
        customer_name=cust.name
    )



def resolve_customer_by_id_or_string(customer_id: str, db: Session) -> Optional[Customer]:
    if not customer_id:
        return None
    s = str(customer_id).strip()
    if not s or s.lower() in ("undefined", "null", "none"):
        return None
    # 1. Exact numeric ID match
    if s.isdigit():
        c = db.query(Customer).filter(Customer.id == int(s)).first()
        if c:
            return c
    # 2. Customer code match (e.g. C-0001, CUST-1234)
    c = db.query(Customer).filter(Customer.code.ilike(s)).first()
    if c:
        return c
    # 3. Clean numeric digits from string (e.g. "cust-12" -> 12, or phone numbers)
    digits = "".join(filter(str.isdigit, s))
    if len(digits) >= 10:
        c = db.query(Customer).filter(Customer.phone.contains(digits[-10:])).first()
        if c:
            return c
    elif digits and len(digits) <= 8:
        c = db.query(Customer).filter(Customer.id == int(digits)).first()
        if c:
            return c
    # 4. Direct phone or name match
    c = db.query(Customer).filter((Customer.phone == s) | (Customer.name.ilike(s))).first()
    if c:
        return c
    # 5. Partial name search
    c = db.query(Customer).filter(Customer.name.ilike(f"%{s}%")).first()
    if c:
        return c
    return None

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: str, db: Session = Depends(get_db)):
    customer = resolve_customer_by_id_or_string(customer_id, db)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.post("/", response_model=CustomerResponse)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    from app.core.sanitizer import sanitize_text
    # XSS Input Sanitization (#43)
    if payload.name:
        payload.name = sanitize_text(payload.name)
    if hasattr(payload, "address") and payload.address:
        payload.address = sanitize_text(payload.address)
    if hasattr(payload, "shipping_address") and payload.shipping_address:
        payload.shipping_address = sanitize_text(payload.shipping_address)
    if hasattr(payload, "billing_address") and payload.billing_address:
        payload.billing_address = sanitize_text(payload.billing_address)
    if hasattr(payload, "notes") and payload.notes:
        payload.notes = sanitize_text(payload.notes)

    if not payload.code:
        payload.code = f"CUST-{int(dt.utcnow().timestamp())}"

    existing = None
    if payload.code:
        existing = db.query(Customer).filter(Customer.code == payload.code).first()
    if not existing and payload.phone:
        digits = "".join(filter(str.isdigit, str(payload.phone)))
        if len(digits) >= 10:
            existing = db.query(Customer).filter(Customer.phone.contains(digits[-10:])).first()

    if existing:
        for key, value in payload.model_dump(exclude_unset=True).items():
            if value is not None and value != "":
                setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        realtime_manager.broadcast_sync({
            "event": "CUSTOMER_UPDATED",
            "customer_id": existing.id,
            "name": existing.name,
            "timestamp": dt.utcnow().isoformat()
        })
        return existing
    
    db_customer = Customer(**payload.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    realtime_manager.broadcast_sync({
        "event": "CUSTOMER_UPDATED",
        "customer_id": db_customer.id,
        "name": db_customer.name,
        "timestamp": dt.utcnow().isoformat()
    })
    return db_customer

@router.put("/", response_model=CustomerResponse)
def update_customer_root(payload: CustomerUpdate, db: Session = Depends(get_db)):
    """
    Fallback handler when client sends PUT /customers/ without customer_id in URL path.
    Prevents HTTP 405 Method Not Allowed by resolving customer from payload.
    """
    from app.core.sanitizer import sanitize_text
    target = None
    if payload.phone:
        digits = "".join(filter(str.isdigit, str(payload.phone)))
        if len(digits) >= 10:
            target = db.query(Customer).filter(Customer.phone.contains(digits[-10:])).first()
    if not target and payload.name:
        target = db.query(Customer).filter(Customer.name.ilike(payload.name.strip())).first()

    if target:
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(target, key, value)
        db.commit()
        db.refresh(target)
        realtime_manager.broadcast_sync({
            "event": "CUSTOMER_UPDATED",
            "customer_id": target.id,
            "name": target.name,
            "timestamp": dt.utcnow().isoformat()
        })
        return target

    create_payload = CustomerCreate(**payload.model_dump(exclude_unset=True))
    return create_customer(create_payload, db)

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: str, payload: CustomerUpdate, db: Session = Depends(get_db)):
    from app.core.sanitizer import sanitize_text
    db_customer = resolve_customer_by_id_or_string(customer_id, db)
    if not db_customer and payload.phone:
        digits = "".join(filter(str.isdigit, str(payload.phone)))
        if len(digits) >= 10:
            db_customer = db.query(Customer).filter(Customer.phone.contains(digits[-10:])).first()

    if not db_customer:
        # If customer does not exist yet, create gracefully rather than throwing 404
        create_payload = CustomerCreate(**payload.model_dump(exclude_unset=True))
        return create_customer(create_payload, db)

    # XSS Input Sanitization (#43)
    if payload.name:
        payload.name = sanitize_text(payload.name)
    if hasattr(payload, "address") and payload.address:
        payload.address = sanitize_text(payload.address)
    if hasattr(payload, "shipping_address") and payload.shipping_address:
        payload.shipping_address = sanitize_text(payload.shipping_address)
    if hasattr(payload, "billing_address") and payload.billing_address:
        payload.billing_address = sanitize_text(payload.billing_address)
    if hasattr(payload, "notes") and payload.notes:
        payload.notes = sanitize_text(payload.notes)
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_customer, key, value)
    
    db.commit()
    db.refresh(db_customer)
    realtime_manager.broadcast_sync({
        "event": "CUSTOMER_UPDATED",
        "customer_id": db_customer.id,
        "name": db_customer.name,
        "timestamp": dt.utcnow().isoformat()
    })
    return db_customer

# Customer Account Ledger (Video 07 & 20)
@router.get("/all/ledger", response_model=List[CustomerLedgerEntryResponse])
def get_all_customer_ledgers(db: Session = Depends(get_db)):
    return db.query(CustomerLedgerEntry).order_by(CustomerLedgerEntry.id.desc()).limit(1000).all()

@router.get("/{customer_id}/ledger", response_model=List[CustomerLedgerEntryResponse])
def get_customer_ledger(customer_id: str, db: Session = Depends(get_db)):
    customer = resolve_customer_by_id_or_string(customer_id, db)
    if not customer:
        return []
    return db.query(CustomerLedgerEntry).filter(CustomerLedgerEntry.customer_id == customer.id).order_by(CustomerLedgerEntry.id.desc()).all()

@router.post("/{customer_id}/ledger", response_model=CustomerLedgerEntryResponse)
def add_customer_ledger_entry(customer_id: str, payload: dict, db: Session = Depends(get_db)):
    customer = resolve_customer_by_id_or_string(customer_id, db)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Row-lock customer to prevent balance race conditions
    customer = db.query(Customer).filter(Customer.id == customer.id).with_for_update().first()
    debit = float(payload.get("debit", 0.0))
    credit = float(payload.get("credit", 0.0))
    customer.current_balance = float(customer.current_balance or 0.0) + debit - credit
    
    entry = CustomerLedgerEntry(
        customer_id=customer.id,
        date=payload.get("date", ""),
        voucher_no=payload.get("voucher_no", ""),
        particulars=payload.get("particulars", ""),
        debit=debit,
        credit=credit,
        balance=customer.current_balance
    )
    db.add(entry)

    # Atomically update invoice payment status & amount_paid if this receipt settles an invoice
    inv_ref = payload.get("invoice_no") or payload.get("ref_no") or payload.get("invoice_id")
    if credit > 0:
        sale_inv = None
        if inv_ref:
            if isinstance(inv_ref, int) or (isinstance(inv_ref, str) and str(inv_ref).isdigit()):
                sale_inv = db.query(SaleInvoice).filter(SaleInvoice.id == int(inv_ref)).with_for_update().first()
            if not sale_inv:
                sale_inv = db.query(SaleInvoice).filter(SaleInvoice.invoice_no == str(inv_ref).strip()).with_for_update().first()
        
        # If no explicit inv_ref provided, find oldest open invoice with pending balance
        if not sale_inv:
            sale_inv = db.query(SaleInvoice).filter(
                SaleInvoice.customer_id == customer.id,
                SaleInvoice.balance_due > 0.01,
                SaleInvoice.status != "Voided"
            ).order_by(SaleInvoice.id.asc()).with_for_update().first()

        if sale_inv:
            sale_inv.paid_amount = float(sale_inv.paid_amount or 0.0) + credit
            sale_inv.balance_due = max(0.0, float(sale_inv.grand_total or 0.0) - sale_inv.paid_amount)
            if sale_inv.balance_due <= 0.01:
                sale_inv.status = "PAID"
            else:
                sale_inv.status = "PARTIAL"

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
    realtime_manager.broadcast_sync({
        "event": "LEDGER_UPDATED",
        "customer_id": customer_id,
        "voucher_no": entry.voucher_no,
        "balance": customer.current_balance,
        "timestamp": dt.utcnow().isoformat()
    })
    realtime_manager.broadcast_sync({
        "event": "CUSTOMER_UPDATED",
        "customer_id": customer_id,
        "balance": customer.current_balance,
        "timestamp": dt.utcnow().isoformat()
    })
    return entry

# Customer Loyalty Transactions (Video 09 & 13)
@router.get("/{customer_id}/loyalty", response_model=List[LoyaltyTransactionResponse])
def get_customer_loyalty(customer_id: str, db: Session = Depends(get_db)):
    customer = resolve_customer_by_id_or_string(customer_id, db)
    if not customer:
        return []
    return db.query(LoyaltyTransaction).filter(LoyaltyTransaction.customer_id == customer.id).order_by(LoyaltyTransaction.id.desc()).all()

@router.post("/{customer_id}/loyalty", response_model=LoyaltyTransactionResponse)
def add_customer_loyalty_transaction(customer_id: str, payload: dict, db: Session = Depends(get_db)):
    customer = resolve_customer_by_id_or_string(customer_id, db)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Row-lock customer to prevent points race conditions
    customer = db.query(Customer).filter(Customer.id == customer.id).with_for_update().first()
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
def get_customer_statement_pdf(customer_id: str, db: Session = Depends(get_db)):
    """
    Generate professional Customer Account Statement (Khata Ledger) PDF.
    """
    customer = resolve_customer_by_id_or_string(customer_id, db)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    ledger_entries = db.query(CustomerLedgerEntry).filter(
        CustomerLedgerEntry.customer_id == customer.id
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
def get_customer_receipt_pdf(customer_id: str, entry_id: int, db: Session = Depends(get_db)):
    """
    Generate professional Payment Receipt / Money Receipt PDF for Khata settlement.
    """
    customer = resolve_customer_by_id_or_string(customer_id, db)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    entry = db.query(CustomerLedgerEntry).filter(
        CustomerLedgerEntry.id == entry_id,
        CustomerLedgerEntry.customer_id == customer.id
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


# =====================================================================
# CUSTOMER CREDIT AGING DETAIL & PAYMENT REMINDER (STEP 5)
# =====================================================================

@router.get("/{customer_id}/credit-aging-detail", response_model=CustomerCreditAgingDetailResponse)
def get_customer_credit_aging_detail(customer_id: str, db: Session = Depends(get_db)):
    """
    Get detailed breakdown of unpaid invoices and aging buckets for a single customer.
    """
    customer = resolve_customer_by_id_or_string(customer_id, db)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    now = dt.now()
    unpaid_invoices = db.query(SaleInvoice).filter(
        SaleInvoice.customer_id == customer.id,
        SaleInvoice.balance_due > 0
    ).order_by(SaleInvoice.id.asc()).all()

    items: List[CustomerInvoiceAgingItem] = []
    oldest_days = 0

    for inv in unpaid_invoices:
        inv_dt = parse_date_safely(inv.date, inv.created_at or now)
        days = max(0, (now - inv_dt).days)
        if days > oldest_days:
            oldest_days = days

        if days <= 30:
            b_label = "0-30 Days (Current)"
        elif days <= 60:
            b_label = "31-60 Days (Notice)"
        elif days <= 90:
            b_label = "61-90 Days (Warning)"
        elif days <= 120:
            b_label = "91-120 Days (Severe)"
        else:
            b_label = ">120 Days (Critical)"

        items.append(CustomerInvoiceAgingItem(
            invoice_id=inv.id,
            invoice_no=inv.invoice_no,
            invoice_date=inv.date,
            days_overdue=days,
            grand_total=float(inv.grand_total or 0.0),
            paid_amount=float(inv.paid_amount or 0.0),
            balance_due=float(inv.balance_due or 0.0),
            bucket=b_label
        ))

    return CustomerCreditAgingDetailResponse(
        customer_id=customer.id,
        name=customer.name,
        code=customer.code,
        phone=customer.phone,
        credit_limit=float(customer.credit_limit or 50000.0),
        current_balance=float(customer.current_balance or 0.0),
        oldest_overdue_days=oldest_days,
        invoices=items
    )


@router.post("/{customer_id}/payment-reminder", response_model=PaymentReminderResponse)
def generate_customer_payment_reminder(customer_id: str, db: Session = Depends(get_db)):
    """
    Generate professional Godrej Interio payment reminder message with direct UPI & Bank details.
    """
    customer = resolve_customer_by_id_or_string(customer_id, db)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    now = dt.now()
    unpaid_invoices = db.query(SaleInvoice).filter(
        SaleInvoice.customer_id == customer.id,
        SaleInvoice.balance_due > 0
    ).order_by(SaleInvoice.id.asc()).all()

    total_due = float(customer.current_balance or 0.0)
    oldest_days = 0
    inv_details = []

    for inv in unpaid_invoices:
        inv_dt = parse_date_safely(inv.date, inv.created_at or now)
        days = max(0, (now - inv_dt).days)
        if days > oldest_days:
            oldest_days = days
        inv_details.append(f"• Inv #{inv.invoice_no} ({inv.date}): Due ₹{float(inv.balance_due):,.2f} ({days} days)")

    inv_text = "\n".join(inv_details) if inv_details else f"• Account Khata Balance: ₹{total_due:,.2f}"

    msg = (
        f"Dear {customer.name},\n\n"
        f"Greetings from *Shree Vinayaka Furnitures* (Authorized Godrej Interio Dealer).\n\n"
        f"This is a courteous reminder regarding your pending balance of *₹{total_due:,.2f}*.\n"
        f"Overdue Details:\n{inv_text}\n\n"
        f"Payment Details:\n"
        f"• Bank: State Bank of India (SBI)\n"
        f"• Account: 99999999999 (Current A/c)\n"
        f"• IFSC: SBIN0048291\n"
        f"• UPI ID: shreevinayakafurnitures@sbi\n\n"
        f"Kindly share your UTR / transaction receipt once paid. Thank you for your continued patronage!\n"
        f"- Shree Vinayaka Furnitures, Kozhikode (+91 98470 12345)"
    )

    clean_phone = "".join(filter(str.isdigit, customer.phone or ""))
    if len(clean_phone) == 10:
        clean_phone = "91" + clean_phone

    wa_url = f"https://wa.me/{clean_phone}?text={quote(msg)}"

    return PaymentReminderResponse(
        customer_id=customer.id,
        customer_name=customer.name,
        phone=customer.phone,
        total_due=total_due,
        oldest_overdue_days=oldest_days,
        message_text=msg,
        whatsapp_url=wa_url
    )


@router.delete("/{customer_id}/ledger/{entry_id}")
def delete_customer_ledger_entry(customer_id: str, entry_id: int, db: Session = Depends(get_db)):
    """
    Delete a customer ledger entry from PostgreSQL with automatic Khata balance rollback:
    Reverts the debit or credit to the customer balance, and purges any linked IncomeVoucher.
    """
    customer = resolve_customer_by_id_or_string(customer_id, db)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    entry = db.query(CustomerLedgerEntry).filter(
        CustomerLedgerEntry.id == entry_id,
        CustomerLedgerEntry.customer_id == customer.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Ledger entry not found")

    # Reverse balance impact
    credit_amt = float(entry.credit or 0.0)
    debit_amt = float(entry.debit or 0.0)
    voucher_no = entry.voucher_no

    if credit_amt > 0:
        # Revert payment receipt: add money back to customer due balance
        customer.current_balance = float(customer.current_balance or 0.0) + credit_amt
    elif debit_amt > 0:
        # Revert debit invoice: reduce customer due balance
        customer.current_balance = max(0.0, float(customer.current_balance or 0.0) - debit_amt)

    # Delete linked income vouchers or bank statement entries if it was a payment receipt
    if voucher_no:
        from app.models.accounting import IncomeVoucher, BankStatementEntry, BankAccountMaster
        stmts = db.query(BankStatementEntry).filter(BankStatementEntry.receipt_no == voucher_no).all()
        for s in stmts:
            if s.account_no:
                bank_acc = db.query(BankAccountMaster).filter(BankAccountMaster.account_no == s.account_no).with_for_update().first()
                if bank_acc:
                    # Receipt credited the bank, so deduct it back on receipt deletion
                    bank_acc.current_balance = max(0.0, float(bank_acc.current_balance or 0.0) - float(s.credit or 0.0))
            db.delete(s)
        db.query(IncomeVoucher).filter(IncomeVoucher.voucher_no == voucher_no).delete()

    db.delete(entry)
    db.commit()

    return {
        "status": "Success",
        "message": f"Ledger entry {entry_id} (Voucher {voucher_no}) deleted permanently. Customer balance reverted to ₹{float(customer.current_balance):,.2f}.",
        "updated_customer_balance": float(customer.current_balance)
    }


@router.delete("/ledger/by-voucher/{voucher_no}")
def delete_customer_ledger_by_voucher(voucher_no: str, db: Session = Depends(get_db)):
    """
    Delete customer ledger entries by voucher number and revert customer balance.
    """
    entries = db.query(CustomerLedgerEntry).filter(CustomerLedgerEntry.voucher_no == voucher_no).all()
    if not entries:
        raise HTTPException(status_code=404, detail=f"No ledger entries found with voucher {voucher_no}")

    reverted_customers = []
    from app.models.accounting import IncomeVoucher, BankStatementEntry, BankAccountMaster

    for entry in entries:
        cust = db.query(Customer).filter(Customer.id == entry.customer_id).first()
        if cust:
            credit_amt = float(entry.credit or 0.0)
            debit_amt = float(entry.debit or 0.0)
            if credit_amt > 0:
                cust.current_balance = float(cust.current_balance or 0.0) + credit_amt
            elif debit_amt > 0:
                cust.current_balance = max(0.0, float(cust.current_balance or 0.0) - debit_amt)
            reverted_customers.append({"id": cust.id, "name": cust.name, "balance": float(cust.current_balance)})
        db.delete(entry)

    # Clean up associated income vouchers or bank statements & reconcile bank account
    stmts = db.query(BankStatementEntry).filter(BankStatementEntry.receipt_no == voucher_no).all()
    for s in stmts:
        if s.account_no:
            bank_acc = db.query(BankAccountMaster).filter(BankAccountMaster.account_no == s.account_no).with_for_update().first()
            if bank_acc:
                bank_acc.current_balance = max(0.0, float(bank_acc.current_balance or 0.0) - float(s.credit or 0.0))
        db.delete(s)

    db.query(IncomeVoucher).filter(IncomeVoucher.voucher_no == voucher_no).delete()

    db.commit()
    return {
        "status": "Success",
        "message": f"Receipt voucher {voucher_no} deleted and balances rolled back in PostgreSQL.",
        "customers": reverted_customers
    }


@router.delete("/{customer_id}")
def delete_customer(customer_id: str, db: Session = Depends(get_db)):
    """
    Deactivate/delete a customer from PostgreSQL by ID, customer code (e.g. C-0001), phone, or name.
    """
    customer = resolve_customer_by_id_or_string(customer_id, db)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    customer.active = False
    db.commit()
    realtime_manager.broadcast_sync({
        "event": "CUSTOMER_UPDATED",
        "customer_id": customer.id,
        "action": "DELETED",
        "timestamp": dt.utcnow().isoformat()
    })
    return {
        "status": "Success",
        "message": f"Customer {customer.name} ({customer.code}) deactivated successfully in PostgreSQL.",
        "id": customer.id,
        "code": customer.code
    }


# ============================================================================
# PHASE 2 EXTENSIONS: QUICK-CREATE, BULK IMPORT & OUTSTANDING ANALYSIS
# ============================================================================

@router.post("/quick-create", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def quick_create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    """
    Rapid customer creation directly from POS drawer or receipt entry modal.
    """
    existing = db.query(Customer).filter(Customer.phone == payload.phone).first()
    if existing:
        return existing

    code = payload.code
    if not code or db.query(Customer).filter(Customer.code == code).first():
        import time, random
        code = f"C-{int(time.time() * 1000) % 100000:05d}"
        while db.query(Customer).filter(Customer.code == code).first():
            code = f"C-{random.randint(10000, 99999)}"

    new_cust = Customer(
        code=code,
        name=payload.name,
        phone=payload.phone,
        email=payload.email,
        address=payload.address,
        city=payload.city,
        state=payload.state or "Kerala",
        state_code=payload.state_code or "32",
        gstin=payload.gstin,
        credit_limit=payload.credit_limit or 50000.0,
        opening_balance=payload.opening_balance or 0.0,
        current_balance=payload.current_balance or payload.opening_balance or 0.0,
        loyalty_points=payload.loyalty_points or 0.0,
        active=True
    )
    try:
        db.add(new_cust)
        db.commit()
        db.refresh(new_cust)
        return new_cust
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error creating customer: {str(e)}")


@router.post("/bulk", status_code=status.HTTP_201_CREATED)
def bulk_import_customers(customers_list: List[dict], db: Session = Depends(get_db)):
    """
    Bulk import customers from Excel / CSV with deduplication against phone numbers.
    """
    created_count = 0
    updated_count = 0
    total_custs = db.query(Customer).count()

    try:
        for idx, item in enumerate(customers_list, 1):
            phone = str(item.get("phone") or item.get("contact") or "").strip()
            name = str(item.get("name") or "Valued Customer").strip()
            if not phone:
                continue

            existing = db.query(Customer).filter(Customer.phone == phone).first()
            if existing:
                if item.get("name"): existing.name = name
                if item.get("address"): existing.address = item["address"]
                if item.get("city"): existing.city = item["city"]
                if item.get("gstin"): existing.gstin = item["gstin"]
                updated_count += 1
            else:
                code = item.get("code") or f"C-{str(total_custs + created_count + 1).zfill(4)}"
                new_c = Customer(
                    code=code,
                    name=name,
                    phone=phone,
                    email=item.get("email"),
                    address=item.get("address"),
                    city=item.get("city"),
                    state=item.get("state", "Kerala"),
                    gstin=item.get("gstin"),
                    credit_limit=float(item.get("credit_limit") or 50000.0),
                    opening_balance=float(item.get("opening_balance") or 0.0),
                    current_balance=float(item.get("current_balance") or item.get("opening_balance") or 0.0),
                    loyalty_points=float(item.get("loyalty_points") or 0.0),
                    active=True
                )
                db.add(new_c)
                created_count += 1

        db.commit()
        return {
            "status": "success",
            "imported_count": created_count,
            "updated_count": updated_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to bulk import customers: {str(e)}")


@router.get("/outstanding-summary")
def get_customer_outstanding_summary(db: Session = Depends(get_db)):
    """
    Aggregate outstanding Khata balance and credit aging summary.
    """
    customers = db.query(Customer).filter(Customer.active == True, Customer.current_balance > 0).all()
    total_outstanding = sum(float(c.current_balance or 0.0) for c in customers)
    return {
        "total_receivables": round(total_outstanding, 2),
        "customers_with_dues_count": len(customers),
        "customers": [
            {
                "id": c.id,
                "code": c.code,
                "name": c.name,
                "phone": c.phone,
                "city": c.city,
                "current_balance": float(c.current_balance or 0.0),
                "credit_limit": float(c.credit_limit or 0.0)
            }
            for c in customers
        ]
    }


@router.get("/outstanding-report")
def get_customer_outstanding_report(
    min_balance: float = Query(0.0),
    city: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Detailed Outstanding Balance Report with route/city breakdown for collections.
    """
    query = db.query(Customer).filter(Customer.active == True, Customer.current_balance >= min_balance)
    if city:
        query = query.filter(Customer.city == city)

    customers = query.order_by(Customer.current_balance.desc()).all()
    tot = sum(float(c.current_balance or 0.0) for c in customers)

    return {
        "count": len(customers),
        "total_outstanding": round(tot, 2),
        "rows": [
            {
                "id": c.id,
                "code": c.code,
                "name": c.name,
                "phone": c.phone,
                "city": c.city or "Local",
                "balance": float(c.current_balance or 0.0),
                "credit_limit": float(c.credit_limit or 0.0),
                "over_limit": float(c.current_balance or 0.0) > float(c.credit_limit or 0.0)
            }
            for c in customers
        ]
    }

