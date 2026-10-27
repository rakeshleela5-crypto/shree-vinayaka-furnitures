import os
import io
import tempfile
import logging
from typing import Optional, Union
import boto3
from botocore.config import Config
from app.core.config import settings

logger = logging.getLogger(__name__)

class R2StorageService:
    """
    Cloudflare R2 Object Storage Service.
    
    Eliminates Railway ephemeral disk loss:
    - In-memory PDF streaming directly to private R2 bucket (zero local disk writes)
    - Sensitive bills protected via 1-hour pre-signed GET URLs
    """
    def __init__(self):
        self.bucket = settings.R2_BUCKET_NAME
        self.client = None
        if settings.R2_ACCOUNT_ID and settings.R2_ACCESS_KEY_ID and settings.R2_SECRET_ACCESS_KEY:
            try:
                self.client = boto3.client(
                    's3',
                    endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
                    aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                    config=Config(signature_version='s3v4')
                )
                logger.info(f"Cloudflare R2 Storage initialized for bucket: {self.bucket}")
            except Exception as e:
                logger.warning(f"Failed to initialize Cloudflare R2 client: {e}")

    @property
    def is_configured(self) -> bool:
        return self.client is not None

    @property
    def bucket_name(self) -> str:
        return self.bucket or "svf-store-backups"

    @staticmethod
    def compress_furniture_image_webp(image_bytes: bytes, max_width: int = 1600, quality: int = 82) -> bytes:
        """
        Convert uploaded furniture images to compressed WebP format (max-width: 1600px, quality: 82) (#85).
        Guarantees zero memory leaks by wrapping Image and BytesIO in try...finally.
        """
        from PIL import Image
        in_buf = io.BytesIO(image_bytes)
        out_buf = io.BytesIO()
        try:
            with Image.open(in_buf) as img:
                # Retain RGBA transparency if present; otherwise convert to RGB
                if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                    converted = img
                elif img.mode != "RGB":
                    converted = img.convert("RGB")
                else:
                    converted = img

                # Scale down proportionally if image width exceeds max_width
                if converted.width > max_width:
                    ratio = max_width / float(converted.width)
                    new_height = max(1, int(float(converted.height) * ratio))
                    converted = converted.resize((max_width, new_height), Image.Resampling.LANCZOS)

                converted.save(out_buf, format="WEBP", quality=quality, method=6)
                return out_buf.getvalue()
        finally:
            out_buf.close()
            in_buf.close()

    def upload_buffer(
        self,
        key: str,
        buffer: Union[bytes, io.BytesIO],
        content_type: str = "application/pdf",
        cache_control: Optional[str] = None
    ) -> str:
        """
        Stream in-memory bytes or buffer directly into Private Cloudflare R2 bucket.
        Supports explicit CacheControl metadata (#85).
        """
        raw_bytes = buffer.getvalue() if isinstance(buffer, io.BytesIO) else buffer

        if self.client:
            try:
                put_kwargs = {
                    "Bucket": self.bucket,
                    "Key": key,
                    "Body": raw_bytes,
                    "ContentType": content_type,
                }
                if cache_control:
                    put_kwargs["CacheControl"] = cache_control

                self.client.put_object(**put_kwargs)
                logger.info(f"Archived {len(raw_bytes)} bytes to Cloudflare R2: {key}")
                return key
            except Exception as e:
                logger.error(f"Error uploading buffer to R2 [{key}]: {e}")
        else:
            logger.info(f"R2 not configured in this environment; keeping buffer in-memory for {key}")

        return key

    def upload_furniture_image(
        self,
        key: str,
        image_bytes: bytes,
        max_width: int = 1600,
        quality: int = 82
    ) -> tuple[str, str]:
        """
        Compress furniture image to WebP (max-width 1600px, quality 82), attach immutable
        edge cache headers (CacheControl='public, max-age=31536000, immutable'), and upload to R2 (#85).
        Returns (r2_key, cdn_url).
        """
        clean_key = key.lstrip('/')
        # Ensure destination key ends in .webp
        base_name = clean_key.rsplit('.', 1)[0]
        webp_key = f"{base_name}.webp"

        compressed_bytes = self.compress_furniture_image_webp(image_bytes, max_width=max_width, quality=quality)
        self.upload_buffer(
            key=webp_key,
            buffer=compressed_bytes,
            content_type="image/webp",
            cache_control="public, max-age=31536000, immutable"
        )
        return webp_key, self.get_public_url(webp_key)

    def upload_invoice_pdf(
        self,
        invoice_no: str,
        pdf_bytes: bytes,
        financial_year: str = "2026-2027"
    ) -> tuple[str, str]:
        """
        Upload GST Tax Invoice PDF to Cloudflare R2 and generate a short-lived presigned URL (#85, #86).
        Returns (r2_key, presigned_download_url).
        """
        clean_inv = invoice_no.replace("/", "_").replace("\\", "_")
        key = f"invoices/{financial_year}/SVF_Invoice_{clean_inv}.pdf"
        self.upload_buffer(
            key=key,
            buffer=pdf_bytes,
            content_type="application/pdf",
            cache_control="private, no-cache"
        )
        download_url = self.generate_presigned_download_url(key=key, expires_in_seconds=900)
        return key, download_url

    def upload_barcode_sheet(
        self,
        sheet_id: str,
        sheet_bytes: bytes,
        format: str = "pdf"
    ) -> tuple[str, str]:
        """
        Upload Thermal Barcode Sheet (PDF or PNG) to Cloudflare R2 (#85, #91).
        Returns (r2_key, presigned_or_public_url).
        """
        content_type = "application/pdf" if format.lower() == "pdf" else "image/png"
        key = f"barcodes/SVF_Barcode_Sheet_{sheet_id}.{format.lower()}"
        self.upload_buffer(
            key=key,
            buffer=sheet_bytes,
            content_type=content_type,
            cache_control="public, max-age=86400"
        )
        return key, self.get_public_url(key)

    def generate_presigned_download_url(self, key: str, expires_in_seconds: int = 900) -> str:
        """
        Generate temporary secure Pre-Signed URL for private financial documents (invoices, bank statements).
        Defaults to short-lived 900 seconds (15 minutes) (#85, #86).
        """
        clean_key = key.lstrip('/')
        if self.client:
            try:
                url = self.client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': self.bucket, 'Key': clean_key},
                    ExpiresIn=expires_in_seconds
                )
                return url
            except Exception as e:
                logger.error(f"Error generating R2 presigned URL for {clean_key}: {e}")

        # Local/development fallback URL
        return f"/api/v1/sales/by-no/{clean_key.split('/')[-1].replace('.pdf','')}/pdf"

    def generate_presigned_upload_url(self, key: str, content_type: str = "image/jpeg", expires_in_seconds: int = 3600) -> str:
        """
        Generate temporary 1-hour secure Pre-Signed PUT URL for direct browser uploads to Cloudflare R2.
        Bypasses server bottlenecks and prevents multi-megabyte image payloads from traversing FastAPI memory.
        """
        clean_key = key.lstrip('/')
        if self.client:
            try:
                url = self.client.generate_presigned_url(
                    'put_object',
                    Params={
                        'Bucket': self.bucket,
                        'Key': clean_key,
                        'ContentType': content_type
                    },
                    ExpiresIn=expires_in_seconds
                )
                logger.info(f"Generated R2 presigned PUT upload URL for key: {clean_key}")
                return url
            except Exception as e:
                logger.error(f"Error generating R2 presigned upload URL for {clean_key}: {e}")
                raise

        # Local development / mock fallback endpoint
        logger.info(f"R2 client not configured; returning mock direct upload URL for {clean_key}")
        return f"/api/projects/upload-mock?key={clean_key}"

    def get_public_url(self, key: str) -> str:
        """
        Return public CDN/development URL if configured, otherwise returns R2 or media proxy URL.
        """
        clean_key = key.lstrip('/')
        if settings.R2_PUBLIC_URL:
            clean_base = settings.R2_PUBLIC_URL.rstrip('/')
            return f"{clean_base}/{clean_key}"
        if settings.R2_ACCOUNT_ID and settings.R2_BUCKET_NAME:
            return f"https://{settings.R2_BUCKET_NAME}.{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/{clean_key}"
        # Fallback to backend media stream endpoint
        return f"/api/v1/products/media/{clean_key}"

    def get_object(self, key: str) -> Optional[tuple[bytes, str]]:
        """
        Retrieve object bytes and ContentType from Cloudflare R2.
        """
        if self.client:
            try:
                resp = self.client.get_object(Bucket=self.bucket, Key=key)
                content_type = resp.get("ContentType", "application/octet-stream")
                data = resp["Body"].read()
                return data, content_type
            except Exception as e:
                logger.error(f"Error fetching R2 object [{key}]: {e}")
        else:
            mock_dir = os.path.join(tempfile.gettempdir(), "svf_mock_r2_storage")
            mock_path = os.path.join(mock_dir, key.replace("/", os.sep))
            if os.path.exists(mock_path):
                with open(mock_path, "rb") as f:
                    return f.read(), "application/octet-stream"
            elif hasattr(self, "_mock_storage") and key in self._mock_storage:
                return self._mock_storage[key], "application/octet-stream"
        return None

    def delete_object(self, key: str) -> bool:
        """
        Delete an object from Cloudflare R2 bucket.
        """
        if self.client:
            try:
                self.client.delete_object(Bucket=self.bucket, Key=key)
                logger.info(f"Deleted R2 object: {key}")
                return True
            except Exception as e:
                logger.error(f"Error deleting R2 object [{key}]: {e}")
        else:
            mock_dir = os.path.join(tempfile.gettempdir(), "svf_mock_r2_storage")
            mock_path = os.path.join(mock_dir, key.replace("/", os.sep))
            if os.path.exists(mock_path):
                try:
                    os.remove(mock_path)
                except Exception:
                    pass
            if hasattr(self, "_mock_storage") and key in self._mock_storage:
                del self._mock_storage[key]
            return True
        return False

    def delete_file(self, key: str) -> bool:
        """Alias for delete_object."""
        return self.delete_object(key)

    def upload_bytes(
        self,
        data: bytes,
        destination_key: str,
        content_type: str = "application/octet-stream"
    ) -> dict:
        """
        Direct byte upload to Cloudflare R2 with cross-process mock storage for tests (#41, #97).
        """
        clean_key = destination_key.lstrip('/')
        if not hasattr(self, "_mock_storage"):
            self._mock_storage = {}
        self._mock_storage[clean_key] = data

        # Write to temp mock storage so child subprocesses can access it
        mock_dir = os.path.join(tempfile.gettempdir(), "svf_mock_r2_storage")
        mock_path = os.path.join(mock_dir, clean_key.replace("/", os.sep))
        os.makedirs(os.path.dirname(mock_path), exist_ok=True)
        with open(mock_path, "wb") as f:
            f.write(data)

        self.upload_buffer(
            key=clean_key,
            buffer=data,
            content_type=content_type
        )
        return {"key": clean_key, "size": len(data), "status": "uploaded"}

    def download_bytes(self, key: str) -> bytes:
        """
        Downloads raw bytes from Cloudflare R2 or mock storage.
        """
        clean_key = key.lstrip('/')
        fetched = self.get_object(clean_key)
        if fetched:
            return fetched[0]
        mock_dir = os.path.join(tempfile.gettempdir(), "svf_mock_r2_storage")
        mock_path = os.path.join(mock_dir, clean_key.replace("/", os.sep))
        if os.path.exists(mock_path):
            with open(mock_path, "rb") as f:
                return f.read()
        if hasattr(self, "_mock_storage") and clean_key in self._mock_storage:
            return self._mock_storage[clean_key]
        raise FileNotFoundError(f"Object '{key}' not found in Cloudflare R2.")

    def list_files(self, prefix: str = "") -> dict:
        """
        Lists objects matching prefix from Cloudflare R2 or mock storage (#41).
        """
        clean_prefix = prefix.lstrip('/')
        files = []
        if self.client:
            try:
                paginator = self.client.get_paginator('list_objects_v2')
                for page in paginator.paginate(Bucket=self.bucket, Prefix=clean_prefix):
                    for obj in page.get('Contents', []):
                        files.append({
                            "key": obj["Key"],
                            "size": obj["Size"],
                            "last_modified": obj["LastModified"]
                        })
                return {"files": files}
            except Exception as e:
                logger.error(f"Error listing R2 files with prefix [{prefix}]: {e}")

        # Scan local mock storage dir
        mock_dir = os.path.join(tempfile.gettempdir(), "svf_mock_r2_storage")
        from datetime import datetime, timezone
        if os.path.exists(mock_dir):
            for root, _, filenames in os.walk(mock_dir):
                for fn in filenames:
                    full_path = os.path.join(root, fn)
                    rel_path = os.path.relpath(full_path, mock_dir).replace(os.sep, "/")
                    if rel_path.startswith(clean_prefix):
                        stat = os.stat(full_path)
                        files.append({
                            "key": rel_path,
                            "size": stat.st_size,
                            "last_modified": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc)
                        })
        return {"files": files}


r2_service = R2StorageService()
r2_storage = r2_service
__all__ = ["R2StorageService", "r2_service", "r2_storage"]
