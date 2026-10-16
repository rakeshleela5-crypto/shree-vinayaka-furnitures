from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.user import User, UserControlPermission, Salesman
from app.schemas.user import (
    UserLoginRequest, UserCreate, UserResponse,
    UserControlPermissionUpdate, UserControlPermissionResponse,
    SalesmanCreate, SalesmanResponse
)

router = APIRouter()

@router.post("/login", response_model=UserResponse)
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username, User.active == True).first()
    if not user or user.password_hash != payload.password: # Plaintext or hash check
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return user

@router.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@router.post("/users", response_model=UserResponse)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
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
        raise HTTPException(status_code=400, detail="Salesman code already exists")
    sm = Salesman(**payload.model_dump())
    db.add(sm)
    db.commit()
    db.refresh(sm)
    return sm
