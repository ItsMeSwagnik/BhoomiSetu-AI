"""Storage backend abstraction."""
import os
import uuid
from pathlib import Path
from typing import Protocol, runtime_checkable
from fastapi import UploadFile
from app.config import settings


@runtime_checkable
class StorageBackend(Protocol):
    async def save(self, file: UploadFile, subfolder: str = "") -> str: ...
    def get_url(self, path: str) -> str: ...
    def delete(self, path: str) -> None: ...


class LocalStorageBackend:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    async def save(self, file: UploadFile, subfolder: str = "") -> str:
        dest_dir = self.base_path / subfolder
        dest_dir.mkdir(parents=True, exist_ok=True)
        ext = Path(file.filename or "file").suffix
        filename = f"{uuid.uuid4()}{ext}"
        dest = dest_dir / filename
        content = await file.read()
        dest.write_bytes(content)
        return str(dest.relative_to(self.base_path))

    def get_url(self, path: str) -> str:
        # Normalise to forward slashes for URLs regardless of OS
        url_path = path.replace("\\", "/")
        return f"/api/v1/files/{url_path}"

    def delete(self, path: str) -> None:
        target = self.base_path / path
        if target.exists():
            target.unlink()


def get_storage() -> StorageBackend:
    if settings.storage_backend == "s3":
        raise NotImplementedError("S3 backend not configured yet")
    return LocalStorageBackend(settings.storage_local_path)
