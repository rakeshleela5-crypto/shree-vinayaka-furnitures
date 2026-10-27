from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class WorkshopJobCardBase(BaseModel):
    customer_name: str = Field(..., min_length=2, description="Customer Name")
    customer_phone: Optional[str] = Field(None, description="Customer Contact Phone")
    product_name: str = Field(..., min_length=2, description="Custom Furniture Item Name")
    invoice_no: Optional[str] = Field(None, description="Linked Sale Invoice / Booking No")
    sale_invoice_id: Optional[int] = Field(None, description="Sale Invoice ID")
    customer_id: Optional[int] = Field(None, description="Customer ID")
    frame_wood: str = Field("Treated Teak / Silver Oak", description="Frame Wood Specification")
    cushioning: str = Field("40 Density Sleepwell PU Foam", description="Cushioning & Webbing")
    upholstery_code: str = Field("D'Decor Series 402 Velvet (Teal #08)", description="Fabric / Upholstery Catalog Reference")
    dimensions_orientation: str = Field("L-Shape Left Lounger (108x68x34 in)", description="Custom Dimensions & Lounger Orientation")
    target_completion_date: Optional[str] = Field(None, description="Target Workshop Finish Date")
    delivery_promise_date: Optional[str] = Field(None, description="Customer Delivery Promised Date")
    technician_name: str = Field("Master Craftsman Murugan", description="Lead Carpenter / Craftsman")
    notes: Optional[str] = Field(None, description="Detailed Crafting & Polish Notes")
    estimated_cost: float = Field(0.0, ge=0, description="Estimated Material & Labor Cost")
    advance_paid: float = Field(0.0, ge=0, description="Customer Advance Tendered")

class WorkshopJobCardCreate(WorkshopJobCardBase):
    date: Optional[str] = None

class WorkshopJobCardStageUpdate(BaseModel):
    stage: str = Field(..., description="DESIGN_LOCKED | WOOD_FRAME | WEBBING_FOAM | FABRIC_UPHOLSTERY | QC_VERIFIED | READY_FOR_DISPATCH")
    notes: Optional[str] = None
    technician_name: Optional[str] = None
    version: Optional[int] = Field(None, description="Current record version for optimistic locking")

class WorkshopJobCardResponse(WorkshopJobCardBase):
    id: int
    job_card_no: str
    date: str
    stage: str
    version: int = 1
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
