from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.database import get_db
from app.models import Document, LandRecord
from app.services.storage import storage_service
from app.services.groq_vision import groq_vision_service

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    cloud_url: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        # 1. Save file to storage / firestore
        file_id, local_path, default_file_url = storage_service.save_file(contents, file.filename)
        effective_file_url = cloud_url or default_file_url

        # 2. Check if this Dalil/Document already exists to guarantee 1 Dalil = 1 Case
        doc = db.query(Document).filter(Document.original_filename == file.filename).first()
        if doc:
            doc.file_path = local_path
            doc.file_url = effective_file_url
            doc.file_size = len(contents)
            doc.mime_type = file.content_type or "application/pdf"
            doc.status = "processing"
        else:
            doc = Document(
                id=file_id,
                filename=os.path.basename(local_path),
                original_filename=file.filename,
                file_path=local_path,
                file_url=effective_file_url,
                file_size=len(contents),
                mime_type=file.content_type or "application/pdf",
                status="processing"
            )
            db.add(doc)
        db.commit()
        db.refresh(doc)

        # 3. Run Groq Vision OCR & Post-Extraction Validation
        extracted_data = await groq_vision_service.extract_land_record(contents, file.filename)

        # 4. Save or Update Single Extracted Land Record for this Dalil
        record = db.query(LandRecord).filter(LandRecord.document_id == doc.id).first()
        if not record:
            record = LandRecord(document_id=doc.id)
            db.add(record)

        record.owner = extracted_data.get("owner")
        record.co_owner = extracted_data.get("co_owner")
        record.share = extracted_data.get("share")
        record.khatian_khata = extracted_data.get("khatian_khata")
        record.khasra = extracted_data.get("khasra")
        record.dag = extracted_data.get("dag")
        record.plot_number = extracted_data.get("plot_number")
        record.survey_number = extracted_data.get("survey_number")
        record.area = str(extracted_data.get("area")) if extracted_data.get("area") is not None else None
        record.area_unit = extracted_data.get("area_unit")
        record.village = extracted_data.get("village")
        record.mouza = extracted_data.get("mouza")
        record.tehsil_taluk = extracted_data.get("tehsil_taluk")
        record.district = extracted_data.get("district")
        record.land_classification = extracted_data.get("land_classification") or ["Agricultural Land"]
        record.mutation_number = extracted_data.get("mutation_number")
        record.mutation_date = str(extracted_data.get("mutation_date")) if extracted_data.get("mutation_date") else None
        record.registration_number = extracted_data.get("registration_number")
        record.registration_date = str(extracted_data.get("registration_date")) if extracted_data.get("registration_date") else None
        record.previous_owner = extracted_data.get("previous_owner")
        record.new_owner = extracted_data.get("new_owner")
        record.raw_ocr_response = extracted_data
        record.confidence_score = extracted_data.get("confidence_score", 0.95)
        record.ocr_model_used = extracted_data.get("ocr_model_used", "groq-vision")
        record.status = "extracted"
        
        doc.status = "extracted"
        db.commit()
        db.refresh(record)
        db.refresh(doc)

        return {
            "success": True,
            "document": {
                "id": doc.id,
                "originalFilename": doc.original_filename,
                "fileUrl": doc.file_url,
                "status": doc.status,
                "createdAt": doc.created_at.isoformat() if doc.created_at else None,
            },
            "record": {
                "id": record.id,
                "documentId": record.document_id,
                "owner": record.owner,
                "coOwner": record.co_owner,
                "share": record.share,
                "khatianKhata": record.khatian_khata,
                "khasra": record.khasra,
                "dag": record.dag,
                "plotNumber": record.plot_number,
                "surveyNumber": record.survey_number,
                "area": record.area,
                "areaUnit": record.area_unit,
                "village": record.village,
                "mouza": record.mouza,
                "tehsilTaluk": record.tehsil_taluk,
                "district": record.district,
                "landClassification": record.land_classification,
                "mutationNumber": record.mutation_number,
                "mutationDate": record.mutation_date,
                "registrationNumber": record.registration_number,
                "registrationDate": record.registration_date,
                "previousOwner": record.previous_owner,
                "newOwner": record.new_owner,
                "confidenceScore": record.confidence_score,
                "ocrModelUsed": record.ocr_model_used,
                "status": record.status,
                "createdAt": record.created_at.isoformat() if record.created_at else None,
            }
        }
    except Exception as e:
        db.rollback()
        print(f"[Upload] Error processing document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
def list_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.created_at.desc()).limit(100).all()
    results = []
    for d in docs:
        first_record = d.records[0] if d.records else None
        results.append({
            "id": d.id,
            "originalFilename": d.original_filename,
            "fileUrl": d.file_url,
            "fileSize": d.file_size,
            "status": d.status,
            "errorMessage": d.error_message,
            "district": first_record.district if first_record else "Unknown",
            "khasra": first_record.khasra if first_record else None,
            "owner": first_record.owner if first_record else None,
            "recordId": first_record.id if first_record else None,
            "createdAt": d.created_at.isoformat() if d.created_at else None,
        })
    return results


