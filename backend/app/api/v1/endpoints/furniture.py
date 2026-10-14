from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.models.furniture import Furniture
from app.models.category import Category
from app.schemas.furniture import FurnitureCreate, FurnitureUpdate, FurnitureOut

router = APIRouter()

@router.get("/", response_model=List[FurnitureOut])
def list_furniture(
    category_slug: Optional[str] = Query(None, description="Filter by category slug"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    is_featured: Optional[bool] = Query(None, description="Filter featured items"),
    in_stock: Optional[bool] = Query(None, description="Filter items in stock"),
    search: Optional[str] = Query(None, description="Search by title, material, or description"),
    min_price: Optional[float] = Query(None, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, description="Maximum price filter"),
    sort_by: Optional[str] = Query(None, description="Sort: 'price_asc', 'price_desc', 'rating', 'newest'"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Furniture)

    if category_slug:
        query = query.join(Category).filter(Category.slug == category_slug)
    elif category_id:
        query = query.filter(Furniture.category_id == category_id)

    if is_featured is not None:
        query = query.filter(Furniture.is_featured == is_featured)

    if in_stock is not None:
        query = query.filter(Furniture.in_stock == in_stock)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Furniture.title.ilike(search_pattern),
                Furniture.material.ilike(search_pattern),
                Furniture.description.ilike(search_pattern)
            )
        )

    if min_price is not None:
        query = query.filter(Furniture.price >= min_price)
    if max_price is not None:
        query = query.filter(Furniture.price <= max_price)

    # Sorting
    if sort_by == "price_asc":
        query = query.order_by(Furniture.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Furniture.price.desc())
    elif sort_by == "rating":
        query = query.order_by(Furniture.rating.desc())
    else:
        # Default newest first
        query = query.order_by(Furniture.id.desc())

    items = query.offset(skip).limit(limit).all()
    return items

@router.get("/{id_or_slug}", response_model=FurnitureOut)
def get_furniture_item(id_or_slug: str, db: Session = Depends(get_db)):
    if id_or_slug.isdigit():
        item = db.query(Furniture).filter(Furniture.id == int(id_or_slug)).first()
    else:
        item = db.query(Furniture).filter(Furniture.slug == id_or_slug).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Furniture item '{id_or_slug}' not found"
        )
    return item

@router.post("/", response_model=FurnitureOut, status_code=status.HTTP_201_CREATED)
def create_furniture_item(item_in: FurnitureCreate, db: Session = Depends(get_db)):
    existing = db.query(Furniture).filter(Furniture.slug == item_in.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item with this slug already exists"
        )
    item = Furniture(**item_in.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{id}", response_model=FurnitureOut)
def update_furniture_item(id: int, item_in: FurnitureUpdate, db: Session = Depends(get_db)):
    item = db.query(Furniture).filter(Furniture.id == id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    update_data = item_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(item, field, val)

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_furniture_item(id: int, db: Session = Depends(get_db)):
    item = db.query(Furniture).filter(Furniture.id == id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    db.delete(item)
    db.commit()
    return None
