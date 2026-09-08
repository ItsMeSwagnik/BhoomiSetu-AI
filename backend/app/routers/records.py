from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict
from pydantic import BaseModel
from app.database import get_db
from app.models import LandRecord, Document

router = APIRouter(prefix="/api/records", tags=["records"])


class LandRecordUpdateRequest(BaseModel):
    owner: Optional[str] = None
    co_owner: Optional[str] = None
    share: Optional[str] = None
    khatian_khata: Optional[str] = None
    khasra: Optional[str] = None
    dag: Optional[str] = None
    plot_number: Optional[str] = None
    survey_number: Optional[str] = None
    area: Optional[str] = None
    area_unit: Optional[str] = None
    village: Optional[str] = None
    mouza: Optional[str] = None
    tehsil_taluk: Optional[str] = None
    district: Optional[str] = None
    land_classification: Optional[List[str]] = None
    mutation_number: Optional[str] = None
    mutation_date: Optional[str] = None
    registration_number: Optional[str] = None
    registration_date: Optional[str] = None
    previous_owner: Optional[str] = None
    new_owner: Optional[str] = None
    status: Optional[str] = "verified"


def record_to_dict(r: LandRecord) -> Dict[str, Any]:
    scorecard = r.raw_ocr_response.get("validation_scorecard") if (r.raw_ocr_response and isinstance(r.raw_ocr_response, dict)) else None
    return {
        "id": r.id,
        "documentId": r.document_id,
        "owner": r.owner,
        "coOwner": r.co_owner,
        "share": r.share,
        "khatianKhata": r.khatian_khata,
        "khasra": r.khasra,
        "dag": r.dag,
        "plotNumber": r.plot_number,
        "surveyNumber": r.survey_number,
        "area": r.area,
        "areaUnit": r.area_unit,
        "village": r.village,
        "mouza": r.mouza,
        "tehsilTaluk": r.tehsil_taluk,
        "district": r.district,
        "landClassification": r.land_classification or [],
        "mutationNumber": r.mutation_number,
        "mutationDate": r.mutation_date,
        "registrationNumber": r.registration_number,
        "registrationDate": r.registration_date,
        "previousOwner": r.previous_owner,
        "newOwner": r.new_owner,
        "confidenceScore": r.confidence_score,
        "ocrModelUsed": r.ocr_model_used,
        "isValidated": bool(r.is_validated),
        "rawOcrResponse": r.raw_ocr_response,
        "validationScorecard": scorecard,
        "status": r.status,
        "document": {
            "id": r.document.id,
            "originalFilename": r.document.original_filename,
            "fileUrl": r.document.file_url,
            "status": r.document.status,
        } if r.document else None,
        "createdAt": r.created_at.isoformat() if r.created_at else None,
        "updatedAt": r.updated_at.isoformat() if r.updated_at else None,
    }


@router.get("")
def list_records(
    q: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    is_validated: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(LandRecord).order_by(LandRecord.created_at.desc())
    if district:
        query = query.filter(LandRecord.district.ilike(f"%{district}%"))
    if status:
        query = query.filter(LandRecord.status == status)
    if is_validated is not None:
        query = query.filter(LandRecord.is_validated == is_validated)
    if q:
        query = query.filter(
            (LandRecord.owner.ilike(f"%{q}%")) |
            (LandRecord.khasra.ilike(f"%{q}%")) |
            (LandRecord.plot_number.ilike(f"%{q}%")) |
            (LandRecord.village.ilike(f"%{q}%"))
        )

    records = query.limit(100).all()
    return [record_to_dict(r) for r in records]


@router.get("/{record_id}")
def get_record(record_id: str, db: Session = Depends(get_db)):
    record = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Land record not found")
    return record_to_dict(record)


@router.post("/{record_id}/validate")
def validate_record_against_pdf(record_id: str, db: Session = Depends(get_db)):
    """
    Fetches the source document/PDF (from Firebase or local storage), runs the
    ground-truth validation engine against LLM extraction, updates the `is_validated`
    database column to True (if passed) or False (if failed), and stores the full scorecard.
    """
    record = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Land record not found")

    if not record.document:
        raise HTTPException(status_code=400, detail="Record does not have an associated document")

    import os
    from pathlib import Path
    from app.services.validation import validation_service
    from app.services.storage import storage_service, STORAGE_DIR

    file_bytes = storage_service.get_file_bytes(record.document.file_path, record.document.id)

    if not file_bytes:
        raise HTTPException(status_code=404, detail="Source PDF document could not be retrieved from storage/Firebase")

    # Construct extraction dict to validate
    extracted_data = {
        "owner": record.owner,
        "co_owner": record.co_owner,
        "share": record.share,
        "khatian_khata": record.khatian_khata,
        "khasra": record.khasra,
        "dag": record.dag,
        "plot_number": record.plot_number,
        "survey_number": record.survey_number,
        "area": record.area,
        "area_unit": record.area_unit,
        "village": record.village,
        "mouza": record.mouza,
        "tehsil_taluk": record.tehsil_taluk,
        "district": record.district,
        "land_classification": record.land_classification or ["Agricultural Land"],
        "mutation_number": record.mutation_number,
        "mutation_date": record.mutation_date,
        "registration_number": record.registration_number,
        "registration_date": record.registration_date,
        "previous_owner": record.previous_owner,
        "new_owner": record.new_owner,
        "confidence_score": record.confidence_score or 0.95,
    }

    # Run PDF Ground Truth Cross-Validation
    scorecard = validation_service.validate_against_pdf(
        extracted_data,
        file_bytes,
        record.document.original_filename
    )

    # Pass condition: fidelity >= 70% and no hard discrepancy flags
    fidelity = scorecard.get("overallFidelityScore", 0)
    has_discrepancies = len(scorecard.get("discrepancies", [])) > 0
    passed = (fidelity >= 70.0) and (not has_discrepancies)

    record.is_validated = passed
    raw_ocr = dict(record.raw_ocr_response or {})
    raw_ocr["validation_scorecard"] = scorecard
    record.raw_ocr_response = raw_ocr
    record.confidence_score = round(fidelity / 100.0, 2)

    db.commit()
    db.refresh(record)

    return {
        "success": True,
        "isValidated": record.is_validated,
        "fidelityScore": fidelity,
        "fidelityGrade": scorecard.get("fidelityGrade"),
        "discrepancies": scorecard.get("discrepancies", []),
        "record": record_to_dict(record),
    }


@router.put("/{record_id}")
def update_record(record_id: str, body: LandRecordUpdateRequest, db: Session = Depends(get_db)):
    record = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Land record not found")

    data = body.model_dump(exclude_unset=True)
    for key, val in data.items():
        if hasattr(record, key):
            setattr(record, key, val)

    db.commit()
    db.refresh(record)
    return record_to_dict(record)


@router.delete("/{record_id}")
def delete_record(record_id: str, db: Session = Depends(get_db)):
    record = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Land record not found")

    db.delete(record)
    db.commit()
    return {"success": True, "message": "Record deleted"}
