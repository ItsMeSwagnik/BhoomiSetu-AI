from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    database_url: str = "postgresql://user:pass@localhost:5432/bhoomisetu"
    redis_url: str = "redis://localhost:6379/0"
    storage_backend: str = "local"
    storage_local_path: str = "./storage"
    s3_endpoint_url: Optional[str] = None
    s3_access_key: Optional[str] = None
    s3_secret_key: Optional[str] = None
    s3_bucket: Optional[str] = None
    frontend_url: str = "http://localhost:3000"
    ocr_engine: str = "mock"
    confidence_threshold: float = 0.85
    gis_area_tolerance_percent: float = 10.0
    groq_api_key: Optional[str] = None
    cloudinary_url: Optional[str] = "cloudinary://782446436321221:q5G_FUBhrYVEcdJADvEf2UBJpLI@dgz0zrojz"
    cloudinary_cloud_name: Optional[str] = "dgz0zrojz"
    cloudinary_api_key: Optional[str] = "782446436321221"
    cloudinary_api_secret: Optional[str] = "q5G_FUBhrYVEcdJADvEf2UBJpLI"

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
