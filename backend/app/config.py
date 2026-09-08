from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    database_url: str = "postgresql://user:pass@localhost:5432/bhoomisetu"
    redis_url: str = "redis://localhost:6379/0"
    firebase_project_id: str = ""
    firebase_service_account_json: str = ""
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

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
