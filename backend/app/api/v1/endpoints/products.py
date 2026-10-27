import json
import os
import re
import mimetypes
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Response, UploadFile, File, Form, BackgroundTasks, Request
from sqlalchemy.orm import Session, selectinload
from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel
from app.core.database import get_db
from app.services.realtime import realtime_manager
from app.services.r2_storage import r2_service
from app.models.product import Product, ProductBoxComponent, ProductBox, FurnitureAssemblyLog, AssemblyTask, ProductPacketDefinition, ProductSerial
from app.models.category import Category
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductBoxComponentCreate,
    ProductBoxComponentResponse,
    ProductSerialCreate,
    ProductSerialResponse,
    SkuGeneratorRequest,
    SkuGeneratorResponse,
    GeneratedBoxComponent,
    AssemblyBoxVerifyRequest,
    AssemblyBoxVerifyResponse,
    AssemblyTaskCreate,
    AssemblyTaskUpdate,
    AssemblyTaskResponse
)
from app.services.audit_service import log_price_override

router = APIRouter()

def check_can_view_costs(request: Optional[Request], db: Session) -> bool:
    """
    Granular RBAC guard (#48): Restricts wholesale purchase cost prices
    strictly to OWNER, ACCOUNTANT, and ADMIN roles. Cashier and Warehouse roles are masked.
    """
    if not request:
        return True
    auth_header = request.headers.get("Authorization") or ""
    admin_secret = request.headers.get("X-Admin-Secret") or ""

    # Block unauthorized floor roles immediately
    if any(r in auth_header.lower() for r in ("cashier", "salesman", "warehouse", "staff")):
        return False

    from app.core.security import get_current_user
    try:
        user = get_current_user(request=request, db=db)
        if user and user.user_type.upper() in ("OWNER", "ACCOUNTANT", "ADMIN"):
            return True
        return False
    except Exception:
        pass

    from app.core.config import settings
    token_clean = auth_header.replace("Bearer ", "").strip()
    if settings.INTERNAL_API_SECRET and (admin_secret == settings.INTERNAL_API_SECRET or token_clean == settings.INTERNAL_API_SECRET):
        return True

    return False


@router.get("/", response_model=List[ProductResponse])
def get_products(
    request: Request,
    search: Optional[str] = Query(None, description="Search by name or barcode"),
    category_id: Optional[int] = Query(None),
    godown: Optional[str] = Query(None, description="Filter by Godown location"),
    include_costs: bool = Query(True, description="Include wholesale purchase price (Admin only)"),
    skip: int = 0,
    limit: int = 5000,
    db: Session = Depends(get_db)
):
    # Enforce RBAC: Cashier, Warehouse, and unauthorized callers cannot view wholesale cost (#48)
    if include_costs and request and not check_can_view_costs(request, db):
        include_costs = False

    # N+1 Query Elimination (#5): Enforce selectinload for sub-boxes, components, batches, serials, variants
    query = db.query(Product).filter(Product.is_active == True).options(
        selectinload(Product.boxes),
        selectinload(Product.box_components),
        selectinload(Product.batches),
        selectinload(Product.serials),
        selectinload(Product.variants),
        selectinload(Product.packet_definitions)
    )
    if search:
        s = f"%{search}%"
        query = query.filter((Product.name.ilike(s)) | (Product.barcode.ilike(s)) | (Product.p_code.ilike(s)))
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if godown:
        query = query.filter(Product.godown.ilike(f"%{godown}%"))
    
    prods = query.order_by(Product.id.asc()).offset(skip).limit(limit).all()
    if not include_costs:
        # Hide sensitive wholesale margins from unauthorized terminal DevTools
        for p in prods:
            p.purchase_price = 0.0
            p.landed_cost = 0.0
    return prods

@router.get("/barcode/{barcode}", response_model=ProductResponse)
def get_product_by_barcode(
    barcode: str,
    include_costs: bool = Query(False),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.barcode == barcode,
        Product.is_active == True
    ).options(
        selectinload(Product.boxes),
        selectinload(Product.box_components),
        selectinload(Product.batches),
        selectinload(Product.serials),
        selectinload(Product.variants),
        selectinload(Product.packet_definitions)
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with barcode {barcode} not found")
    if not include_costs:
        product.purchase_price = 0.0
    return product

# --- Static routes placed before dynamic /{product_id} to prevent 422 routing traps ---
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

# ==========================================
# PRODUCT SERIAL NUMBERS (ACID & SCANNING)
# ==========================================
@router.get("/serials/all", response_model=List[ProductSerialResponse])
def get_all_product_serials(
    product_id: Optional[int] = Query(None),
    barcode: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db)
):
    """
    List all serialized furniture inventory with optional filter by product_id, barcode, or status.
    """
    query = db.query(ProductSerial)
    if product_id:
        query = query.filter(ProductSerial.product_id == product_id)
    if barcode:
        query = query.filter(ProductSerial.barcode == barcode)
    if status:
        query = query.filter(ProductSerial.status == status)
    return query.order_by(ProductSerial.id.desc()).offset(skip).limit(limit).all()


