from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.sale import SaleInvoice, SaleInvoiceItem, HeldCart, EstimateRecord, DeliveryNote, Quotation
from app.models.product import Product
from app.models.discounts import Coupon, GiftVoucher, EWayBill
from app.schemas.sale import (
    SaleInvoiceCreate, SaleInvoiceResponse,
    HeldCartCreate, HeldCartResponse,
    EstimateCreate, EstimateResponse,
    DeliveryNoteCreate, DeliveryNoteResponse,
    QuotationCreate, QuotationResponse
)
from app.schemas.discounts import (
    CouponCreate, CouponResponse,
    GiftVoucherCreate, GiftVoucherResponse,
    EWayBillCreate, EWayBillResponse
)

from app.models.customer import Customer, CustomerLedgerEntry

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
        return existing

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
                prod.current_stock = max(0.0, prod.current_stock - item_data.qty)

    # Automatically update Customer balance & Ledger if customer linked
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

    db.commit()
    db.refresh(db_invoice)
    return db_invoice


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
