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
    
    # Allowed CORS Origins (supports local dev and Cloudflare Pages)
    CORS_ORIGINS: Union[List[str], str] = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,https://*.pages.dev"
    )

    @property
    def get_database_url(self) -> str:
        # Railway Postgres connection string compatibility fix:
        # SQLAlchemy 2.0+ uses psycopg (v3) with 'postgresql+psycopg://'
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url

    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
