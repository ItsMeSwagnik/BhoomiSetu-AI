from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import LandRecord, RecordStatus, User, UserRole, AuditLog, Notification
from app.auth import require_roles
from app.routers.records import _record_out

router = APIRouter(prefix="/approval", tags=["approval"])


@router.get("/queue")
async def get_approval_queue(
    current_user: User = Depends(require_roles([UserRole.approving_officer, UserRole.admin])),
    db: Session = Depends(get_db),
):
    records = (
        db.query(LandRecord)
        .filter(LandRecord.status == RecordStatus.pending_approval)
        .order_by(LandRecord.created_at.desc())
        .limit(50)
        .all()
    )
    return [_record_out(r, current_user.role, include_fields=True) for r in records]


@router.get("/{record_id}")
async def get_approval_detail(
    record_id: str,
    current_user: User = Depends(require_roles([UserRole.approving_officer, UserRole.admin])),
    db: Session = Depends(get_db),
):
    record = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return _record_out(record, current_user.role, include_fields=True)


class ApproveBody(BaseModel):
    reason: str = ""


class RejectBody(BaseModel):
    reason: str


@router.post("/{record_id}/approve")
async def approve_record(
    record_id: str,
    body: ApproveBody,
    current_user: User = Depends(require_roles([UserRole.approving_officer, UserRole.admin])),
    db: Session = Depends(get_db),
):
    record = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    record.status = RecordStatus.verified
    db.add(AuditLog(
        record_id=record.id, user_id=current_user.id,
        action="record_approved", reason=body.reason,
    ))
    # Notify uploader
    if record.document and record.document.uploaded_by:
        db.add(Notification(
            user_id=record.document.uploaded_by,
            message=f"Record approved: {record.owner or 'Unknown'} — {record.village or 'Unknown'}",
            type="record_approved",
        ))
    db.commit()
    return {"message": "Record approved and published"}


@router.post("/{record_id}/reject")
async def reject_record(
    record_id: str,
    body: RejectBody,
    current_user: User = Depends(require_roles([UserRole.approving_officer, UserRole.admin])),
    db: Session = Depends(get_db),
):
    record = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    record.status = RecordStatus.flagged
    record.rejection_reason = body.reason
    db.add(AuditLog(
        record_id=record.id, user_id=current_user.id,
        action="record_rejected", reason=body.reason,
    ))
    # Notify verifiers
    verifiers = db.query(User).filter(User.role == UserRole.verifier).all()
    for v in verifiers:
        db.add(Notification(
            user_id=v.id,
            message=f"Record rejected and returned for re-verification: {record.owner or 'Unknown'}. Reason: {body.reason}",
            type="re_verification_required",
        ))
    db.commit()
    return {"message": "Record rejected and returned to verification queue"}
