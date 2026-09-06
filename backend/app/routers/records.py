from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import LandRecord, RecordStatus, User, UserRole, AuditLog, ExtractedField
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/records", tags=["records"])

PUBLIC_FIELDS = {"id", "owner", "plot_number", "khatian_number", "village", "district",
                 "area", "area_unit", "land_classification", "status"}


@router.get("")
async def list_records(
    owner: Optional[str] = None,
    village: Optional[str] = None,
    district: Optional[str] = None,
    tehsil: Optional[str] = None,
    khasra: Optional[str] = None,
    khatian: Optional[str] = None,
    plot_number: Optional[str] = None,
    mutation_number: Optional[str] = None,
    registration_number: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(LandRecord)

    # Citizens only see verified records
    if current_user.role == UserRole.citizen:
        q = q.filter(LandRecord.status == RecordStatus.verified)
    elif status:
        q = q.filter(LandRecord.status == status)

    if owner:
        q = q.filter(LandRecord.owner.ilike(f"%{owner}%"))
    if village:
        q = q.filter(LandRecord.village.ilike(f"%{village}%"))
    if district:
        q = q.filter(LandRecord.district.ilike(f"%{district}%"))
    if tehsil:
        q = q.filter(LandRecord.tehsil.ilike(f"%{tehsil}%"))
    if khasra:
        q = q.filter(LandRecord.khasra_number == khasra)
    if khatian:
        q = q.filter(LandRecord.khatian_number == khatian)
    if plot_number:
        q = q.filter(LandRecord.plot_number == plot_number)
    if mutation_number:
        q = q.filter(LandRecord.mutation_number == mutation_number)
    if registration_number:
        q = q.filter(LandRecord.registration_number == registration_number)

    records = q.order_by(LandRecord.created_at.desc()).limit(100).all()
    return [_record_out(r, current_user.role) for r in records]


@router.get("/{record_id}")
async def get_record(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    if current_user.role == UserRole.citizen and record.status != RecordStatus.verified:
        raise HTTPException(status_code=403, detail="Record not publicly available")
    return _record_out(record, current_user.role, include_fields=True)


@router.patch("/{record_id}")
async def patch_record(
    record_id: str,
    body: dict,
    current_user: User = Depends(require_roles([UserRole.verifier, UserRole.admin])),
    db: Session = Depends(get_db),
):
    record = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    allowed = {"owner", "co_owner", "area", "village", "district", "land_classification",
               "khatian_number", "khasra_number", "plot_number"}
    for key, val in body.items():
        if key in allowed:
            old = getattr(record, key)
            setattr(record, key, val)
            db.add(AuditLog(
                record_id=record.id, user_id=current_user.id,
                action="field_corrected", field_changed=key,
                old_value=str(old), new_value=str(val),
            ))
    db.commit()
    return _record_out(record, current_user.role)


@router.get("/{record_id}/history")
async def get_record_history(
    record_id: str,
    current_user: User = Depends(require_roles([UserRole.admin, UserRole.auditor])),
    db: Session = Depends(get_db),
):
    logs = db.query(AuditLog).filter(AuditLog.record_id == record_id).order_by(AuditLog.timestamp.desc()).all()
    return [_audit_out(l) for l in logs]


@router.get("/{record_id}/entity-matches")
async def get_entity_matches(
    record_id: str,
    current_user: User = Depends(require_roles([UserRole.verifier, UserRole.approving_officer, UserRole.admin])),
    db: Session = Depends(get_db),
):
    """Return probable duplicate entity matches for the owner of this record (step 9)."""
    record = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not record or not record.owner:
        raise HTTPException(status_code=404, detail="Record not found or has no owner")
    try:
        from rapidfuzz import fuzz
    except ImportError:
        raise HTTPException(status_code=501, detail="rapidfuzz not installed")

    candidates = (
        db.query(LandRecord)
        .filter(LandRecord.id != record.id, LandRecord.owner.isnot(None))
        .distinct(LandRecord.owner)
        .limit(300)
        .all()
    )
    matches = []
    for c in candidates:
        score = fuzz.token_sort_ratio(record.owner, c.owner)
        if score >= 75:
            matches.append({
                "matchedRecordId": str(c.id),
                "matchedOwner": c.owner,
                "similarity": score,
                "village": c.village,
                "district": c.district,
                "sameVillage": c.village == record.village,
                "confidence": "high" if score >= 90 else "medium",
            })
    matches.sort(key=lambda x: x["similarity"], reverse=True)
    return {"owner": record.owner, "matches": matches[:20]}


def _record_out(record: LandRecord, role: UserRole, include_fields: bool = False) -> dict:
    base = {
        "id": str(record.id),
        "owner": record.owner,
        "plotNumber": record.plot_number,
        "khatianNumber": record.khatian_number,
        "khasraNumber": record.khasra_number,
        "village": record.village,
        "district": record.district,
        "area": record.area,
        "areaUnit": record.area_unit,
        "landClassification": record.land_classification,
        "status": record.status.value if record.status else None,
    }
    if role != UserRole.citizen:
        base.update({
            "coOwner": record.co_owner,
            "ownerShare": record.owner_share,
            "tehsil": record.tehsil,
            "state": record.state,
            "mutationNumber": record.mutation_number,
            "mutationDate": record.mutation_date,
            "registrationNumber": record.registration_number,
            "registrationDate": record.registration_date,
            "previousOwner": record.previous_owner,
            "confidenceScore": record.confidence_score,
            "parcelId": str(record.parcel_id) if record.parcel_id else None,
            "documentId": str(record.document_id),
            "createdAt": record.created_at.isoformat() if record.created_at else None,
        })
    if include_fields and role not in (UserRole.citizen,):
        base["extractedFields"] = [
            {
                "id": str(f.id),
                "fieldName": f.field_name,
                "extractedValue": f.extracted_value,
                "originalLabel": f.original_label,
                "confidence": f.confidence,
                "bbox": f.bbox,
                "pageNumber": f.page_number,
                "isCorrected": f.is_corrected,
                "correctedValue": f.corrected_value,
            }
            for f in record.extracted_fields
        ]
        base["validationResults"] = [
            {
                "type": v.validation_type.value if hasattr(v.validation_type, 'value') else v.validation_type,
                "status": v.status,
                "message": v.message,
            }
            for v in record.validation_results
        ]
    return base


def _audit_out(log: AuditLog) -> dict:
    return {
        "id": str(log.id),
        "action": log.action,
        "fieldChanged": log.field_changed,
        "oldValue": log.old_value,
        "newValue": log.new_value,
        "reason": log.reason,
        "timestamp": log.timestamp.isoformat() if log.timestamp else None,
        "userId": str(log.user_id),
    }
