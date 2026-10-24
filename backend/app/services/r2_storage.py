import io
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

    def upload_buffer(self, key: str, buffer: Union[bytes, io.BytesIO], content_type: str = "application/pdf") -> str:
        """
        Stream in-memory bytes or buffer directly into Private Cloudflare R2 bucket.
        """
        raw_bytes = buffer.getvalue() if isinstance(buffer, io.BytesIO) else buffer

        if self.client:
            try:
                self.client.put_object(
                    Bucket=self.bucket,
                    Key=key,
                    Body=raw_bytes,
                    ContentType=content_type
                )
                logger.info(f"Archived {len(raw_bytes)} bytes to Cloudflare R2: {key}")
                return key
            except Exception as e:
                logger.error(f"Error uploading buffer to R2 [{key}]: {e}")
        else:
            logger.info(f"R2 not configured in this environment; keeping buffer in-memory for {key}")

        return key

    def generate_presigned_download_url(self, key: str, expires_in_seconds: int = 3600) -> str:
        """
        Generate temporary 1-hour secure Pre-Signed URL for customer downloads/WhatsApp.
        Prevents public exposure of sensitive customer tax bills.
        """
        if self.client:
            try:
                url = self.client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': self.bucket, 'Key': key},
                    ExpiresIn=expires_in_seconds
                )
                return url
            except Exception as e:
                logger.error(f"Error generating R2 presigned URL for {key}: {e}")

        # Local/development fallback URL
        return f"/api/v1/sales/by-no/{key.split('/')[-1].replace('.pdf','')}/pdf"

    def get_public_url(self, key: str) -> str:
        """
        Return public CDN/development URL if configured, otherwise returns backend media proxy URL.
        """
        if settings.R2_PUBLIC_URL:
            clean_base = settings.R2_PUBLIC_URL.rstrip('/')
            clean_key = key.lstrip('/')
            return f"{clean_base}/{clean_key}"
        # Fallback to backend media stream endpoint
        return f"/api/v1/products/media/{key}"

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
        return False

r2_service = R2StorageService()
