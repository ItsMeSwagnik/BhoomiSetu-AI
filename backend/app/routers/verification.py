from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.models import (
    LandRecord, RecordStatus, ExtractedField, User, UserRole,
    AuditLog, Notification
)
from app.auth import require_roles
from app.routers.records import _record_out

router = APIRouter(prefix="/verification", tags=["verification"])


@router.get("/queue")
async def get_verification_queue(
    current_user: User = Depends(require_roles([UserRole.verifier, UserRole.admin])),
    db: Session = Depends(get_db),
):
    records = (
        db.query(LandRecord)
        .filter(LandRecord.status.in_([RecordStatus.flagged, RecordStatus.in_verification]))
        .order_by(LandRecord.created_at.desc())
        .limit(50)
        .all()
    )
    return [_record_out(r, current_user.role) for r in records]


@router.get("/{record_id}")
async def get_verification_detail(
    record_id: str,
    current_user: User = Depends(require_roles([UserRole.verifier, UserRole.admin])),
    db: Session = Depends(get_db),
):
    record = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    from app.services.storage import get_storage
    storage = get_storage()
    doc_url = storage.get_url(record.document.file_path) if record.document else None
    out = _record_out(record, current_user.role, include_fields=True)
    out["documentUrl"] = doc_url
    return out


class FieldCorrection(BaseModel):
    fieldId: str
    correctedValue: str
    reason: Optional[str] = None


class VerificationSubmit(BaseModel):
    corrections: list[FieldCorrection] = []
    reason: Optional[str] = None


@router.post("/{record_id}/submit")
async def submit_verification(
    record_id: str,
    body: VerificationSubmit,
    current_user: User = Depends(require_roles([UserRole.verifier, UserRole.admin])),
    db: Session = Depends(get_db),
):
    record = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    for correction in body.corrections:
        field = db.query(ExtractedField).filter(ExtractedField.id == correction.fieldId).first()
        if field:
            field.is_corrected = True
            field.corrected_value = correction.correctedValue
            field.corrected_by = current_user.id
            field.corrected_at = datetime.utcnow()
            # Also update the record field
            if hasattr(record, field.field_name):
                old_val = getattr(record, field.field_name)
                setattr(record, field.field_name, correction.correctedValue)
                db.add(AuditLog(
                    record_id=record.id, user_id=current_user.id,
                    action="field_corrected", field_changed=field.field_name,
                    old_value=str(old_val), new_value=correction.correctedValue,
                    reason=correction.reason,
                ))

    record.status = RecordStatus.pending_approval
    db.add(AuditLog(
        record_id=record.id, user_id=current_user.id,
        action="verification_submitted", reason=body.reason,
    ))

    # Notify officers
    officers = db.query(User).filter(User.role == UserRole.approving_officer).all()
    for o in officers:
        db.add(Notification(
            user_id=o.id,
            message=f"Record verified and ready for approval: {record.owner or 'Unknown'} — {record.village or 'Unknown'}",
            type="approval_required",
        ))

    db.commit()
    return {"message": "Verification submitted", "status": "pending_approval"}


@router.post("/{record_id}/save-draft")
async def save_draft(
    record_id: str,
    body: VerificationSubmit,
    current_user: User = Depends(require_roles([UserRole.verifier, UserRole.admin])),
    db: Session = Depends(get_db),
):
    record = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    record.status = RecordStatus.in_verification
    db.commit()
    return {"message": "Draft saved"}


@router.post("/{record_id}/escalate")
async def escalate(
    record_id: str,
    current_user: User = Depends(require_roles([UserRole.verifier, UserRole.admin])),
    db: Session = Depends(get_db),
):
    record = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.add(AuditLog(
        record_id=record.id, user_id=current_user.id,
        action="escalated",
    ))
    db.commit()
    return {"message": "Record escalated"}
