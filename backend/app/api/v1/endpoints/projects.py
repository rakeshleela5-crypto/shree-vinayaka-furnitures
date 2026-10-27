import logging
import re
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.project import FurnitureProject
from app.schemas.project import (
    PresignedUrlRequest,
    PresignedUrlResponse,
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse
)
from app.services.r2_storage import r2_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/presigned-url", response_model=PresignedUrlResponse)
def get_presigned_upload_url(payload: PresignedUrlRequest):
    """
    Generate temporary 1-hour Pre-Signed PUT URL for direct browser uploads to Cloudflare R2.
    
    Architecture:
    1. Sanitizes filename and generates a collision-free key: `projects/{uuid12}-{clean_filename}`
    2. Uses boto3 with Cloudflare R2's S3-compatible API (S3v4 signature)
    3. Returns `presigned_upload_url` (for direct browser PUT) and `public_image_url`
    """
    clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', payload.filename.strip())
    if not clean_name:
        clean_name = "project_image.jpg"
    
    unique_id = uuid.uuid4().hex[:12]
    file_key = f"projects/{unique_id}-{clean_name}"
    
    content_type = payload.content_type.strip() or "image/jpeg"

    try:
        presigned_upload_url = r2_service.generate_presigned_upload_url(
            key=file_key,
            content_type=content_type,
            expires_in_seconds=3600
        )
        public_image_url = r2_service.get_public_url(file_key)
        
        return PresignedUrlResponse(
            presigned_upload_url=presigned_upload_url,
            public_image_url=public_image_url,
            r2_file_key=file_key
        )
    except Exception as e:
        logger.error(f"Failed to generate R2 presigned upload URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not generate Cloudflare R2 upload URL: {str(e)}"
        )

@router.get("", response_model=List[ProjectResponse])
def get_all_projects(
    category: Optional[str] = Query(None, description="Filter by furniture category"),
    search: Optional[str] = Query(None, description="Search keyword in title, description, or client"),
    db: Session = Depends(get_db)
):
    """
    Fetch all furniture showcase projects from PostgreSQL to display on the /project page.
    """
    query = db.query(FurnitureProject)

    if category and category.lower() not in ("all", "all projects", ""):
        query = query.filter(FurnitureProject.category.ilike(f"%{category.strip()}%"))

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                FurnitureProject.title.ilike(term),
                FurnitureProject.description.ilike(term),
                FurnitureProject.client_name.ilike(term),
                FurnitureProject.location.ilike(term)
            )
        )

    # Order newest first
    projects = query.order_by(FurnitureProject.created_at.desc()).all()
    return projects

@router.get("/{id}", response_model=ProjectResponse)
def get_project_by_id(id: int, db: Session = Depends(get_db)):
    """
    Fetch single project details by ID.
    """
    project = db.query(FurnitureProject).filter(FurnitureProject.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Furniture project not found")
    return project

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    """
    Saves the project metadata + public_image_url + r2_file_key into PostgreSQL
    after the frontend finishes uploading to Cloudflare R2.
    """
    new_project = FurnitureProject(
        title=payload.title.strip(),
        description=payload.description or "",
        category=payload.category or "Living Room",
        r2_file_key=payload.r2_file_key.strip(),
        image_url=payload.image_url.strip(),
        client_name=payload.client_name.strip() if payload.client_name else None,
        location=payload.location.strip() if payload.location else None,
        is_featured=payload.is_featured or False
    )

    try:
        db.add(new_project)
        db.commit()
        db.refresh(new_project)
        logger.info(f"Created new furniture project #{new_project.id}: '{new_project.title}' with R2 key {new_project.r2_file_key}")
        return new_project
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to persist furniture project in database: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save project record in database: {str(e)}"
        )

@router.put("/{id}", response_model=ProjectResponse)
def update_project(id: int, payload: ProjectUpdate, db: Session = Depends(get_db)):
    """
    Updates an existing furniture project record in PostgreSQL.
    """
    project = db.query(FurnitureProject).filter(FurnitureProject.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Furniture project not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(project, field, val)

    try:
        db.commit()
        db.refresh(project)
        return project
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update project: {str(e)}")

@router.delete("/{id}")
def delete_project(id: int, db: Session = Depends(get_db)):
    """
    Deletes the object from Cloudflare R2 via boto3 AND removes the record from PostgreSQL.
    """
    project = db.query(FurnitureProject).filter(FurnitureProject.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Furniture project not found")

    file_key = project.r2_file_key
    project_title = project.title

    # 1. Delete object from Cloudflare R2 via boto3
    r2_deleted = False
    if file_key:
        try:
            r2_deleted = r2_service.delete_object(file_key)
            logger.info(f"Purged R2 storage object '{file_key}' for project #{id}")
        except Exception as e:
            logger.warning(f"Could not purge R2 object '{file_key}': {e}")

    # 2. Delete record from PostgreSQL
    try:
        db.delete(project)
        db.commit()
        logger.info(f"Deleted furniture project #{id} ('{project_title}') from database")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to remove project #{id} from database: {e}")
        raise HTTPException(status_code=500, detail=f"Database deletion failed: {str(e)}")

    return {
        "status": "SUCCESS",
        "message": f"Project '{project_title}' and Cloudflare R2 storage asset deleted successfully",
        "id": id,
        "r2_file_key": file_key,
        "r2_deleted": r2_deleted
    }

@router.put("/upload-mock")
async def mock_direct_upload(request: Request, key: str = "mock-file"):
    """
    Development fallback endpoint for testing browser-to-R2 upload flows
    when live Cloudflare R2 credentials are not configured in local environment.
    """
    body = await request.body()
    logger.info(f"Mock upload received {len(body)} bytes for key: {key}")
    return {
        "status": "SUCCESS",
        "message": "Mock upload accepted in development mode",
        "key": key,
        "bytes_received": len(body)
    }
