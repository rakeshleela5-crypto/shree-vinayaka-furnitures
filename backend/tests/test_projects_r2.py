import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine
from app.services.r2_storage import r2_service

Base.metadata.create_all(bind=engine)
client = TestClient(app)

def test_presigned_url_generation():
    """
    Test POST /api/projects/presigned-url generates a presigned PUT URL
    using Cloudflare R2 / S3v4 signature and returns the public CDN image URL.
    """
    mock_boto = MagicMock()
    mock_boto.generate_presigned_url.return_value = (
        "https://mock-account.r2.cloudflarestorage.com/svf-store-backups/projects/mock-key.jpg"
        "?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=3600&X-Amz-Signature=test1234"
    )

    with patch.object(r2_service, "client", mock_boto):
        payload = {
            "filename": "Modern Teak Sofa Set.jpg",
            "content_type": "image/jpeg"
        }
        response = client.post("/api/projects/presigned-url", json=payload)
        assert response.status_code == 200, f"Error: {response.text}"
        data = response.json()
        assert "presigned_upload_url" in data
        assert "public_image_url" in data
        assert "r2_file_key" in data
        assert data["r2_file_key"].startswith("projects/")
        assert "Modern_Teak_Sofa_Set.jpg" in data["r2_file_key"]
        assert "X-Amz-Signature" in data["presigned_upload_url"]

        # Also verify /api/v1/projects/presigned-url dual-mount works
        v1_response = client.post("/api/v1/projects/presigned-url", json=payload)
        assert v1_response.status_code == 200


def test_projects_crud_lifecycle_with_r2():
    """
    Test complete lifecycle:
    1. Create Project in DB with R2 metadata
    2. Fetch via GET /api/projects and verify ordering and category filter
    3. Delete Project and verify R2 object deletion and DB removal
    """
    mock_boto = MagicMock()
    mock_boto.delete_object.return_value = {"ResponseMetadata": {"HTTPStatusCode": 204}}

    with patch.object(r2_service, "client", mock_boto):
        # 1. Create project
        create_payload = {
            "title": "Minimalist Teakwood Master Bed",
            "description": "Solid Burma Teak king bed with hidden hydraulic storage.",
            "category": "Bedroom",
            "r2_file_key": "projects/test-uuid-teak-bed.webp",
            "image_url": "https://pub-test.r2.dev/projects/test-uuid-teak-bed.webp",
            "client_name": "Dr. R. Sharma Penthouse",
            "location": "Indiranagar, Bengaluru",
            "is_featured": True
        }
        res_create = client.post("/api/projects", json=create_payload)
        assert res_create.status_code == 201, f"Failed create: {res_create.text}"
        created_data = res_create.json()
        project_id = created_data["id"]
        assert created_data["title"] == create_payload["title"]
        assert created_data["r2_file_key"] == create_payload["r2_file_key"]
        assert created_data["image_url"] == create_payload["image_url"]

        # 2. Get all projects
        res_list = client.get("/api/projects")
        assert res_list.status_code == 200
        projects = res_list.json()
        assert any(p["id"] == project_id for p in projects)

        # 2b. Filter by category
        res_filter = client.get("/api/projects?category=Bedroom")
        assert res_filter.status_code == 200
        filtered = res_filter.json()
        assert all("bedroom" in p["category"].lower() for p in filtered)

        # 3. Get by ID
        res_get = client.get(f"/api/projects/{project_id}")
        assert res_get.status_code == 200
        assert res_get.json()["id"] == project_id

        # 4. Delete project
        res_delete = client.delete(f"/api/projects/{project_id}")
        assert res_delete.status_code == 200
        delete_data = res_delete.json()
        assert delete_data["status"] == "SUCCESS"
        assert delete_data["id"] == project_id

        # Verify boto3 delete_object was invoked for the exact R2 key
        mock_boto.delete_object.assert_called_once_with(
            Bucket=r2_service.bucket,
            Key=create_payload["r2_file_key"]
        )

        # 5. Verify 404 after deletion
        res_404 = client.get(f"/api/projects/{project_id}")
        assert res_404.status_code == 404
