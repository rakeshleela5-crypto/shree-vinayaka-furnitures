from fastapi import APIRouter, Depends, HTTPException, Query, Response
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


def generate_product_barcode_label_pdf_bytes(p: Product) -> bytes:
    import io
    from reportlab.lib.pagesizes import landscape
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.graphics.barcode import createBarcodeDrawing, qr

    buf = io.BytesIO()
    # 4 x 3 inches sticker size (288 x 216 pt)
    sticker_size = (288, 216)
    doc = SimpleDocTemplate(buf, pagesize=sticker_size, rightMargin=12, leftMargin=12, topMargin=10, bottomMargin=10)
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
        from reportlab.graphics.shapes import Drawing
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

    doc.build(story)
    return buf.getvalue()


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



