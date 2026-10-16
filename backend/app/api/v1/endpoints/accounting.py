from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.accounting import AccountHead, ExpenseVoucher, IncomeVoucher, BankStatementEntry
from app.schemas.accounting import (
    AccountHeadCreate, AccountHeadResponse,
    ExpenseVoucherCreate, ExpenseVoucherResponse,
    IncomeVoucherCreate, IncomeVoucherResponse,
    BankStatementEntryCreate, BankStatementEntryResponse
)

router = APIRouter()

@router.get("/account-heads", response_model=List[AccountHeadResponse])
def get_account_heads(db: Session = Depends(get_db)):
    return db.query(AccountHead).filter(AccountHead.active == True).all()

@router.post("/account-heads", response_model=AccountHeadResponse)
def create_account_head(payload: AccountHeadCreate, db: Session = Depends(get_db)):
    existing = db.query(AccountHead).filter(AccountHead.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account head already exists")
    head = AccountHead(**payload.model_dump())
    db.add(head)
    db.commit()
    db.refresh(head)
    return head

@router.get("/expense-vouchers", response_model=List[ExpenseVoucherResponse])
def get_expense_vouchers(db: Session = Depends(get_db)):
    return db.query(ExpenseVoucher).order_by(ExpenseVoucher.id.desc()).all()

@router.post("/expense-vouchers", response_model=ExpenseVoucherResponse)
def create_expense_voucher(payload: ExpenseVoucherCreate, db: Session = Depends(get_db)):
    ev = ExpenseVoucher(**payload.model_dump())
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev

@router.get("/income-vouchers", response_model=List[IncomeVoucherResponse])
def get_income_vouchers(db: Session = Depends(get_db)):
    return db.query(IncomeVoucher).order_by(IncomeVoucher.id.desc()).all()

@router.post("/income-vouchers", response_model=IncomeVoucherResponse)
def create_income_voucher(payload: IncomeVoucherCreate, db: Session = Depends(get_db)):
    iv = IncomeVoucher(**payload.model_dump())
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
