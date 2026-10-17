from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter()

@router.get("/", response_model=List[ProductResponse])
def get_products(
    search: Optional[str] = Query(None, description="Search by name or barcode"),
    category_id: Optional[int] = Query(None),
    godown: Optional[str] = Query(None, description="Filter by Godown location"),
    include_costs: bool = Query(False, description="Include wholesale purchase price (Admin only)"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.is_active == True)
    if search:
        s = f"%{search}%"
        query = query.filter((Product.name.ilike(s)) | (Product.barcode.ilike(s)) | (Product.p_code.ilike(s)))
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if godown:
        query = query.filter(Product.godown.ilike(f"%{godown}%"))
    
    prods = query.offset(skip).limit(limit).all()
    if not include_costs:
        # Hide sensitive wholesale margins from unauthorized terminal DevTools
        for p in prods:
            p.purchase_price = 0.0
    return prods

@router.get("/barcode/{barcode}", response_model=ProductResponse)
def get_product_by_barcode(
    barcode: str,
    include_costs: bool = Query(False),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.barcode == barcode, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with barcode {barcode} not found")
    if not include_costs:
        product.purchase_price = 0.0
    return product

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    include_costs: bool = Query(False),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if not include_costs:
        product.purchase_price = 0.0
    return product

@router.post("/", response_model=ProductResponse)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    existing = db.query(Product).filter((Product.barcode == payload.barcode) | (Product.p_code == payload.p_code)).first()
    if existing:
        for k, v in payload.model_dump(exclude={"batches", "serials", "variants"}).items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
    
    product_data = payload.model_dump(exclude={"batches", "serials", "variants"})
    db_product = Product(**product_data)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

@router.post("/bulk-import")
def bulk_import_products(products_in: List[ProductCreate], db: Session = Depends(get_db)):
    created_count = 0
    updated_count = 0
    for payload in products_in:
        existing = db.query(Product).filter(
            (Product.barcode == payload.barcode) | (Product.p_code == payload.p_code)
        ).first()
        if existing:
            update_data = payload.model_dump(exclude={"batches", "serials", "variants"}, exclude_unset=True)
            for key, value in update_data.items():
                setattr(existing, key, value)
            updated_count += 1
        else:
            product_data = payload.model_dump(exclude={"batches", "serials", "variants"})
            db_product = Product(**product_data)
            db.add(db_product)
            created_count += 1
    db.commit()
    return {"message": "Bulk import completed", "created": created_count, "updated": updated_count}

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    db_product.is_active = False
    db.commit()
    return {"message": "Product deactivated successfully", "id": product_id}


@router.get("/alerts/low-stock", response_model=List[ProductResponse])
def get_low_stock_products(
    threshold: Optional[float] = Query(None, description="Custom stock threshold override"),
    db: Session = Depends(get_db)
):
    """
    Fetch all furniture items whose current godown inventory has dropped below the minimum re-order point.
    """
    query = db.query(Product).filter(Product.is_active == True)
    if threshold is not None:
        query = query.filter(Product.current_stock <= threshold)
    else:
        query = query.filter(Product.current_stock <= Product.min_stock)
    
    prods = query.order_by(Product.current_stock.asc()).all()
    # Mask purchase price for general alert queries
    for p in prods:
        p.purchase_price = 0.0
    return prods


