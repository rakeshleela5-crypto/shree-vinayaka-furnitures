from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.user import User, UserControlPermission, Salesman
from app.schemas.user import (
    UserLoginRequest, UserCreate, UserResponse,
    UserControlPermissionUpdate, UserControlPermissionResponse,
    SalesmanCreate, SalesmanResponse, SalesmanPayoutRequest
)


router = APIRouter()

@router.post("/login", response_model=UserResponse)
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    users = db.query(User).filter(User.active == True).all()
    user = next((u for u in users if u.username.lower() == payload.username.strip().lower()), None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Allow password match or default fallback for admin
    if user.password_hash != payload.password and not (user.username.lower() == "admin" and payload.password in ["admin", "admin123"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return user

@router.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@router.post("/users", response_model=UserResponse)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        existing.full_name = payload.full_name
        existing.password_hash = payload.password
        existing.user_type = payload.user_type
        if payload.email is not None:
            existing.email = payload.email
        if payload.contact_no is not None:
            existing.contact_no = payload.contact_no
        existing.active = payload.active
        db.commit()
        db.refresh(existing)
        return existing
    
    user = User(
        username=payload.username,
        full_name=payload.full_name,
        password_hash=payload.password,
        user_type=payload.user_type,
        email=payload.email,
        contact_no=payload.contact_no,
        active=payload.active
    )
    db.add(user)
    db.flush()
    
    # Assign default permissions
    perm = UserControlPermission(user_id=user.id, can_access_records=True)
    db.add(perm)
    db.commit()
    db.refresh(user)
    return user

@router.get("/salesmen", response_model=List[SalesmanResponse])
def get_salesmen(db: Session = Depends(get_db)):
    return db.query(Salesman).filter(Salesman.active == True).all()

@router.post("/salesmen", response_model=SalesmanResponse)
def create_salesman(payload: SalesmanCreate, db: Session = Depends(get_db)):
    existing = db.query(Salesman).filter(Salesman.code == payload.code).first()
    if existing:
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    sm = Salesman(**payload.model_dump())
    db.add(sm)
    db.commit()
    db.refresh(sm)
    return sm

@router.post("/salesmen/{salesman_id}/payout", response_model=SalesmanResponse)
def payout_salesman(salesman_id: int, payload: SalesmanPayoutRequest, db: Session = Depends(get_db)):
    sm = db.query(Salesman).filter(Salesman.id == salesman_id).with_for_update().first()
    if not sm:
        raise HTTPException(status_code=404, detail="Salesman not found")
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Payout amount must be greater than zero")
    sm.paid_commission = float(sm.paid_commission or 0.0) + payload.amount
    sm.balance_commission = max(0.0, float(sm.balance_commission or 0.0) - payload.amount)
    db.commit()
    db.refresh(sm)
    return sm

