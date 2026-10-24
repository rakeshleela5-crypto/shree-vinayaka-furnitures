from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryOut

router = APIRouter()

@router.get("/", response_model=List[CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).order_by(Category.name.asc()).all()
    return categories

@router.get("/{slug}", response_model=CategoryOut)
def get_category_by_slug(slug: str, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.slug == slug).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with slug '{slug}' not found"
        )
    return category

@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(category_in: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(Category).filter(Category.slug == category_in.slug).first()
    if existing:
        return existing
    category = Category(**category_in.dict())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.delete("/{id_or_slug}")
def delete_category(id_or_slug: str, db: Session = Depends(get_db)):
    cat = None
    if id_or_slug.isdigit():
        cat = db.query(Category).filter(Category.id == int(id_or_slug)).first()
    if not cat:
        cat = db.query(Category).filter(Category.slug == id_or_slug).first()
    if not cat:
        cat = db.query(Category).filter(Category.name.ilike(id_or_slug)).first()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category '{id_or_slug}' not found"
        )
    cat_name = cat.name
    db.delete(cat)
    db.commit()
    return {"status": "SUCCESS", "message": f"Category '{cat_name}' deleted successfully"}
