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
        "rawOcrResponse": r.raw_ocr_response,
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
    db: Session = Depends(get_db)
):
    query = db.query(LandRecord).order_by(LandRecord.created_at.desc())
    if district:
        query = query.filter(LandRecord.district.ilike(f"%{district}%"))
    if status:
        query = query.filter(LandRecord.status == status)
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
