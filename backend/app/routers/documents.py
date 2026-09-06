from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import Document, DocumentStatus, DocumentType, User, UserRole
from app.auth import get_current_user, require_roles
from app.services.storage import get_storage

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/tiff", "image/jpg"}
ALLOWED_EXTS = {".pdf", ".jpg", ".jpeg", ".png", ".tiff", ".tif"}


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = "other",
    village: Optional[str] = None,
    district: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.data_operator, UserRole.admin])),
    db: Session = Depends(get_db),
):
    from pathlib import Path
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    storage = get_storage()
    path = await storage.save(file, subfolder="documents")

    doc_type_map = {
        "ror": DocumentType.ror, "khatian": DocumentType.khatian,
        "mutation_record": DocumentType.mutation_record,
        "registration_record": DocumentType.registration_record,
        "cadastral_map": DocumentType.cadastral_map,
    }

    doc = Document(
        uploaded_by=current_user.id,
        file_path=path,
        original_filename=file.filename or "unknown",
        file_type=ext.lstrip("."),
        document_type=doc_type_map.get(document_type, DocumentType.other),
        status=DocumentStatus.queued,
        village=village,
        district=district,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Enqueue processing — fall back to inline if Celery/Redis unavailable
    try:
        from app.tasks import process_document
        process_document.delay(str(doc.id))
    except Exception:
        try:
            from app.tasks import process_document
            process_document.run(str(doc.id))
        except Exception:
            pass

    return _doc_out(doc)


@router.get("")
async def list_documents(
    status: Optional[str] = None,
    document_type: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.data_operator, UserRole.admin])),
    db: Session = Depends(get_db),
):
    q = db.query(Document)
    if current_user.role == UserRole.data_operator:
        q = q.filter(Document.uploaded_by == current_user.id)
    if status:
        q = q.filter(Document.status == status)
    if document_type:
        q = q.filter(Document.document_type == document_type)
    docs = q.order_by(Document.uploaded_at.desc()).limit(100).all()
    return [_doc_out(d) for d in docs]


@router.get("/{doc_id}")
async def get_document(
    doc_id: str,
    current_user: User = Depends(require_roles([UserRole.data_operator, UserRole.admin])),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return _doc_out(doc)


@router.post("/{doc_id}/reprocess")
async def reprocess_document(
    doc_id: str,
    current_user: User = Depends(require_roles([UserRole.data_operator, UserRole.admin])),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.status = DocumentStatus.queued
    doc.error_message = None
    db.commit()
    try:
        from app.tasks import process_document
        process_document.delay(str(doc.id))
    except Exception:
        pass
    return {"message": "Reprocessing queued"}


def _doc_out(doc: Document) -> dict:
    storage = get_storage()
    return {
        "id": str(doc.id),
        "originalFilename": doc.original_filename,
        "fileType": doc.file_type,
        "documentType": doc.document_type.value if doc.document_type else None,
        "status": doc.status.value if doc.status else None,
        "village": doc.village,
        "district": doc.district,
        "uploadedAt": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
        "processedAt": doc.processed_at.isoformat() if doc.processed_at else None,
        "fileUrl": storage.get_url(doc.file_path),
        "errorMessage": doc.error_message,
        "pages": len(doc.ocr_results) if doc.ocr_results else None,
    }
