import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.category import CategoryOut

class FurnitureBase(BaseModel):
    title: str
    slug: str
    category_id: Optional[int] = None
    description: str
    price: float
    original_price: Optional[float] = None
    material: Optional[str] = None
    dimensions: Optional[str] = None
    color: Optional[str] = None
    warranty: Optional[str] = "3 Years Comprehensive"
    in_stock: bool = True
    is_featured: bool = False
    image_url: Optional[str] = None
    rating: float = 4.8
    reviews_count: int = 18

class FurnitureCreate(FurnitureBase):
    pass

class FurnitureUpdate(BaseModel):
    title: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    material: Optional[str] = None
    dimensions: Optional[str] = None
    color: Optional[str] = None
    warranty: Optional[str] = None
    in_stock: Optional[bool] = None
    is_featured: Optional[bool] = None
    image_url: Optional[str] = None

class FurnitureOut(FurnitureBase):
    id: int
    created_at: datetime.datetime
    category: Optional[CategoryOut] = None

    class Config:
        from_attributes = True
