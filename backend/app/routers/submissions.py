from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Submission, SubmissionStatus, User, UserRole, LandRecord
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/submissions", tags=["submissions"])


class SubmissionCreate(BaseModel):
    requestType: str
    parcelReference: str


@router.get("/me")
async def get_my_submissions(
    current_user: User = Depends(require_roles([UserRole.citizen])),
    db: Session = Depends(get_db),
):
    subs = db.query(Submission).filter(Submission.citizen_id == current_user.id).order_by(Submission.submitted_at.desc()).all()
    return [_sub_out(s) for s in subs]


@router.post("")
async def create_submission(
    body: SubmissionCreate,
    current_user: User = Depends(require_roles([UserRole.citizen])),
    db: Session = Depends(get_db),
):
    sub = Submission(
        citizen_id=current_user.id,
        request_type=body.requestType,
        parcel_reference=body.parcelReference,
        status=SubmissionStatus.submitted,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return _sub_out(sub)


@router.get("/{sub_id}/status")
async def get_submission_status(
    sub_id: str,
    current_user: User = Depends(require_roles([UserRole.citizen])),
    db: Session = Depends(get_db),
):
    sub = db.query(Submission).filter(Submission.id == sub_id, Submission.citizen_id == current_user.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return _sub_out(sub)


def _sub_out(s: Submission) -> dict:
    return {
        "id": str(s.id),
        "requestType": s.request_type,
        "parcelReference": s.parcel_reference,
        "status": s.status.value,
        "submittedAt": s.submitted_at.isoformat() if s.submitted_at else None,
    }
