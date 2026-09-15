import os
import uuid
from pathlib import Path
from typing import Tuple, Optional, Dict, Any
from app.config import settings

# Setup local storage dir with serverless /tmp fallback
def _resolve_storage_dir() -> Path:
    candidates = [
        Path(settings.storage_local_path) / "documents",
        Path("/tmp") / "storage" / "documents",
    ]
    for p in candidates:
        try:
            p.mkdir(parents=True, exist_ok=True)
            return p
        except Exception:
            continue
    return Path("/tmp")

STORAGE_DIR = _resolve_storage_dir()

# Cloudinary state
_cloudinary_initialized = False


def init_cloudinary() -> bool:
    global _cloudinary_initialized
    if _cloudinary_initialized:
        return True

    try:
        import cloudinary
        import cloudinary.uploader
        import cloudinary.api

        c_url = getattr(settings, "cloudinary_url", None) or os.getenv("CLOUDINARY_URL")
        cloud_name = (
            getattr(settings, "cloudinary_cloud_name", None)
            or os.getenv("CLOUDINARY_CLOUD_NAME")
            or "dgz0zrojz"
        )
        api_key = (
            getattr(settings, "cloudinary_api_key", None)
            or os.getenv("CLOUDINARY_API_KEY")
            or "782446436321221"
        )
        api_secret = (
            getattr(settings, "cloudinary_api_secret", None)
            or os.getenv("CLOUDINARY_API_SECRET")
            or "q5G_FUBhrYVEcdJADvEf2UBJpLI"
        )

        if c_url:
            os.environ["CLOUDINARY_URL"] = c_url
            try:
                from urllib.parse import urlparse
                parsed = urlparse(c_url)
                if parsed.username:
                    api_key = parsed.username
                if parsed.password:
                    api_secret = parsed.password
                if parsed.hostname:
                    cloud_name = parsed.hostname
            except Exception:
                pass

        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True,
        )
        _cloudinary_initialized = True
        return True
    except Exception as e:
        print(f"[Storage] Cloudinary init notice: {e}")
        return False


class StorageService:
    @staticmethod
    def save_file(file_bytes: bytes, original_filename: str) -> Tuple[str, str, str]:
        """
        Saves file locally for immediate fast processing and synchronizes to Cloudinary CDN.
        Returns: (file_id, local_path, file_url)
        """
        file_id = str(uuid.uuid4())
        ext = Path(original_filename).suffix or ".pdf"
        stored_filename = f"{file_id}{ext}"
        local_path = STORAGE_DIR / stored_filename

        try:
            with open(local_path, "wb") as f:
                f.write(file_bytes)
        except Exception as write_err:
            print(f"[Storage] Local write error: {write_err}")

        # Default local endpoint
        file_url = f"/api/documents/{file_id}/file"

        # Upload to Cloudinary
        try:
            if init_cloudinary():
                import cloudinary.uploader

                clean_name = Path(original_filename).stem.replace(" ", "_")
                public_id = f"bhoomisetu_documents/{file_id}_{clean_name}"

                res = cloudinary.uploader.upload(
                    file_bytes,
                    resource_type="raw",
                    public_id=public_id,
                    overwrite=True,
                    use_filename=True,
                    unique_filename=False,
                )
                cloud_url = res.get("secure_url") or res.get("url")
                if cloud_url:
                    file_url = cloud_url
                    print(f"[Storage] Cloudinary upload successful: {file_url}")
        except Exception as c_err:
            print(f"[Storage] Cloudinary upload notice (fallback to local): {c_err}")

        return file_id, str(local_path), file_url

    @staticmethod
    def get_file_bytes(
        file_path: Optional[str] = None,
        file_id: Optional[str] = None,
        file_url: Optional[str] = None,
    ) -> Optional[bytes]:
        """
        Retrieves file bytes from local disk, or dynamically downloads from Cloudinary CDN
        if running in a stateless serverless environment where local disk was cleared.
        """
        # 1. Direct path check
        if file_path:
            p = Path(file_path)
            candidates = [
                p,
                STORAGE_DIR / p.name,
                Path("storage/documents") / p.name,
                Path("/tmp/storage/documents") / p.name,
            ]
            for cand in candidates:
                if cand.exists() and cand.is_file():
                    try:
                        with open(cand, "rb") as f:
                            return f.read()
                    except Exception as read_err:
                        print(f"[Storage] Error reading {cand}: {read_err}")

        # 2. File ID check with known extensions
        if file_id:
            for ext in [".png", ".pdf", ".jpg", ".jpeg", ".tiff", ".webp", ""]:
                cand = STORAGE_DIR / f"{file_id}{ext}"
                if cand.exists() and cand.is_file():
                    try:
                        with open(cand, "rb") as f:
                            return f.read()
                    except Exception as read_err:
                        print(f"[Storage] Error reading {cand}: {read_err}")

            # Glob search for any matching file_id prefix in STORAGE_DIR
            try:
                matches = list(STORAGE_DIR.glob(f"{file_id}*"))
                for cand in matches:
                    if cand.is_file():
                        with open(cand, "rb") as f:
                            return f.read()
            except Exception:
                pass

        # Fallback: Download from Cloudinary URL if available
        try:
            target_url = None
            if file_url and (file_url.startswith("http://") or file_url.startswith("https://")):
                target_url = file_url
            elif init_cloudinary():
                cloud_name = (
                    getattr(settings, "cloudinary_cloud_name", None)
                    or os.getenv("CLOUDINARY_CLOUD_NAME")
                    or "dgz0zrojz"
                )
                if file_id:
                    clean_name = path.stem.replace(" ", "_")
                    target_url = f"https://res.cloudinary.com/{cloud_name}/raw/upload/bhoomisetu_documents/{file_id}_{clean_name}{path.suffix}"

            if target_url:
                import httpx
                resp = httpx.get(target_url, timeout=30.0, follow_redirects=True)
                if resp.status_code == 200 and resp.content:
                    try:
                        local_cache = STORAGE_DIR / filename
                        with open(local_cache, "wb") as f:
                            f.write(resp.content)
                    except Exception:
                        pass
                    return resp.content
        except Exception as c_err:
            print(f"[Storage] Cloudinary download error: {c_err}")

        return None

    @staticmethod
    def test_status() -> Dict[str, Any]:
        """Diagnostic function for checking storage health."""
        c_ready = init_cloudinary()
        local_writable = os.access(str(STORAGE_DIR), os.W_OK)
        cloud_name = (
            getattr(settings, "cloudinary_cloud_name", None)
            or os.getenv("CLOUDINARY_CLOUD_NAME")
            or "dgz0zrojz"
        )
        return {
            "local_storage": {
                "path": str(STORAGE_DIR.resolve()),
                "writable": local_writable,
                "status": "ready" if local_writable else "error",
            },
            "cloudinary": {
                "cloud_name": cloud_name,
                "ready": c_ready,
                "mode": "cloudinary" if c_ready else "local-fallback",
            },
        }


storage_service = StorageService()
