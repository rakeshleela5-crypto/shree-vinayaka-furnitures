from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
import logging

from app.core.database import get_db
from app.models.discounts import (
    ProductQuantityDiscountRule,
    ComboPack,
    Coupon,
    GiftVoucher,
    BarcodeTemplate,
    EWayBill
)
from app.models.product import Product
from app.schemas.discounts import (
    ProductQuantityDiscountRuleCreate,
    ProductQuantityDiscountRuleResponse,
    ComboPackCreate,
    ComboPackResponse,
    CouponCreate,
    CouponResponse,
    GiftVoucherCreate,
    GiftVoucherResponse,
    EWayBillCreate,
    EWayBillResponse,
    BarcodeTemplateCreate,
    BarcodeTemplateResponse
)

router = APIRouter()
logger = logging.getLogger("svf.discounts")

# ----------------------------------------------------
# 1. Coupons
# ----------------------------------------------------
@router.get("/coupons", response_model=List[CouponResponse])
def get_coupons(active_only: bool = True, db: Session = Depends(get_db)):
    query = db.query(Coupon)
    if active_only:
        query = query.filter(Coupon.is_active == True)
    return query.order_by(Coupon.id.desc()).all()

@router.post("/coupons", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
def create_coupon(payload: CouponCreate, db: Session = Depends(get_db)):
    existing = db.query(Coupon).filter(Coupon.code == payload.code.upper().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Coupon code '{payload.code}' already exists.")
    
    new_coupon = Coupon(
        code=payload.code.upper().strip(),
        title=payload.title,
        discount_type=payload.discount_type,
        discount_value=payload.discount_value,
        min_bill_amount=payload.min_bill_amount,
        max_discount_amount=payload.max_discount_amount,
        start_date=payload.start_date,
        end_date=payload.end_date,
        usage_limit=payload.usage_limit,
        is_active=payload.is_active
    )
    try:
        db.add(new_coupon)
        db.commit()
        db.refresh(new_coupon)
        return new_coupon
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating coupon: {e}")
        raise HTTPException(status_code=500, detail=f"Database error creating coupon: {str(e)}")

@router.post("/coupons/validate")
def validate_coupon(code: str = Query(...), bill_amount: float = Query(...), db: Session = Depends(get_db)):
    coupon = db.query(Coupon).filter(
        Coupon.code == code.upper().strip(),
        Coupon.is_active == True
    ).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid or expired coupon code.")
    
    if bill_amount < coupon.min_bill_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Coupon requires a minimum bill amount of ₹{coupon.min_bill_amount:,.2f}."
        )
    
    if coupon.usage_limit and coupon.used_count >= coupon.usage_limit:
        raise HTTPException(status_code=400, detail="Coupon usage limit has been reached.")
    
    # Calculate discount amount
    if coupon.discount_type == "Percentage":
        disc = (bill_amount * coupon.discount_value) / 100.0
        if coupon.max_discount_amount and disc > coupon.max_discount_amount:
            disc = coupon.max_discount_amount
    else:
        disc = min(coupon.discount_value, bill_amount)
    
    return {
        "valid": True,
        "code": coupon.code,
        "title": coupon.title,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "calculated_discount": round(disc, 2),
        "min_bill_amount": coupon.min_bill_amount
    }

@router.delete("/coupons/{coupon_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_coupon(coupon_id: int, db: Session = Depends(get_db)):
    c = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Coupon not found.")
    try:
        db.delete(c)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------------------------------------
# 2. Gift Vouchers
# ----------------------------------------------------
@router.get("/gift-vouchers", response_model=List[GiftVoucherResponse])
def get_gift_vouchers(status_filter: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(GiftVoucher)
    if status_filter:
        query = query.filter(GiftVoucher.status == status_filter)
    return query.order_by(GiftVoucher.id.desc()).all()

@router.post("/gift-vouchers", response_model=GiftVoucherResponse, status_code=status.HTTP_201_CREATED)
def create_gift_voucher(payload: GiftVoucherCreate, db: Session = Depends(get_db)):
    existing = db.query(GiftVoucher).filter(GiftVoucher.voucher_code == payload.voucher_code.upper().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Voucher code '{payload.voucher_code}' already exists.")
    
    voucher = GiftVoucher(
        voucher_code=payload.voucher_code.upper().strip(),
        title=payload.title,
        denomination=payload.denomination,
        issue_date=payload.issue_date,
        expiry_date=payload.expiry_date,
        issued_to_customer=payload.issued_to_customer,
        status="Active"
    )
    try:
        db.add(voucher)
        db.commit()
        db.refresh(voucher)
        return voucher
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/gift-vouchers/{code}", response_model=GiftVoucherResponse)
def get_gift_voucher_by_code(code: str, db: Session = Depends(get_db)):
    v = db.query(GiftVoucher).filter(GiftVoucher.voucher_code == code.upper().strip()).first()
    if not v:
        raise HTTPException(status_code=404, detail="Gift voucher not found.")
    return v

@router.post("/gift-vouchers/redeem")
def redeem_gift_voucher(code: str = Query(...), bill_no: str = Query(...), db: Session = Depends(get_db)):
    v = db.query(GiftVoucher).filter(GiftVoucher.voucher_code == code.upper().strip()).first()
    if not v:
        raise HTTPException(status_code=404, detail="Gift voucher not found.")
    if v.status != "Active":
        raise HTTPException(status_code=400, detail=f"Voucher cannot be redeemed. Current status: {v.status}")
    
    v.status = "Redeemed"
    v.redeemed_date = datetime.date.today().isoformat()
    v.redeemed_bill_no = bill_no
    try:
        db.commit()
        return {
            "success": True,
            "message": f"Voucher {v.voucher_code} of ₹{v.denomination:,.2f} redeemed against bill {bill_no}.",
            "denomination": v.denomination
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/gift-vouchers/{voucher_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gift_voucher(voucher_id: int, db: Session = Depends(get_db)):
    v = db.query(GiftVoucher).filter(GiftVoucher.id == voucher_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Gift voucher not found.")
    try:
        db.delete(v)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------------------------------------
# 3. Quantity Discount Rules
# ----------------------------------------------------
@router.get("/quantity-rules", response_model=List[ProductQuantityDiscountRuleResponse])
def get_quantity_rules(product_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(ProductQuantityDiscountRule)
    if product_id:
        query = query.filter(ProductQuantityDiscountRule.product_id == product_id)
    return query.order_by(ProductQuantityDiscountRule.id.desc()).all()

@router.post("/quantity-rules", response_model=ProductQuantityDiscountRuleResponse, status_code=status.HTTP_201_CREATED)
def create_quantity_rule(payload: ProductQuantityDiscountRuleCreate, db: Session = Depends(get_db)):
    p_id = payload.product_id
    if not p_id and payload.barcode:
        p = db.query(Product).filter(Product.barcode == payload.barcode).first()
        if p:
            p_id = p.id
    
    if not p_id:
        raise HTTPException(status_code=400, detail="Must provide a valid product_id or existing barcode.")
    
    rule = ProductQuantityDiscountRule(
        product_id=p_id,
        min_qty=payload.min_qty,
        max_qty=payload.max_qty,
        discount_percent=payload.discount_percent,
        discount_amount=payload.discount_amount,
        active=payload.active
    )
    try:
        db.add(rule)
        db.commit()
        db.refresh(rule)
        return rule
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/quantity-rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quantity_rule(rule_id: int, db: Session = Depends(get_db)):
    r = db.query(ProductQuantityDiscountRule).filter(ProductQuantityDiscountRule.id == rule_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Discount rule not found.")
    try:
        db.delete(r)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/quantity-rules/product/{product_id}", status_code=status.HTTP_200_OK)
def delete_all_rules_for_product(product_id: int, db: Session = Depends(get_db)):
    deleted_count = db.query(ProductQuantityDiscountRule).filter(
        ProductQuantityDiscountRule.product_id == product_id
    ).delete(synchronize_session=False)
    try:
        db.commit()
        return {"deleted": deleted_count}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------------------------------------
# 4. Combo Packs
# ----------------------------------------------------
@router.get("/combo-packs", response_model=List[ComboPackResponse])
def get_combo_packs(active_only: bool = True, db: Session = Depends(get_db)):
    query = db.query(ComboPack)
    if active_only:
        query = query.filter(ComboPack.active == True)
    return query.order_by(ComboPack.id.desc()).all()

@router.post("/combo-packs", response_model=ComboPackResponse, status_code=status.HTTP_201_CREATED)
def create_combo_pack(payload: ComboPackCreate, db: Session = Depends(get_db)):
    existing = db.query(ComboPack).filter(ComboPack.barcode == payload.barcode).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Combo pack with barcode '{payload.barcode}' already exists.")
    
    pack = ComboPack(
        name=payload.name,
        barcode=payload.barcode,
        combo_price=payload.combo_price,
        mrp=payload.mrp,
        description=payload.description,
        items_json=payload.items_json,
        active=payload.active
    )
    try:
        db.add(pack)
        db.commit()
        db.refresh(pack)
        return pack
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/combo-packs/{pack_id}", response_model=ComboPackResponse)
def update_combo_pack(pack_id: int, payload: ComboPackCreate, db: Session = Depends(get_db)):
    pack = db.query(ComboPack).filter(ComboPack.id == pack_id).first()
    if not pack:
        raise HTTPException(status_code=404, detail="Combo pack not found.")
    
    pack.name = payload.name
    pack.barcode = payload.barcode
    pack.combo_price = payload.combo_price
    pack.mrp = payload.mrp
    pack.description = payload.description
    pack.items_json = payload.items_json
    pack.active = payload.active
    try:
        db.commit()
        db.refresh(pack)
        return pack
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/combo-packs/{pack_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_combo_pack(pack_id: int, db: Session = Depends(get_db)):
    pack = db.query(ComboPack).filter(ComboPack.id == pack_id).first()
    if not pack:
        raise HTTPException(status_code=404, detail="Combo pack not found.")
    try:
        db.delete(pack)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------------------------------------
# 5. E-Way Bills
# ----------------------------------------------------
@router.get("/eway-bills", response_model=List[EWayBillResponse])
def get_eway_bills(db: Session = Depends(get_db)):
    return db.query(EWayBill).order_by(EWayBill.id.desc()).all()

@router.post("/eway-bills", response_model=EWayBillResponse, status_code=status.HTTP_201_CREATED)
def create_eway_bill(payload: EWayBillCreate, db: Session = Depends(get_db)):
    existing = db.query(EWayBill).filter(EWayBill.eway_bill_no == payload.eway_bill_no).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"E-Way Bill '{payload.eway_bill_no}' already exists.")
    
    bill = EWayBill(
        eway_bill_no=payload.eway_bill_no,
        eway_bill_date=payload.eway_bill_date,
        invoice_no=payload.invoice_no,
        customer_name=payload.customer_name,
        customer_gstin=payload.customer_gstin,
        from_place=payload.from_place,
        to_place=payload.to_place,
        distance_km=payload.distance_km,
        transporter_id=payload.transporter_id,
        transporter_name=payload.transporter_name,
        transport_mode=payload.transport_mode,
        vehicle_no=payload.vehicle_no,
        valid_until=payload.valid_until,
        status="ACTIVE"
    )
    try:
        db.add(bill)
        db.commit()
        db.refresh(bill)
        return bill
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------------------------------------
# 6. Barcode Templates
# ----------------------------------------------------
@router.get("/barcode-templates", response_model=List[BarcodeTemplateResponse])
def get_barcode_templates(db: Session = Depends(get_db)):
    return db.query(BarcodeTemplate).order_by(BarcodeTemplate.id.asc()).all()

@router.post("/barcode-templates", response_model=BarcodeTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_barcode_template(payload: BarcodeTemplateCreate, db: Session = Depends(get_db)):
    existing = db.query(BarcodeTemplate).filter(BarcodeTemplate.name == payload.name).first()
    if existing:
        # Update existing
        for k, v in payload.dict().items():
            setattr(existing, k, v)
        try:
            db.commit()
            db.refresh(existing)
            return existing
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))
    
    t = BarcodeTemplate(**payload.dict())
    try:
        db.add(t)
        db.commit()
        db.refresh(t)
        return t
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/barcode-templates/{id}", response_model=BarcodeTemplateResponse)
def update_barcode_template(id: int, payload: BarcodeTemplateCreate, db: Session = Depends(get_db)):
    t = db.query(BarcodeTemplate).filter(BarcodeTemplate.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Barcode template not found.")
    for k, v in payload.dict().items():
        setattr(t, k, v)
    try:
        db.commit()
        db.refresh(t)
        return t
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/barcode-templates/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_barcode_template(id: int, db: Session = Depends(get_db)):
    t = db.query(BarcodeTemplate).filter(BarcodeTemplate.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Barcode template not found.")
    try:
        db.delete(t)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
