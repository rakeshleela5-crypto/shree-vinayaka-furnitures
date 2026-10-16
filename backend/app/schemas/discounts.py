from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ProductQuantityDiscountRuleCreate(BaseModel):
    product_id: int
    min_qty: float = 1.0
    max_qty: float = 10.0
    discount_percent: float = 0.0
    discount_amount: float = 0.0
    active: bool = True

class ProductQuantityDiscountRuleResponse(ProductQuantityDiscountRuleCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ComboPackCreate(BaseModel):
    name: str
    barcode: str
    combo_price: float
    mrp: float
    description: Optional[str] = None
    items_json: str
    active: bool = True

class ComboPackResponse(ComboPackCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CouponCreate(BaseModel):
    code: str
    title: str
    discount_type: str = "Percentage"
    discount_value: float
    min_bill_amount: float = 0.0
    max_discount_amount: Optional[float] = None
    start_date: str
    end_date: str
    usage_limit: Optional[int] = None
    is_active: bool = True

class CouponResponse(CouponCreate):
    id: int
    used_count: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class GiftVoucherCreate(BaseModel):
    voucher_code: str
    title: str
    denomination: float
    issue_date: str
    expiry_date: str
    issued_to_customer: Optional[str] = None

class GiftVoucherResponse(GiftVoucherCreate):
    id: int
    status: str
    redeemed_date: Optional[str] = None
    redeemed_bill_no: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class EWayBillCreate(BaseModel):
    eway_bill_no: str
    eway_bill_date: str
    invoice_no: str
    customer_name: str
    customer_gstin: Optional[str] = None
    from_place: str
    to_place: str
    distance_km: float = 0.0
    transporter_id: Optional[str] = None
    transporter_name: str
    transport_mode: str = "Road"
    vehicle_no: str
    valid_until: str

class EWayBillResponse(EWayBillCreate):
    id: int
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
