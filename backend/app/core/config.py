import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Shree Vinayaka Furnitures API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Railway provides DATABASE_URL. If absent, fallback to local SQLite for smooth dev experience.
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./furnitures.db")
    
    # Railway passes PORT environment variable (e.g. 8080 or random port)
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Allowed CORS Origins - Locked strictly to Cloudflare Pages & local dev (#42)
    CORS_ORIGINS: Union[List[str], str] = os.getenv(
        "CORS_ORIGINS",
        "https://srivinayakafurnitures.pages.dev,http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
    )

    # Internal API Secret for protecting sensitive administrative operations
    INTERNAL_API_SECRET: str = os.getenv("INTERNAL_API_SECRET", "")

    # JWT Authentication & RBAC Configuration (#47, #48)
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "svf-production-jwt-signing-secret-key-32bytes-min")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")) # 30 mins
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7")) # 7 days

    # Backup & Disaster Recovery Encryption Key (#41, #97)
    BACKUP_ENCRYPTION_KEY: str = os.getenv("BACKUP_ENCRYPTION_KEY", "svf-secure-backup-encryption-key-2026")

    # SSRF Whitelisted Outbound Domains (#44)
    ALLOWED_OUTBOUND_DOMAINS: List[str] = [
        "decentro.tech",
        "in.decentro.tech",
        "staging.decentro.tech",
        "r2.cloudflarestorage.com"
    ]

    @property
    def get_database_url(self) -> str:
        # Railway Postgres connection string normalization
        url = self.DATABASE_URL
        # Determine installed driver: prioritize psycopg2, fallback to psycopg
        try:
            import psycopg2  # type: ignore
            driver = "postgresql+psycopg2://"
        except ImportError:
            driver = "postgresql+psycopg://"

        if url.startswith("postgres://"):
            url = url.replace("postgres://", driver, 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
            url = url.replace("postgresql://", driver, 1)
        return url

    @property
    def get_async_database_url(self) -> str:
        import re
        url = self.DATABASE_URL
        if url.startswith("sqlite"):
            if not url.startswith("sqlite+aiosqlite://"):
                return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
            return url
        # Railway Postgres connection string normalization for asyncpg
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif "psycopg" in url:
            return re.sub(r"postgresql\+[a-zA-Z0-9_]+://", "postgresql+asyncpg://", url)
        return url

    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    # SMTP Email Configuration
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_TLS: bool = os.getenv("SMTP_TLS", "True").lower() in ("true", "1", "yes")
    SMTP_SSL: bool = os.getenv("SMTP_SSL", "False").lower() in ("true", "1", "yes")
    SMTP_DEFAULT_FROM: str = os.getenv("SMTP_DEFAULT_FROM", "shreevinayakafurnitures@gmail.com")
    SMTP_SENDER_NAME: str = os.getenv("SMTP_SENDER_NAME", "Shree Vinayaka Furnitures")

    # Cloudflare R2 Object Storage Configuration (Private Archival & Pre-Signed URLs)
    R2_ACCOUNT_ID: str = os.getenv("R2_ACCOUNT_ID", "")
    R2_ACCESS_KEY_ID: str = os.getenv("R2_ACCESS_KEY_ID", "")
    R2_SECRET_ACCESS_KEY: str = os.getenv("R2_SECRET_ACCESS_KEY", "")
    R2_BUCKET_NAME: str = os.getenv("R2_BUCKET_NAME", "svf-store-backups")
    R2_PUBLIC_URL: str = os.getenv("R2_PUBLIC_URL", "") # e.g. "https://pub-xxxx.r2.dev" or "https://images.shreevinayakafurnitures.com"

    # Real-Time Production Monitoring (Sentry)
    SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
