from fastapi import APIRouter
from app.api.v1.endpoints import health, categories, furniture, inquiries

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(furniture.router, prefix="/furniture", tags=["Furniture"])
api_router.include_router(inquiries.router, prefix="/inquiries", tags=["Inquiries"])
