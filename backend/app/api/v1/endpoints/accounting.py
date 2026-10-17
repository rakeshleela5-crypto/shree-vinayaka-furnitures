from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime as dt
from app.core.database import get_db
from app.models.accounting import AccountHead, ExpenseVoucher, IncomeVoucher, BankStatementEntry, ShiftSettlement
from app.models.sale import SaleInvoice
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