@router.get("/{doc_id}/file")
def get_document_file(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        doc.file_path,
        media_type=doc.mime_type or "application/pdf",
        content_disposition_type="inline",
        headers={"Content-Disposition": f'inline; filename="{doc.original_filename}"'}
    )


@router.get("/{doc_id}/pages")
def get_document_pages(doc_id: str, db: Session = Depends(get_db)):
    """Renders all PDF pages as base64 images for interactive in-browser document viewer."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document file not found")

    import fitz
    import base64

    pages = []
    try:
        pdf_doc = fitz.open(doc.file_path)
        for page in pdf_doc:
            pix = page.get_pixmap(dpi=150)
            b64 = base64.b64encode(pix.tobytes("png")).decode("utf-8")
            pages.append(f"data:image/png;base64,{b64}")
        pdf_doc.close()
    except Exception as e:
        # Fallback if image file
        with open(doc.file_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
            pages.append(f"data:image/jpeg;base64,{b64}")

    return {
        "documentId": doc.id,
        "filename": doc.original_filename,
        "totalPages": len(pages),
        "pages": pages,
    }


@router.post("/{doc_id}/reprocess")
async def reprocess_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document file not found")

    with open(doc.file_path, "rb") as f:
        contents = f.read()

    doc.status = "processing"
    db.commit()

    extracted_data = await groq_vision_service.extract_land_record(contents, doc.original_filename)

    record = db.query(LandRecord).filter(LandRecord.document_id == doc.id).first()
    if not record:
        record = LandRecord(document_id=doc.id)
        db.add(record)

    record.owner = extracted_data.get("owner")
    record.co_owner = extracted_data.get("co_owner")
    record.share = extracted_data.get("share")
    record.khatian_khata = extracted_data.get("khatian_khata")
    record.khasra = extracted_data.get("khasra")
    record.dag = extracted_data.get("dag")
    record.plot_number = extracted_data.get("plot_number")
    record.survey_number = extracted_data.get("survey_number")
    record.area = str(extracted_data.get("area")) if extracted_data.get("area") is not None else None
    record.area_unit = extracted_data.get("area_unit")
    record.village = extracted_data.get("village")
    record.mouza = extracted_data.get("mouza")
    record.tehsil_taluk = extracted_data.get("tehsil_taluk")
    record.district = extracted_data.get("district")
    record.land_classification = extracted_data.get("land_classification") or ["Agricultural Land"]
    record.mutation_number = extracted_data.get("mutation_number")
    record.mutation_date = str(extracted_data.get("mutation_date")) if extracted_data.get("mutation_date") else None
    record.registration_number = extracted_data.get("registration_number")
    record.registration_date = str(extracted_data.get("registration_date")) if extracted_data.get("registration_date") else None
    record.previous_owner = extracted_data.get("previous_owner")
    record.new_owner = extracted_data.get("new_owner")
    record.raw_ocr_response = extracted_data
    record.confidence_score = extracted_data.get("confidence_score", 0.95)
    record.ocr_model_used = extracted_data.get("ocr_model_used", "groq-vision")
    record.status = "extracted"

    doc.status = "extracted"
    db.commit()

    return {"success": True, "recordId": record.id}
