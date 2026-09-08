import os
import uuid
from pathlib import Path
from typing import Tuple, Optional, Dict, Any
from app.config import settings

# Setup local storage dir
STORAGE_DIR = Path(settings.storage_local_path) / "documents"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

# Firebase / Firestore / Cloud Storage state
_firestore_db = None
_firebase_bucket = None
_firebase_initialized = False


def init_firebase():
    global _firestore_db, _firebase_bucket, _firebase_initialized
    if _firebase_initialized:
        return _firestore_db, _firebase_bucket

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore, storage

        if not firebase_admin._apps:
            cred = None
            if settings.firebase_service_account_json:
                import json
                import base64
                try:
                    # Check if base64 encoded
                    decoded = base64.b64decode(settings.firebase_service_account_json).decode("utf-8")
                    cred_dict = json.loads(decoded)
                    cred = credentials.Certificate(cred_dict)
                except Exception:
                    cred_dict = json.loads(settings.firebase_service_account_json)
                    cred = credentials.Certificate(cred_dict)
            
            if cred:
                project_id = settings.firebase_project_id or "bhoomisetu-ai"
                bucket_name = getattr(settings, "firebase_storage_bucket", f"{project_id}.appspot.com")
                firebase_admin.initialize_app(cred, {
                    "projectId": project_id,
                    "storageBucket": bucket_name
                })
            else:
                _firebase_initialized = True
                return None, None

        try:
            _firestore_db = firestore.client()
        except Exception:
            _firestore_db = None

        try:
            _firebase_bucket = storage.bucket()
        except Exception:
            _firebase_bucket = None

        _firebase_initialized = True
        return _firestore_db, _firebase_bucket
    except Exception as e:
        print(f"[Storage] Firebase notice (local fallback active): {e}")
        _firebase_initialized = True
        return None, None


class StorageService:
    @staticmethod
    def save_file(file_bytes: bytes, original_filename: str) -> Tuple[str, str, str]:
        """
        Saves file locally and synchronizes metadata + file to Firebase / Firestore if credentials are provided.
        Returns: (file_id, file_path, file_url)
        """
        file_id = str(uuid.uuid4())
        ext = Path(original_filename).suffix or ".pdf"
        stored_filename = f"{file_id}{ext}"
        local_path = STORAGE_DIR / stored_filename

        with open(local_path, "wb") as f:
            f.write(file_bytes)

        file_url = f"/api/documents/{file_id}/file"

        # Sync to Firebase Storage & Firestore if configured
        try:
            db, bucket = init_firebase()
            firebase_storage_url = None

            if bucket:
                try:
                    blob = bucket.blob(f"documents/{stored_filename}")
                    blob.upload_from_string(file_bytes, content_type="application/pdf")
                    blob.make_public()
                    firebase_storage_url = blob.public_url
                except Exception as b_err:
                    print(f"[Storage] Firebase Storage blob upload notice: {b_err}")

            if db:
                from firebase_admin import firestore
                doc_ref = db.collection("land_records_documents").document(file_id)
                doc_ref.set({
                    "id": file_id,
                    "originalFilename": original_filename,
                    "storedFilename": stored_filename,
                    "sizeBytes": len(file_bytes),
                    "firebaseStorageUrl": firebase_storage_url,
                    "createdAt": firestore.SERVER_TIMESTAMP,
                })
        except Exception as e:
            print(f"[Storage] Firebase sync notice: {e}")

        return file_id, str(local_path), file_url

    @staticmethod
    def get_file_bytes(file_path: str) -> Optional[bytes]:
        path = Path(file_path)
        if path.exists():
            with open(path, "rb") as f:
                return f.read()
        return None

    @staticmethod
    def test_status() -> Dict[str, Any]:
        """Diagnostic function for checking storage health."""
        db, bucket = init_firebase()
        local_writable = os.access(str(STORAGE_DIR), os.W_OK)
        return {
            "local_storage": {
                "path": str(STORAGE_DIR.resolve()),
                "writable": local_writable,
                "status": "ready" if local_writable else "error"
            },
            "firebase": {
                "firestore_ready": db is not None,
                "cloud_storage_ready": bucket is not None,
                "project_id": settings.firebase_project_id or "bhoomisetu-ai",
                "mode": "firebase-cloud" if (db or bucket) else "local-fallback"
            }
        }


storage_service = StorageService()
