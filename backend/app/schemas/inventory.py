from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class StockEntryItemCreate(BaseModel):
    product_id: int
    product_code: Optional[str] = None
    product_name: str
    barcode: Optional[str] = None
    qty: float = 1.0
    unit: str = "Pcs"
    remarks: Optional[str] = None

class StockEntryItemResponse(StockEntryItemCreate):
    id: int
    stock_entry_id: int
    model_config = ConfigDict(from_attributes=True)

class StockEntryCreate(BaseModel):
    stock_code: str
    date: str
    remarks: Optional[str] = None
    items: List[StockEntryItemCreate]

class StockEntryResponse(BaseModel):
    id: int
    stock_code: str
    date: str
    remarks: Optional[str] = None
    created_at: datetime
    items: List[StockEntryItemResponse] = []
    model_config = ConfigDict(from_attributes=True)

class StockAdjustmentCreate(BaseModel):
    adjustment_code: str
    date: str
    product_id: int
    product_code: Optional[str] = None
    product_name: str
    barcode: Optional[str] = None
    adjustment_type: str # Plus / Minus
    qty: float = 1.0
    reason: str

class StockAdjustmentResponse(StockAdjustmentCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