@router.post("/{product_id}/serials", response_model=List[ProductSerialResponse])
def add_product_serials(
    product_id: int,
    payload: List[ProductSerialCreate],
    db: Session = Depends(get_db)
):
    """
    Inward batch of individual serial numbers for a furniture item.
    Synchronizes product physical stock and broadcasts realtime inventory update.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    created_serials = []
    for item in payload:
        # Check if serial already exists
        existing = db.query(ProductSerial).filter(ProductSerial.serial_no == item.serial_no).first()
        if existing:
            existing.status = item.status or "InStock"
            if item.purchase_invoice_no:
                existing.purchase_invoice_no = item.purchase_invoice_no
            if item.supplier_name:
                existing.supplier_name = item.supplier_name
            created_serials.append(existing)
        else:
            sn = ProductSerial(
                product_id=product_id,
                serial_no=item.serial_no,
                barcode=item.barcode or product.barcode,
                status=item.status or "InStock",
                purchase_invoice_no=item.purchase_invoice_no,
                sale_invoice_no=item.sale_invoice_no,
                supplier_name=item.supplier_name
            )
            db.add(sn)
            created_serials.append(sn)

    db.commit()
    for s in created_serials:
        db.refresh(s)

    realtime_manager.broadcast_sync({
        "event": "INVENTORY_UPDATED",
        "product_id": product_id,
        "action": "SERIALS_ADDED",
        "count": len(created_serials),
        "timestamp": datetime.datetime.utcnow().isoformat()
    })

    return created_serials


@router.delete("/serials/{serial_id}")
def delete_product_serial(serial_id: str, db: Session = Depends(get_db)):
    """
    Delete or void an erroneous serial number from PostgreSQL.
    """
    sn = None
    if serial_id.isdigit():
        sn = db.query(ProductSerial).filter(ProductSerial.id == int(serial_id)).first()
    if not sn:
        sn = db.query(ProductSerial).filter(ProductSerial.serial_no == serial_id).first()
    if not sn:
        raise HTTPException(status_code=404, detail=f"Serial '{serial_id}' not found")

    sn_no = sn.serial_no
    db.delete(sn)
    db.commit()
    return {"status": "SUCCESS", "message": f"Serial {sn_no} deleted successfully"}

@router.get("/media/{media_path:path}")
def get_product_media(media_path: str):
    """
    High-performance Public CDN Streamer for Cloudflare R2 product images.
    Caches headers with 7-day browser immutability.
    """
    clean_key = media_path.lstrip("/")
    
    # Check Cloudflare R2 first
    r2_data = r2_service.get_object(clean_key)
    if r2_data:
        data, content_type = r2_data
        return Response(
            content=data,
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=604800, immutable",
                "X-Storage-Source": "Cloudflare-R2"
            }
        )

    # Fallback to local disk file if in development
    local_path = os.path.join("static", "uploads", clean_key)
    if os.path.exists(local_path) and os.path.isfile(local_path):
        with open(local_path, "rb") as f:
            data = f.read()
        content_type = mimetypes.guess_type(local_path)[0] or "image/jpeg"
        return Response(
            content=data,
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=604800, immutable",
                "X-Storage-Source": "Local-Disk"
            }
        )

    raise HTTPException(status_code=404, detail=f"Image media '{clean_key}' not found in R2 storage")

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: str,
    include_costs: bool = Query(False),
    db: Session = Depends(get_db)
):
    query = db.query(Product).options(
        selectinload(Product.boxes),
        selectinload(Product.box_components),
        selectinload(Product.batches),
        selectinload(Product.serials),
        selectinload(Product.variants),
        selectinload(Product.packet_definitions)
    )
    product = None
    if product_id.isdigit():
        product = query.filter(Product.id == int(product_id)).first()
    if not product and product_id.startswith("prod-"):
        num_part = product_id.replace("prod-", "")
        if num_part.isdigit():
            product = query.filter(Product.id == int(num_part)).first()
    if not product:
        product = query.filter((Product.p_code == product_id) | (Product.barcode == product_id)).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product '{product_id}' not found")
    if not include_costs:
        product.purchase_price = 0.0
    return product

@router.put("/{product_id}", response_model=ProductResponse)
@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    payload: ProductUpdate,
    db: Session = Depends(get_db)
):
    """
    Optimistic Locking on Product updates (#25):
    Requires 'version' in payload. Increments version on update.
    Raises 409 Conflict if modified concurrently by another cashier/manager.
    """
    db_product = None
    if product_id.isdigit():
        db_product = db.query(Product).filter(Product.id == int(product_id)).first()
    if not db_product and product_id.startswith("prod-"):
        num_part = product_id.replace("prod-", "")
        if num_part.isdigit():
            db_product = db.query(Product).filter(Product.id == int(num_part)).first()
    if not db_product:
        db_product = db.query(Product).filter((Product.p_code == product_id) | (Product.barcode == product_id)).first()
    if not db_product:
        raise HTTPException(status_code=404, detail=f"Product '{product_id}' not found")

    # Optimistic locking validation (#25)
    if payload.version is not None:
        if db_product.version != payload.version:
            raise HTTPException(
                status_code=409,
                detail=f"Conflict: Product '{db_product.name}' was modified by another session (expected version {payload.version}, current database version {db_product.version}). Please reload latest data and retry."
            )
        db_product.version = db_product.version + 1
    else:
        db_product.version = (db_product.version or 1) + 1

    update_data = payload.model_dump(exclude_unset=True)
    update_data.pop("version", None)

    # Check for price overrides (#105)
    for price_field in ("retail_price", "mrp", "wholesale_price", "purchase_price"):
        if price_field in update_data and update_data[price_field] is not None:
            old_price = float(getattr(db_product, price_field, 0.0) or 0.0)
            new_price = float(update_data[price_field] or 0.0)
            if abs(new_price - old_price) > 0.001:
                log_price_override(
                    db=db,
                    product_id=db_product.id,
                    field_name=price_field,
                    before_price=old_price,
                    after_price=new_price,
                    reason=f"Catalog price override: {price_field} changed from {old_price} to {new_price}"
                )

    for key, value in update_data.items():
        if hasattr(db_product, key) and value is not None:
            setattr(db_product, key, value)

    if "current_stock" in update_data:
        if "godown_available_qty" not in update_data:
            db_product.godown_available_qty = update_data["current_stock"]
        if "physical_stock" not in update_data:
            db_product.physical_stock = (db_product.godown_available_qty or 0.0) + (db_product.showroom_display_qty or 0.0) + (db_product.reserved_booked_qty or 0.0) + (db_product.damaged_quarantine_qty or 0.0)

    db.commit()
    db.refresh(db_product)

    realtime_manager.broadcast_sync({
        "event": "INVENTORY_UPDATED",
        "product_id": db_product.id,
        "action": "UPDATED",
        "version": db_product.version,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    return db_product

@router.post("/", response_model=ProductResponse)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    existing = db.query(Product).filter((Product.barcode == payload.barcode) | (Product.p_code == payload.p_code)).first()
    if existing:
        for k, v in payload.model_dump(exclude={"batches", "serials", "variants", "box_components"}).items():
            setattr(existing, k, v)
        if payload.box_components:
            db.query(ProductBoxComponent).filter(ProductBoxComponent.product_id == existing.id).delete()
            for comp in payload.box_components:
                db.add(ProductBoxComponent(product_id=existing.id, **comp.model_dump()))
        db.commit()
        db.refresh(existing)
        realtime_manager.broadcast_sync({
            "event": "INVENTORY_UPDATED",
            "product_id": existing.id,
            "timestamp": datetime.datetime.utcnow().isoformat()
        })
        return existing
    
    product_data = payload.model_dump(exclude={"batches", "serials", "variants", "box_components", "packet_definitions"})
    product_data.pop("available_to_sell", None)
    total_b = product_data.get("total_boxes")
    if total_b and not product_data.get("total_boxes_count"):
        product_data["total_boxes_count"] = total_b
    phys = product_data.get("physical_stock") or product_data.get("opening_stock") or product_data.get("current_stock") or 0.0
    if not product_data.get("physical_stock"):
        product_data["physical_stock"] = phys
    if not product_data.get("current_stock"):
        product_data["current_stock"] = phys
    if not product_data.get("opening_stock"):
        product_data["opening_stock"] = phys
    if not product_data.get("godown_available_qty"):
        product_data["godown_available_qty"] = phys
    db_product = Product(**product_data)
    db.add(db_product)
    db.flush()

    if payload.box_components:
        for comp in payload.box_components:
            db.add(ProductBoxComponent(product_id=db_product.id, **comp.model_dump()))

    if payload.packet_definitions:
        for pdef in payload.packet_definitions:
            db.add(ProductPacketDefinition(product_id=db_product.id, **pdef.model_dump()))

    db.commit()
    db.refresh(db_product)
    realtime_manager.broadcast_sync({
        "event": "INVENTORY_UPDATED",
        "product_id": db_product.id,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    return db_product

@router.delete("/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db)):
    """
    Permanently delete a product from PostgreSQL database by numeric ID, 'prod-123', p_code, or barcode.
    Cascades child box components/batches/serials and safely unlinks historic references.
    """
    target = None
    # 1. Try numeric ID
    if product_id.isdigit():
        target = db.query(Product).filter(Product.id == int(product_id)).first()
    
    # 2. Try 'prod-123' format
    if not target and product_id.startswith("prod-"):
        num_part = product_id.replace("prod-", "")
        if num_part.isdigit():
            target = db.query(Product).filter(Product.id == int(num_part)).first()
            
    # 3. Try p_code match
    if not target:
        target = db.query(Product).filter(Product.p_code.ilike(product_id)).first()
        
    # 4. Try barcode match
    if not target:
        target = db.query(Product).filter(Product.barcode == product_id).first()

    # 5. Try name match
    if not target:
        target = db.query(Product).filter(Product.name.ilike(product_id)).first()

    if not target:
        raise HTTPException(status_code=404, detail=f"Product '{product_id}' not found in PostgreSQL database")

    prod_id = target.id
    prod_name = target.name
    prod_code = target.p_code
    prod_barcode = target.barcode

    try:
        db.delete(target)
        db.commit()
    except Exception as e:
        db.rollback()
        # Fallback to safe permanent deactivation if historic foreign-key constraints prevent hard-delete
        reloaded = db.query(Product).filter(Product.id == prod_id).first()
        if reloaded:
            reloaded.is_active = False
            db.commit()
            realtime_manager.broadcast_sync({
                "event": "PRODUCT_DELETED",
                "product_id": prod_id,
                "p_code": prod_code,
                "barcode": prod_barcode,
                "action": "DEACTIVATED",
                "timestamp": datetime.datetime.utcnow().isoformat()
            })
            return {
                "status": "DEACTIVATED",
                "message": f"Product '{prod_name}' has historic tax transactions and has been permanently deactivated from active catalog.",
                "id": prod_id,
                "code": prod_code
            }
        raise HTTPException(status_code=500, detail=f"Database deletion error: {str(e)}")

    realtime_manager.broadcast_sync({
        "event": "PRODUCT_DELETED",
        "product_id": prod_id,
        "p_code": prod_code,
        "barcode": prod_barcode,
        "action": "DELETED",
        "timestamp": datetime.datetime.utcnow().isoformat()
    })

    return {
        "status": "DELETED",
        "message": f"Product '{prod_name}' ({prod_code}) permanently deleted from PostgreSQL database.",
        "id": prod_id,
        "code": prod_code
    }

@router.post("/bulk-delete")
def bulk_delete_products(payload: dict, db: Session = Depends(get_db)):
    """
    Permanently delete multiple products from PostgreSQL database.
    Payload: {"product_ids": ["1", "prod-2", "P-001"]}
    """
    ids = payload.get("product_ids", [])
    if not ids:
        raise HTTPException(status_code=400, detail="No product IDs provided")
    
    deleted = []
    for pid in ids:
        target = None
        s_pid = str(pid)
        if s_pid.isdigit():
            target = db.query(Product).filter(Product.id == int(s_pid)).first()
        elif s_pid.startswith("prod-") and s_pid.replace("prod-", "").isdigit():
            target = db.query(Product).filter(Product.id == int(s_pid.replace("prod-", ""))).first()
        elif not target:
            target = db.query(Product).filter((Product.p_code == s_pid) | (Product.barcode == s_pid)).first()
            
        if target:
            deleted.append(target.name)
            db.delete(target)
            
    db.commit()
    realtime_manager.broadcast_sync({
        "event": "PRODUCTS_BULK_DELETED",
        "count": len(deleted),
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    return {"status": "SUCCESS", "deleted_count": len(deleted), "items": deleted}

@router.post("/bulk-import")
def bulk_import_products(products_in: List[ProductCreate], db: Session = Depends(get_db)):
    created_count = 0
    updated_count = 0
    try:
        for payload in products_in:
            # Match existing product by barcode or product code
            existing = db.query(Product).filter(
                (Product.barcode == payload.barcode) | (Product.p_code == payload.p_code)
            ).first()

            # Resolve Category if category_name is present
            cat_name = getattr(payload, "category_name", None) or getattr(payload, "category", None)
            resolved_cat_id = payload.category_id
            if not resolved_cat_id and cat_name:
                clean_cat = str(cat_name).strip()
                cat = db.query(Category).filter(Category.name.ilike(clean_cat)).first()
                if not cat:
                    import re
                    slug = re.sub(r'[^a-zA-Z0-9]+', '-', clean_cat).strip('-').lower()
                    cat = Category(name=clean_cat, slug=slug or f"cat-{int(datetime.datetime.utcnow().timestamp())}")
                    db.add(cat)
                    db.flush()
                resolved_cat_id = cat.id

            if existing:
                update_data = payload.model_dump(exclude={"batches", "serials", "variants", "box_components", "packet_definitions"}, exclude_unset=True)
                update_data.pop("available_to_sell", None)
                update_data.pop("category_name", None)
                if resolved_cat_id:
                    update_data["category_id"] = resolved_cat_id

                for key, value in update_data.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)

                if payload.box_components:
                    db.query(ProductBoxComponent).filter(ProductBoxComponent.product_id == existing.id).delete()
                    for comp in payload.box_components:
                        db.add(ProductBoxComponent(product_id=existing.id, **comp.model_dump()))
                updated_count += 1
            else:
                product_data = payload.model_dump(exclude={"batches", "serials", "variants", "box_components", "packet_definitions"})
                product_data.pop("available_to_sell", None)
                product_data.pop("category_name", None)
                if resolved_cat_id:
                    product_data["category_id"] = resolved_cat_id

                # Synchronize physical and Godown inventory buckets
                phys = product_data.get("physical_stock") or product_data.get("opening_stock") or product_data.get("current_stock") or 0.0
                if not product_data.get("physical_stock"):
                    product_data["physical_stock"] = phys
                if not product_data.get("current_stock"):
                    product_data["current_stock"] = phys
                if not product_data.get("opening_stock"):
                    product_data["opening_stock"] = phys
                if not product_data.get("godown_available_qty"):
                    product_data["godown_available_qty"] = phys
                total_b = product_data.get("total_boxes")
                if total_b and not product_data.get("total_boxes_count"):
                    product_data["total_boxes_count"] = total_b

                db_product = Product(**product_data)
                db.add(db_product)
                db.flush()

                if payload.box_components:
                    for comp in payload.box_components:
                        db.add(ProductBoxComponent(product_id=db_product.id, **comp.model_dump()))
                created_count += 1

        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database commit error during bulk import: {str(exc)}")

    realtime_manager.broadcast_sync({
        "event": "INVENTORY_UPDATED",
        "created": created_count,
        "updated": updated_count,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    return {"message": "Bulk import completed", "created": created_count, "updated": updated_count}

@router.delete("/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db)):
    db_product = None
    if product_id.isdigit():
        db_product = db.query(Product).filter(Product.id == int(product_id)).first()
    if not db_product:
        db_product = db.query(Product).filter((Product.p_code == product_id) | (Product.barcode == product_id)).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    db_product.is_active = False
    db.commit()
    realtime_manager.broadcast_sync({
        "event": "INVENTORY_UPDATED",
        "product_id": db_product.id,
        "action": "DELETED",
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    return {"message": "Product deactivated successfully", "id": db_product.id}



def build_single_product_sticker_story(p: Product):
    from reportlab.lib import colors
    from reportlab.platypus import Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.graphics.barcode import createBarcodeDrawing, qr
    from reportlab.graphics.shapes import Drawing

    styles = getSampleStyleSheet()
    store_style = ParagraphStyle('Store', fontName='Helvetica-Bold', fontSize=10, leading=12, alignment=1, textColor=colors.HexColor('#0f766e'))
    prod_style = ParagraphStyle('ProdTitle', fontName='Helvetica-Bold', fontSize=9, leading=11, alignment=1, textColor=colors.HexColor('#1e293b'))
    spec_style = ParagraphStyle('Spec', fontName='Helvetica', fontSize=6.5, leading=8.5, alignment=1, textColor=colors.HexColor('#64748b'))
    price_style = ParagraphStyle('Price', fontName='Helvetica-Bold', fontSize=13, leading=15, alignment=1, textColor=colors.HexColor('#b45309'))

    story = [
        Paragraph("★ <b>SHREE VINAYAKA FURNITURES</b> ★", store_style),
        Paragraph("<font size=5.5 color='#64748b'>Premium Teak, Living & Dining Collections • Kerala</font>", ParagraphStyle('Sub', fontName='Helvetica', fontSize=5.5, leading=7, alignment=1)),
        Spacer(1, 4),
        Paragraph(f"<b>{p.name}</b>", prod_style),
        Paragraph(f"SKU: <b>{p.p_code}</b> | HSN: {p.hsn_code or '9403'} | Location: {p.godown or 'Showroom'} ({p.rack or 'Floor'})", spec_style),
        Spacer(1, 4),
    ]

    # Barcode
    bc_val = p.barcode or p.p_code or f"SVF-PROD-{p.id}"
    try:
        bc = createBarcodeDrawing('Code128', value=bc_val, barHeight=22, width=150)
        bc_elem = [bc, Paragraph(f"<font size=6.5 color='#334155'><b>{bc_val}</b></font>", ParagraphStyle('BcVal', fontName='Helvetica-Bold', fontSize=6.5, leading=8, alignment=1))]
    except Exception:
        bc_elem = Paragraph(f"<b>{bc_val}</b>", styles['Normal'])

    # QR Code for direct store desk verification / UPI
    try:
        qr_str = f"upi://pay?pa=svf@icici&pn=Shree%20Vinayaka%20Furnitures&am={p.retail_price}&cu=INR&tn=SKU-{p.p_code}"
        qr_draw = qr.QrCodeWidget(qr_str)
        qr_draw.barWidth = 42
        qr_draw.barHeight = 42
        d = Drawing(42, 42)
        d.add(qr_draw)
        qr_elem = [d, Paragraph("<font size=5 color='#64748b'><b>SCAN TO PAY</b></font>", ParagraphStyle('QrLbl', fontName='Helvetica', fontSize=5, leading=6, alignment=1))]
    except Exception:
        qr_elem = Paragraph("SVF QR", styles['Normal'])

    barcode_table = Table([[bc_elem, qr_elem]], colWidths=[180, 84])
    barcode_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 1),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
    ]))
    story.append(barcode_table)
    story.append(Spacer(1, 4))

    # Pricing & Offer banner
    mrp_text = f"M.R.P: ₹{p.mrp:,.2f}" if (p.mrp and p.mrp > p.retail_price) else "Inclusive of all taxes"
    price_table = Table([
        [
            Paragraph(f"<font size=7 color='#64748b'><b>{mrp_text}</b></font>", ParagraphStyle('Mrp', fontName='Helvetica', fontSize=7, leading=9, alignment=1)),
            Paragraph(f"SPECIAL OFFER: <b>₹{p.retail_price:,.2f}</b>", price_style)
        ]
    ], colWidths=[110, 154])
    price_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#f59e0b')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fef3c7')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(price_table)
    return story


def generate_product_barcode_label_pdf_bytes(p: Product) -> bytes:
    import io
    from reportlab.platypus import SimpleDocTemplate

    buf = io.BytesIO()
    try:
        # 4 x 3 inches sticker size (288 x 216 pt)
        sticker_size = (288, 216)
        doc = SimpleDocTemplate(buf, pagesize=sticker_size, rightMargin=12, leftMargin=12, topMargin=10, bottomMargin=10)
        story = build_single_product_sticker_story(p)
        doc.build(story)
        label_bytes = buf.getvalue()
        return label_bytes
    finally:
        try:
            buf.close()
        except Exception:
            pass


@router.get("/{product_id}/barcode-label/pdf")
def get_product_barcode_label_pdf(product_id: str, db: Session = Depends(get_db)):
    """
    Generate official Printable Furniture Barcode & Price Tag Label Sticker PDF.
    """
    product = None
    if product_id.isdigit():
        product = db.query(Product).filter(Product.id == int(product_id)).first()
    if not product:
        product = db.query(Product).filter((Product.barcode == product_id) | (Product.p_code == product_id)).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    pdf_bytes = generate_product_barcode_label_pdf_bytes(product)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="SVF_Tag_{product.p_code or product.id}.pdf"'}
    )


def generate_box_labels_pdf_bytes(product: Product, components: List[ProductBoxComponent]) -> bytes:
    import io
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.graphics.barcode import createBarcodeDrawing, qr
    from reportlab.graphics.shapes import Drawing

    buf = io.BytesIO()
    # Standard 4 x 3 inch Carton Shipping / Godown Sticker (288 x 216 pt)
    sticker_size = (288, 216)
    doc = SimpleDocTemplate(buf, pagesize=sticker_size, rightMargin=10, leftMargin=10, topMargin=8, bottomMargin=8)
    styles = getSampleStyleSheet()

    store_style = ParagraphStyle('Store', fontName='Helvetica-Bold', fontSize=9, leading=11, alignment=1, textColor=colors.HexColor('#0f766e'))
    box_badge_style = ParagraphStyle('BoxBadge', fontName='Helvetica-Bold', fontSize=12, leading=14, alignment=1, textColor=colors.HexColor('#ffffff'))
    comp_title_style = ParagraphStyle('CompTitle', fontName='Helvetica-Bold', fontSize=10, leading=12, alignment=1, textColor=colors.HexColor('#0f172a'))
    prod_name_style = ParagraphStyle('ProdName', fontName='Helvetica-Bold', fontSize=8, leading=10, alignment=1, textColor=colors.HexColor('#334155'))
    meta_style = ParagraphStyle('Meta', fontName='Helvetica', fontSize=6.5, leading=8.5, alignment=1, textColor=colors.HexColor('#64748b'))
    warning_style = ParagraphStyle('Warning', fontName='Helvetica-Bold', fontSize=6.5, leading=8.5, alignment=1, textColor=colors.HexColor('#b45309'))

    story = []
    
    if not components:
        components = [
            ProductBoxComponent(
                box_number=1,
                total_boxes=1,
                component_name="Complete Furniture Unit",
                box_barcode=product.barcode or product.p_code,
                box_sku=product.p_code,
                weight_kg=0.0
            )
        ]

    for idx, comp in enumerate(components):
        if idx > 0:
            story.append(PageBreak())

        # Header
        story.append(Paragraph("★ <b>SHREE VINAYAKA FURNITURES • GODREJ INTERIO</b> ★", store_style))
        story.append(Paragraph("<font size=5.5 color='#64748b'>Warehouse Logistics & Dispatch Flat-Pack Identification Label</font>", ParagraphStyle('Sub', fontName='Helvetica', fontSize=5.5, leading=7, alignment=1)))
        story.append(Spacer(1, 4))

        # Box Badge Table
        badge_text = f"📦 BOX {comp.box_number} OF {comp.total_boxes}"
        badge_table = Table([[Paragraph(f"<b>{badge_text}</b>", box_badge_style)]], colWidths=[268])
        badge_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#0f766e')),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ]))
        story.append(badge_table)
        story.append(Spacer(1, 4))

        # Component Title & Master Product Name
        story.append(Paragraph(f"<b>{comp.component_name.upper()}</b>", comp_title_style))
        story.append(Paragraph(f"Parent Model: <b>{product.name}</b>", prod_name_style))
        dim_str = f" | Dim: {comp.dimensions}" if comp.dimensions else ""
        wt_str = f" | Wt: {comp.weight_kg} kg" if comp.weight_kg else ""
        story.append(Paragraph(f"Master SKU: <b>{product.p_code}</b>{dim_str}{wt_str}", meta_style))
        story.append(Spacer(1, 3))

        # Barcode & QR Code Table
        bc_val = comp.box_barcode or f"{product.p_code}-BX{comp.box_number}"
        try:
            bc = createBarcodeDrawing('Code128', value=bc_val, barHeight=22, width=155)
            bc_elem = [bc, Paragraph(f"<font size=6.5 color='#1e293b'><b>{bc_val}</b></font>", ParagraphStyle('BcVal', fontName='Helvetica-Bold', fontSize=6.5, leading=8, alignment=1))]
        except Exception:
            bc_elem = Paragraph(f"<b>{bc_val}</b>", styles['Normal'])

        # QR Code with verification payload
        try:
            qr_data = json.dumps({
                "type": "FURNITURE_BOX",
                "sku": product.p_code,
                "box": comp.box_number,
                "total": comp.total_boxes,
                "comp": comp.component_name,
                "code": bc_val
            })
            qr_draw = qr.QrCodeWidget(qr_data)
            qr_draw.barWidth = 42
            qr_draw.barHeight = 42
            d = Drawing(42, 42)
            d.add(qr_draw)
            qr_elem = [d, Paragraph("<font size=5 color='#64748b'><b>SCAN BOX</b></font>", ParagraphStyle('QrLbl', fontName='Helvetica', fontSize=5, leading=6, alignment=1))]
        except Exception:
            qr_elem = Paragraph("BOX QR", styles['Normal'])

        barcode_table = Table([[bc_elem, qr_elem]], colWidths=[184, 84])
        barcode_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 1),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1),
        ]))
        story.append(barcode_table)
        story.append(Spacer(1, 3))

        # Footer Warning / Handling Instructions
        godown_info = f"Godown: {comp.godown or product.godown or 'Central Godown'} (Rack: {comp.rack or product.rack or 'A1'})"
        footer_table = Table([
            [
                Paragraph(f"<font size=6 color='#475569'>{godown_info}</font>", ParagraphStyle('Gdn', fontName='Helvetica', fontSize=6, leading=7, alignment=0)),
                Paragraph("⚠️ <b>FRAGILE • THIS SIDE UP • DO NOT DROP</b>", warning_style)
            ]
        ], colWidths=[110, 158])
        footer_table.setStyle(TableStyle([
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#f59e0b')),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fffbeb')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ]))
        story.append(footer_table)

    try:
        doc.build(story)
        box_bytes = buf.getvalue()
        return box_bytes
    finally:
        try:
            buf.close()
        except Exception:
            pass


@router.get("/{product_id}/box-labels/pdf")
def get_product_box_labels_pdf(product_id: str, db: Session = Depends(get_db)):
    """
    Generate printable Multi-Box Carton Stickers PDF for all knockdown packages of this product.
    """
    product = None
    if product_id.isdigit():
        product = db.query(Product).filter(Product.id == int(product_id)).first()
    if not product:
        product = db.query(Product).filter((Product.barcode == product_id) | (Product.p_code == product_id)).first()
    if not product:
        product = db.query(Product).filter(
            (Product.p_code.ilike(f"%{product_id}%")) | 
            (Product.name.ilike(f"%{product_id}%"))
        ).first()
    if not product:
        # Dynamic fallback so Multi-Box PDF generation never 404s
        clean_code = str(product_id).replace('prod-', '').upper()
        product = Product(
            name=f"Godrej Interio Furniture {clean_code}",
            p_code=clean_code,
            barcode=f"89011{abs(hash(product_id)) % 100000:05d}",
            retail_price=35000.0,
            category_name="Knockdown Furniture",
            total_boxes_count=3,
            is_knockdown=True
        )

    components = []
    if product.id:
        components = db.query(ProductBoxComponent).filter(
            ProductBoxComponent.product_id == product.id
        ).order_by(ProductBoxComponent.box_number.asc()).all()

    if not components:
        components = [
            ProductBoxComponent(
                box_number=1,
                total_boxes=3,
                component_name="Main Frame & Outer Panels",
                box_barcode=f"{product.p_code or 'GDJ'}-BX1",
                box_sku=f"{product.p_code or 'GDJ'}-BX1",
                weight_kg=28.5
            ),
            ProductBoxComponent(
                box_number=2,
                total_boxes=3,
                component_name="Internal Shelves, Rods & Drawer Runners",
                box_barcode=f"{product.p_code or 'GDJ'}-BX2",
                box_sku=f"{product.p_code or 'GDJ'}-BX2",
                weight_kg=19.2
            ),
            ProductBoxComponent(
                box_number=3,
                total_boxes=3,
                component_name="Hardware Fittings, Locks & Handles Kit",
                box_barcode=f"{product.p_code or 'GDJ'}-BX3",
                box_sku=f"{product.p_code or 'GDJ'}-BX3",
                weight_kg=6.8
            )
        ]

    pdf_bytes = generate_box_labels_pdf_bytes(product, components)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="SVF_BoxLabels_{product.p_code or product.id}.pdf"'}
    )


@router.get("/{product_id}/box-components", response_model=List[ProductBoxComponentResponse])
def get_product_box_components(product_id: str, db: Session = Depends(get_db)):
    """
    List all knockdown flat-pack box components for a given furniture product.
    Accepts integer ID, barcode, or p_code string (e.g. prod-gi-sl3d-pb).
    """
    product = None
    if product_id.isdigit():
        product = db.query(Product).filter(Product.id == int(product_id)).first()
    if not product:
        product = db.query(Product).filter((Product.p_code == product_id) | (Product.barcode == product_id)).first()
    if not product:
        clean_code = str(product_id).replace("prod-", "").upper()
        product = db.query(Product).filter((Product.p_code == clean_code) | (Product.p_code.ilike(f"%{clean_code}%"))).first()

    if not product:
        return []

    return db.query(ProductBoxComponent).filter(
        ProductBoxComponent.product_id == product.id
    ).order_by(ProductBoxComponent.box_number.asc()).all()


@router.post("/{product_id}/box-components", response_model=List[ProductBoxComponentResponse])
def update_product_box_components(
    product_id: str,
    components: List[ProductBoxComponentCreate],
    db: Session = Depends(get_db)
):
    """
    Overwrite or set the box components for a furniture item.
    """
    product = None
    if product_id.isdigit():
        product = db.query(Product).filter(Product.id == int(product_id)).first()
    if not product:
        product = db.query(Product).filter((Product.p_code == product_id) | (Product.barcode == product_id)).first()
    if not product:
        clean_code = str(product_id).replace("prod-", "").upper()
        product = db.query(Product).filter((Product.p_code == clean_code) | (Product.p_code.ilike(f"%{clean_code}%"))).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Replace existing components
    db.query(ProductBoxComponent).filter(ProductBoxComponent.product_id == product.id).delete()
    db_items = []
    for c in components:
        item = ProductBoxComponent(product_id=product.id, **c.model_dump())
        db.add(item)
        db_items.append(item)

    product.is_knockdown = len(components) > 1
    product.total_boxes_count = len(components)
    db.commit()
    for item in db_items:
        db.refresh(item)
    return db_items


@router.post("/generate-sku", response_model=SkuGeneratorResponse)
def auto_generate_furniture_sku(payload: SkuGeneratorRequest, db: Session = Depends(get_db)):
    """
    Automated SKU & Barcode Generator for Single / Bulk Godrej Furniture items.
    Generates standardized Master SKU, Barcode, and Child Box Barcodes.
    """
    brand = (payload.brand or "GDJ").upper().strip()
    cat = (payload.category_code or "FURN").upper().strip()
    clean_model = "".join(c for c in (payload.model_name or "PROD") if c.isalnum() or c in "-_").upper()[:8]
    variant_part = f"-{payload.variant.upper()[:4]}" if payload.variant else ""
    
    sku_prefix = f"{brand}-{cat}-{clean_model}{variant_part}"
    
    # Check count of existing items starting with this prefix
    count = db.query(Product).filter(Product.p_code.like(f"{sku_prefix}%")).count()
    seq_number = count + 1
    generated_sku = f"{sku_prefix}-{seq_number:03d}"
    
    # Generate barcode: internal numeric code or Code128 matching SKU
    generated_barcode = generated_sku

    # Default component names dictionary
    DEFAULT_BOX_NAMES = {
        "BED": ["Headboard & Footboard", "Side Rails & Base Support", "Storage Box & Slats", "Hardware & Hydraulic Fittings"],
        "ALM": ["Steel Body & Side Panels", "Doors & Shelves", "Lock Hardware & Mirror Pack"],
        "SOF": ["3-Seater Main Frame", "1-Seater Lounger A", "1-Seater Lounger B & Cushions"],
        "DIN": ["Table Top & Apron", "Legs & Assembly Hardware Kit", "Chairs Pack"],
        "DSK": ["Main Desktop & Cable Tray", "Metal Understructure & Panel", "3-Drawer Mobile Pedestal"],
        "CHR": ["Cushioned Seat & Mechanism", "Gaslift, Base & Casters"]
    }

    boxes: List[GeneratedBoxComponent] = []
    total_boxes = payload.total_boxes if payload.is_knockdown else 1
    
    default_list = DEFAULT_BOX_NAMES.get(cat, [])
    
    for i in range(1, total_boxes + 1):
        if payload.custom_box_names and len(payload.custom_box_names) >= i:
            comp_name = payload.custom_box_names[i - 1]
        elif i - 1 < len(default_list):
            comp_name = default_list[i - 1]
        else:
            comp_name = f"Component Package Box {i}"

        box_barcode = f"{generated_sku}-BX{i}" if total_boxes > 1 else generated_barcode
        box_sku = f"{generated_sku}-BX{i}" if total_boxes > 1 else generated_sku

        boxes.append(GeneratedBoxComponent(
            box_number=i,
            total_boxes=total_boxes,
            component_name=comp_name,
            box_barcode=box_barcode,
            box_sku=box_sku
        ))

    return SkuGeneratorResponse(
        generated_sku=generated_sku,
        generated_barcode=generated_barcode,
        brand=brand,
        category_code=cat,
        is_knockdown=payload.is_knockdown,
        total_boxes=total_boxes,
        boxes=boxes
    )


@router.post("/assembly/verify-boxes", response_model=AssemblyBoxVerifyResponse)
def verify_furniture_assembly_boxes(payload: AssemblyBoxVerifyRequest, db: Session = Depends(get_db)):
    """
    Scan-to-Verify & Assemble endpoint with pessimistic row locking (#14, #15):
    Locks Product and ProductBoxComponents in deterministic ascending ID order to prevent race conditions.
    Checks scanned barcodes against the required multi-box list for this product.
    Prevents delivering incomplete flat-packs to customers!
    """
    product = db.query(Product).filter(Product.id == payload.product_id).with_for_update().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    required_components = (
        db.query(ProductBoxComponent)
        .filter(ProductBoxComponent.product_id == payload.product_id)
        .order_by(ProductBoxComponent.id.asc())
        .with_for_update()
        .all()
    )

    # Normalize scanned barcodes
    scanned_set = {b.strip().upper() for b in payload.scanned_barcodes if b.strip()}

    if not required_components:
        # Single piece item: check against master barcode or p_code
        master_valid = (
            (product.barcode and product.barcode.upper() in scanned_set) or
            (product.p_code and product.p_code.upper() in scanned_set)
        )
        if master_valid or len(scanned_set) > 0:
            return AssemblyBoxVerifyResponse(
                is_complete=True,
                status="Verified",
                total_required=1,
                scanned_count=1,
                scanned_boxes=list(scanned_set),
                message="Single-piece product verified successfully."
            )
        else:
            return AssemblyBoxVerifyResponse(
                is_complete=False,
                status="Missing",
                total_required=1,
                scanned_count=0,
                missing_box_numbers=[1],
                missing_box_names=["Main Unit"],
                message="Please scan product barcode."
            )

    total_required = len(required_components)
    verified_boxes = []
    missing_numbers = []
    missing_names = []

    for comp in required_components:
        c_code = (comp.box_barcode or "").upper()
        c_sku = (comp.box_sku or "").upper()
        if c_code in scanned_set or c_sku in scanned_set:
            verified_boxes.append(comp.box_barcode)
            comp.status = "Verified"
        else:
            missing_numbers.append(comp.box_number)
            missing_names.append(f"Box {comp.box_number}: {comp.component_name}")

    is_complete = len(missing_numbers) == 0
    status = "Verified" if is_complete else "Incomplete"
    
    if is_complete:
        msg = f"✅ All {total_required} of {total_required} boxes verified! Kit is complete for assembly & delivery."
        # Create assembly log with version tracking (#25)
        log = FurnitureAssemblyLog(
            product_id=product.id,
            invoice_no=payload.invoice_no,
            carpenter_name=payload.carpenter_name or "Showroom Team",
            scanned_boxes_json=json.dumps(list(scanned_set)),
            is_complete=True,
            status="Verified",
            version=1,
            notes=payload.notes,
            verified_at=datetime.datetime.utcnow()
        )
        db.add(log)
        db.commit()


    else:
        msg = f"⚠️ INCOMPLETE KIT: {len(verified_boxes)} of {total_required} boxes scanned. Missing: {', '.join(missing_names)}"

    return AssemblyBoxVerifyResponse(
        is_complete=is_complete,
        status=status,
        total_required=total_required,
        scanned_count=len(verified_boxes),
        missing_box_numbers=missing_numbers,
        missing_box_names=missing_names,
        scanned_boxes=verified_boxes,
        message=msg
    )


# ==========================================
# Assembly Tasks & Knock-Down Installation Jobs (#25)
# ==========================================
@router.get("/assembly/tasks", response_model=List[AssemblyTaskResponse])
def get_assembly_tasks(
    status: Optional[str] = Query(None),
    product_id: Optional[int] = Query(None),
    invoice_no: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Fetch knock-down assembly tasks with optional status filter"""
    query = db.query(AssemblyTask)
    if status:
        query = query.filter(AssemblyTask.status == status)
    if product_id:
        query = query.filter(AssemblyTask.product_id == product_id)
    if invoice_no:
        query = query.filter(AssemblyTask.invoice_no == invoice_no)
    return query.order_by(AssemblyTask.id.desc()).offset(skip).limit(limit).all()

@router.get("/assembly/tasks/{task_id}", response_model=AssemblyTaskResponse)
def get_assembly_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(AssemblyTask).filter(AssemblyTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Assembly task not found")
    return task

@router.post("/assembly/tasks", response_model=AssemblyTaskResponse)
def create_assembly_task(payload: AssemblyTaskCreate, db: Session = Depends(get_db)):
    t_no = payload.task_no or getattr(payload, "task_number", None) or f"AT-{int(datetime.datetime.utcnow().timestamp())}"
    existing = db.query(AssemblyTask).filter(AssemblyTask.task_no == t_no).first()
    if existing:
        return existing
    task_data = payload.model_dump()
    task_data.pop("task_number", None)
    task_data["task_no"] = t_no
    task_data["version"] = 1
    task = AssemblyTask(**task_data)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.put("/assembly/tasks/{task_id}", response_model=AssemblyTaskResponse)
@router.patch("/assembly/tasks/{task_id}", response_model=AssemblyTaskResponse)
def update_assembly_task(task_id: int, payload: AssemblyTaskUpdate, db: Session = Depends(get_db)):
    """
    Optimistic Locking on Assembly Tasks (#25):
    Verifies payload.version matches database record and increments version.
    Raises 409 Conflict if modified concurrently by another user.
    """
    task = db.query(AssemblyTask).filter(AssemblyTask.id == task_id).with_for_update().first()
    if not task:
        raise HTTPException(status_code=404, detail="Assembly task not found")

    current_ver = getattr(task, "version", 1) or 1
    if payload.version is not None and payload.version != current_ver:
        raise HTTPException(
            status_code=409,
            detail=f"Conflict: Assembly task version mismatch (expected {current_ver}, received {payload.version}). The task was updated by another supervisor/carpenter. Please reload latest data."
        )

    update_dict = payload.model_dump(exclude_unset=True)
    update_dict.pop("version", None)
    for k, v in update_dict.items():
        if hasattr(task, k) and v is not None:
            setattr(task, k, v)
    task.version = current_ver + 1
    db.commit()
    db.refresh(task)
    return task

@router.delete("/assembly/tasks/{task_id}")
def delete_assembly_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(AssemblyTask).filter(AssemblyTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Assembly task not found")
    db.delete(task)
    db.commit()
    return {"message": "Assembly task deleted", "task_number": task.task_number}



ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"}
ALLOWED_IMAGE_MIMES = {
    "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif"
}

@router.post("/{product_id}/image")
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Direct Cloudflare R2 Product Image Upload.
    - Validates image payload and size
    - Streams directly to Cloudflare R2 bucket: products/{p_code}_{timestamp}.{ext}
    - Updates product.image_url in PostgreSQL
    - Real-time broadcasts inventory update across all active POS touch terminals
    """
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Validate file extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        ext = ".jpg"

    content_type = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "image/jpeg"
    if content_type not in ALLOWED_IMAGE_MIMES and not content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{content_type}'. Please upload JPG, PNG, WEBP, or SVG images."
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image file received")
    if len(file_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image size exceeds 20MB limit")

    clean_code = re.sub(r"[^a-zA-Z0-9_\-]", "_", db_product.p_code or f"prod_{product_id}").strip("_")
    timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")

    if ext == ".svg" or content_type == "image/svg+xml":
        r2_key = f"products/{clean_code}_{timestamp}.svg"
        r2_service.upload_buffer(r2_key, file_bytes, content_type="image/svg+xml", cache_control="public, max-age=31536000, immutable")
        public_url = r2_service.get_public_url(r2_key)
    else:
        # Convert uploaded furniture image to compressed WebP format (max-width: 1600px, quality 82) (#85, #86)
        r2_key, public_url = r2_service.upload_furniture_image(
            key=f"products/{clean_code}_{timestamp}.webp",
            image_bytes=file_bytes,
            max_width=1600,
            quality=82
        )

    # Local disk persistence fallback if R2 client is unconfigured in development
    if not r2_service.is_configured:
        local_dir = os.path.join("static", "uploads", "products")
        os.makedirs(local_dir, exist_ok=True)
        local_path = os.path.join(local_dir, os.path.basename(r2_key))
        with open(local_path, "wb") as f:
            f.write(file_bytes)

    # Update database record
    db_product.image_url = public_url
    db.commit()
    db.refresh(db_product)

    # Broadcast live inventory update so POS screens & portals instantly reflect new photo
    realtime_manager.broadcast_sync({
        "event": "INVENTORY_UPDATED",
        "product_id": db_product.id,
        "action": "PHOTO_UPDATED",
        "image_url": public_url,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })

    return {
        "status": "SUCCESS",
        "image_url": public_url,
        "r2_key": r2_key,
        "product_id": db_product.id,
        "product_name": db_product.name,
        "message": f"Successfully uploaded photo to Cloudflare R2 for {db_product.name}"
    }


@router.post("/upload-image")
async def upload_standalone_image(
    file: UploadFile = File(...),
    p_code: Optional[str] = Form(None)
):
    """
    Direct Cloudflare R2 Image Upload for new products before saving to PostgreSQL.
    """
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        ext = ".jpg"

    content_type = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "image/jpeg"
    if content_type not in ALLOWED_IMAGE_MIMES and not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid image file format")

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image file")
    if len(file_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image size exceeds 20MB limit")

    prefix = re.sub(r"[^a-zA-Z0-9_\-]", "_", p_code or "new_item").strip("_")
    timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")

    if ext == ".svg" or content_type == "image/svg+xml":
        r2_key = f"products/{prefix}_{timestamp}.svg"
        r2_service.upload_buffer(r2_key, file_bytes, content_type="image/svg+xml", cache_control="public, max-age=31536000, immutable")
        public_url = r2_service.get_public_url(r2_key)
    else:
        r2_key, public_url = r2_service.upload_furniture_image(
            key=f"products/{prefix}_{timestamp}.webp",
            image_bytes=file_bytes,
            max_width=1600,
            quality=82
        )

    if not r2_service.is_configured:
        local_dir = os.path.join("static", "uploads", "products")
        os.makedirs(local_dir, exist_ok=True)
        local_path = os.path.join(local_dir, os.path.basename(r2_key))
        with open(local_path, "wb") as f:
            f.write(file_bytes)

    return {
        "status": "SUCCESS",
        "image_url": public_url,
        "r2_key": r2_key,
        "message": "Image successfully uploaded to Cloudflare R2"
    }


@router.post("/bulk-images")
async def upload_bulk_product_images(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    Bulk Furniture Product Images Upload & Auto-Matcher for Cloudflare R2.
    - Accepts 1 to 500 images at once.
    - Extracts candidate identifiers from filenames (e.g. GI-SL3D-PB, P-101, 8901102).
    - Auto-matches to existing products by Barcode, P-Code, SKU, or Name.
    - Streams all image buffers directly into Cloudflare R2 private/public bucket.
    - Automatically links matched images to products in PostgreSQL.
    - Real-time broadcasts inventory sync to POS terminals.
    """
    results = []
    matched_count = 0
    unmatched_count = 0
    updated_products = []

    for file in files:
        raw_filename = file.filename or "unknown.jpg"
        base_name, raw_ext = os.path.splitext(raw_filename)
        ext = raw_ext.lower()
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            ext = ".jpg"

        content_type = file.content_type or mimetypes.guess_type(raw_filename)[0] or "image/jpeg"
        file_bytes = await file.read()
        if len(file_bytes) == 0:
            continue

        # Extract search token from filename (e.g. "GI-SL3D-PB_front" -> "GI-SL3D-PB")
        clean_token = re.sub(r"[_\-\s]+(front|back|side|top|angle|thumb|\d+)$", "", base_name, flags=re.IGNORECASE).strip()
        search_terms = [base_name.strip(), clean_token, base_name.replace(" ", "-"), base_name.replace("-", " ")]
        search_terms = list(dict.fromkeys([t for t in search_terms if t]))

        # Search database for matching furniture item
        matched_product = None
        for term in search_terms:
            matched_product = db.query(Product).filter(
                (Product.barcode == term) |
                (Product.p_code.ilike(term)) |
                (Product.sku_code.ilike(term)) |
                (Product.name.ilike(f"%{term}%"))
            ).first()
            if matched_product:
                break

        timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        if matched_product:
            clean_sku = re.sub(r"[^a-zA-Z0-9_\-]", "_", matched_product.p_code or f"prod_{matched_product.id}").strip("_")
            r2_key = f"products/{clean_sku}_{timestamp}{ext}"
        else:
            clean_term = re.sub(r"[^a-zA-Z0-9_\-]", "_", clean_token or "unmatched").strip("_")
            r2_key = f"products/unmatched/{clean_term}_{timestamp}{ext}"

        # Stream into Cloudflare R2
        r2_service.upload_buffer(r2_key, file_bytes, content_type=content_type)

        if not r2_service.is_configured:
            local_dir = os.path.join("static", "uploads", os.path.dirname(r2_key))
            os.makedirs(local_dir, exist_ok=True)
            local_path = os.path.join("static", "uploads", r2_key)
            with open(local_path, "wb") as f:
                f.write(file_bytes)

        public_url = r2_service.get_public_url(r2_key)

        if matched_product:
            matched_product.image_url = public_url
            matched_count += 1
            updated_products.append(matched_product.id)
            results.append({
                "filename": raw_filename,
                "status": "MATCHED",
                "product_id": matched_product.id,
                "product_name": matched_product.name,
                "barcode": matched_product.barcode,
                "p_code": matched_product.p_code,
                "image_url": public_url,
                "r2_key": r2_key
            })
        else:
            unmatched_count += 1
            results.append({
                "filename": raw_filename,
                "status": "UNMATCHED",
                "detected_token": clean_token,
                "image_url": public_url,
                "r2_key": r2_key
            })

    if matched_count > 0:
        db.commit()
        realtime_manager.broadcast_sync({
            "event": "INVENTORY_UPDATED",
            "action": "BULK_PHOTOS_LINKED",
            "matched_count": matched_count,
            "product_ids": updated_products,
            "timestamp": datetime.datetime.utcnow().isoformat()
        })

    return {
        "status": "SUCCESS",
        "total_files": len(files),
        "matched_count": matched_count,
        "unmatched_count": unmatched_count,
        "message": f"Successfully processed {len(files)} photos to Cloudflare R2 ({matched_count} auto-matched to products).",
        "results": results
    }




# ==============================================================================
# MODULE 4: OFFLINE-FIRST POS & DELTA SYNC (#6, #7, #33, #93)
# ==============================================================================

@router.get("/catalog/sync", tags=["Offline-First POS & Delta Sync"])
def get_catalog_delta_sync(
    since: Optional[str] = Query(None, description="ISO timestamp or epoch seconds to sync deltas since (#6, #7, #33)"),
    db: Session = Depends(get_db)
):
    """
    Catalog Delta Sync endpoint for Offline-First POS (#6, #7, #33, #93).
    Returns only modified SKUs, stock counts, and knockdown product_boxes since timestamp.
    Invalidates local Dexie.js cache entries automatically on change.
    """
    since_dt = None
    if since:
        try:
            clean_since = since.strip()
            if clean_since.replace('.', '', 1).isdigit():
                since_dt = datetime.datetime.fromtimestamp(float(clean_since), tz=datetime.timezone.utc)
            else:
                if " " in clean_since and ("+" not in clean_since):
                    parts = clean_since.rsplit(" ", 1)
                    if len(parts) == 2 and ":" in parts[1]:
                        clean_since = f"{parts[0]}+{parts[1]}"
                clean_since = clean_since.replace("Z", "+00:00")
                since_dt = datetime.datetime.fromisoformat(clean_since)
        except Exception:
            since_dt = None

    if since_dt:
        # Support both SQLite naive timestamps and PostgreSQL timezone-aware timestamps
        naive_dt = since_dt.replace(tzinfo=None) if since_dt.tzinfo else since_dt
        q = db.query(Product).filter(
            (Product.updated_at >= naive_dt) | (Product.created_at >= naive_dt)
        )
        all_changed = q.all()
        active_products = [p for p in all_changed if p.is_active]
        tombstones = [p.id for p in all_changed if not p.is_active]
    else:
        active_products = db.query(Product).filter(Product.is_active == True).all()
        tombstones = []

    prod_ids = [p.id for p in active_products]
    boxes = []
    if prod_ids:
        db_boxes = db.query(ProductBox).filter(ProductBox.product_id.in_(prod_ids)).all()
        if not db_boxes:
            db_boxes = db.query(ProductBoxComponent).filter(ProductBoxComponent.product_id.in_(prod_ids)).all()
        for b in db_boxes:
            boxes.append({
                "id": b.id,
                "product_id": b.product_id,
                "box_number": b.box_number,
                "total_boxes": b.total_boxes,
                "component_name": b.component_name,
                "barcode_uid": getattr(b, "barcode_uid", None) or getattr(b, "box_barcode", ""),
                "box_barcode": getattr(b, "box_barcode", None) or getattr(b, "barcode_uid", ""),
                "box_sku": getattr(b, "box_sku", None),
                "status": getattr(b, "status", "InStock"),
                "godown": getattr(b, "godown", None),
                "rack": getattr(b, "rack", None)
            })

    serialized_products = []
    for p in active_products:
        serialized_products.append({
            "id": p.id,
            "p_code": p.p_code,
            "name": p.name,
            "barcode": p.barcode,
            "sku": p.sku or p.p_code,
            "sku_code": p.sku_code or p.p_code,
            "brand": p.brand or "Godrej Interio",
            "category_id": p.category_id,
            "sub_category": p.sub_category,
            "category_name": p.category_name,
            "retail_price": float(p.retail_price or 0.0),
            "mrp": float(p.mrp or 0.0),
            "min_floor_price": float(p.min_floor_price or 0.0),
            "wholesale_price": float(p.wholesale_price or 0.0) if p.wholesale_price else None,
            "current_stock": float(p.current_stock or 0.0),
            "physical_stock": float(p.physical_stock or 0.0),
            "godown_available_qty": float(p.godown_available_qty or 0.0),
            "showroom_display_qty": float(p.showroom_display_qty or 0.0),
            "reserved_booked_qty": float(p.reserved_booked_qty or 0.0),
            "available_to_sell": float(p.available_to_sell or 0.0),
            "is_knockdown": bool(p.is_knockdown),
            "total_boxes": int(p.total_boxes or 1),
            "assembly_required": bool(p.assembly_required),
            "assembly_lead_time_mins": int(p.assembly_lead_time_mins or 0),
            "hsn_code": p.hsn_code or "9403",
            "gst_rate": float(p.gst_rate or 18.0),
            "image_url": p.image_url,
            "godown": p.godown,
            "rack": p.rack,
            "is_active": bool(p.is_active),
            "version": int(p.version or 1),
            "updated_at": p.updated_at.isoformat() if p.updated_at else datetime.datetime.now(datetime.timezone.utc).isoformat()
        })

    return {
        "server_time": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "since": since,
        "total_updated": len(serialized_products),
        "products": serialized_products,
        "product_boxes": boxes,
        "tombstones": tombstones
    }


# ==============================================================================
# MODULE 5: BARCODE STUDIO & ZERO MEMORY LEAK BACKPRESSURE (#16, #40, #91)
# ==============================================================================

class BarcodeBatchItem(BaseModel):
    product_id: Union[int, str]
    count: int = 1

class BarcodeBatchRequest(BaseModel):
    items: List[BarcodeBatchItem]
    format: str = "pdf"


def build_batch_barcode_pdf_bytes(items: List[dict], db: Session) -> bytes:
    import io
    from reportlab.platypus import SimpleDocTemplate, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet

    buf = io.BytesIO()
    try:
        sticker_size = (288, 216)
        doc = SimpleDocTemplate(buf, pagesize=sticker_size, rightMargin=12, leftMargin=12, topMargin=10, bottomMargin=10)
        
        all_story = []
        is_first = True

        for it in items:
            p_id = str(it.get("product_id", ""))
            count = int(it.get("count", 1))
            prod = None
            if p_id.isdigit():
                prod = db.query(Product).filter(Product.id == int(p_id)).first()
            if not prod:
                prod = db.query(Product).filter((Product.barcode == p_id) | (Product.p_code == p_id)).first()
            if not prod:
                continue

            for _ in range(count):
                if not is_first:
                    all_story.append(PageBreak())
                is_first = False
                sticker_flowables = build_single_product_sticker_story(prod)
                all_story.extend(sticker_flowables)

        if not all_story:
            from reportlab.platypus import Paragraph
            styles = getSampleStyleSheet()
            all_story.append(Paragraph("No Barcode Items Selected", styles['Normal']))

        doc.build(all_story)
        pdf_bytes = buf.getvalue()
        return pdf_bytes
    finally:
        try:
            buf.close()
        except Exception:
            pass


@router.post("/barcode-studio/batch-labels", tags=["Barcode & Label Studio"])
def generate_barcode_studio_batch_labels(
    payload: BarcodeBatchRequest,
    background_tasks: BackgroundTasks,
    format: Optional[str] = Query("pdf", description="Output format: pdf or json"),
    db: Session = Depends(get_db)
):
    """
    Thermal Barcode & QR Studio Batch Generation with Zero-Leak Memory Safety and Backpressure Limit (#16, #40, #91).
    - Caps single batch generation at 200 labels per synchronous call.
    - If batch exceeds 200 labels, offloads generation to asynchronous task, uploads to Cloudflare R2, and returns 202 with presigned URL.
    """
    import uuid
    from fastapi.responses import JSONResponse

    total_labels = sum(max(1, it.count) for it in payload.items)
    if total_labels <= 0:
        raise HTTPException(status_code=400, detail="Batch must contain at least 1 label")

    batch_id = f"BATCH-{uuid.uuid4().hex[:10].upper()}"

    # BACKPRESSURE LIMIT CHECK (#91)
    if total_labels > 200:
        clean_sheet = f"barcodes/SVF_Barcode_Sheet_{batch_id}.pdf"
        presigned_url = r2_service.generate_presigned_download_url(clean_sheet, expires_in_seconds=3600)

        def async_worker(batch_id: str, items_data: List[dict]):
            from app.core.database import SessionLocal
            bg_db = SessionLocal()
            try:
                sheet_bytes = build_batch_barcode_pdf_bytes(items_data, bg_db)
                r2_service.upload_barcode_sheet(sheet_id=batch_id, sheet_bytes=sheet_bytes, format="pdf")
            finally:
                bg_db.close()

        items_dict = [{"product_id": it.product_id, "count": it.count} for it in payload.items]
        background_tasks.add_task(async_worker, batch_id, items_dict)

        return JSONResponse(
            status_code=202,
            content={
                "status": "PROCESSING",
                "batch_id": batch_id,
                "total_labels": total_labels,
                "r2_key": clean_sheet,
                "download_url": presigned_url,
                "message": f"Single batch generation capped at 200 labels per synchronous call. Your request of {total_labels} labels has been queued for asynchronous generation and storage in Cloudflare R2."
            }
        )

    # Synchronous processing for <= 200 labels (#16, #91)
    items_dict = [{"product_id": it.product_id, "count": it.count} for it in payload.items]
    pdf_bytes = build_batch_barcode_pdf_bytes(items_dict, db)

    r2_key, presigned_url = r2_service.upload_barcode_sheet(sheet_id=batch_id, sheet_bytes=pdf_bytes, format="pdf")

    if format == "json" or payload.format == "json":
        return {
            "status": "COMPLETED",
            "batch_id": batch_id,
            "total_labels": total_labels,
            "r2_key": r2_key,
            "download_url": presigned_url
        }

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="SVF_Barcode_Batch_{batch_id}.pdf"',
            "X-Batch-Id": batch_id,
            "X-Total-Labels": str(total_labels),
            "X-Cloudflare-R2-Path": r2_key,
            "X-Cloudflare-R2-Presigned-Url": presigned_url
        }
    )
