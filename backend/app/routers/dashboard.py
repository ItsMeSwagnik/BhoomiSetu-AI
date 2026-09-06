from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import (
    Document, LandRecord, User, UserRole, DocumentStatus, RecordStatus,
    Submission, ValidationResult
)
from app.auth import get_current_user, require_roles

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    role = current_user.role

    if role == UserRole.citizen:
        submissions = db.query(Submission).filter(Submission.citizen_id == current_user.id).all()
        return {
            "registeredParcels": db.query(LandRecord).filter(LandRecord.owner.ilike(f"%{current_user.name}%"), LandRecord.status == RecordStatus.verified).count(),
            "pendingRequests": sum(1 for s in submissions if s.status.value in ("submitted", "processing", "in_verification")),
            "verifiedRecords": sum(1 for s in submissions if s.status.value == "verified"),
            "flaggedIssues": 0,
        }

    if role == UserRole.data_operator:
        docs = db.query(Document).filter(Document.uploaded_by == current_user.id)
        return {
            "totalInQueue": docs.count(),
            "processing": docs.filter(Document.status == DocumentStatus.processing).count(),
            "completed": docs.filter(Document.status == DocumentStatus.extracted).count(),
            "failed": docs.filter(Document.status == DocumentStatus.failed).count(),
        }

    if role == UserRole.verifier:
        flagged = db.query(LandRecord).filter(LandRecord.status == RecordStatus.flagged).count()
        verified = db.query(LandRecord).filter(LandRecord.status == RecordStatus.verified).count()
        return {
            "pendingReview": flagged,
            "verifiedToday": verified,
            "gisMismatches": 0,
            "polygonsValidated": db.query(LandRecord).filter(LandRecord.parcel_id.isnot(None)).count(),
        }

    if role == UserRole.approving_officer:
        return {
            "pendingAdjudication": db.query(LandRecord).filter(LandRecord.status == RecordStatus.pending_approval).count(),
            "adjudicated": db.query(LandRecord).filter(LandRecord.status == RecordStatus.verified).count(),
            "recordsPublished": db.query(LandRecord).filter(LandRecord.status == RecordStatus.verified).count(),
            "escalated": 0,
        }

    # admin / auditor — system-wide
    total_docs = db.query(Document).count()
    verified = db.query(LandRecord).filter(LandRecord.status == RecordStatus.verified).count()
    pending = db.query(LandRecord).filter(LandRecord.status.in_([RecordStatus.flagged, RecordStatus.pending_approval])).count()
    avg_conf = db.query(func.avg(LandRecord.confidence_score)).scalar() or 0
    return {
        "documentsProcessed": total_docs,
        "verifiedRecords": verified,
        "pendingVerification": pending,
        "averageConfidence": round(float(avg_conf) * 100, 1),
        "validationErrors": db.query(LandRecord).filter(LandRecord.status == RecordStatus.flagged).count(),
        "gisDiscrepancies": db.query(ValidationResult).filter(
            ValidationResult.validation_type == "gis_spatial",
            ValidationResult.status == "fail",
        ).count(),
        "activeUsers": db.query(User).filter(User.status == "active").count(),
    }


@router.get("/analytics/district-progress")
async def district_progress(
    current_user: User = Depends(require_roles([UserRole.admin, UserRole.auditor, UserRole.approving_officer, UserRole.data_operator])),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(LandRecord.district, func.count(LandRecord.id))
        .group_by(LandRecord.district)
        .all()
    )
    return [{"district": r[0] or "Unknown", "count": r[1]} for r in rows]


@router.get("/analytics/processing-trends")
async def processing_trends(
    current_user: User = Depends(require_roles([UserRole.admin, UserRole.auditor, UserRole.approving_officer])),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(func.date(Document.uploaded_at), func.count(Document.id))
        .group_by(func.date(Document.uploaded_at))
        .order_by(func.date(Document.uploaded_at).desc())
        .limit(30)
        .all()
    )
    return [{"date": str(r[0]), "count": r[1]} for r in rows]


@router.get("/analytics/approval-funnel")
async def approval_funnel(
    current_user: User = Depends(require_roles([UserRole.admin, UserRole.auditor, UserRole.approving_officer])),
    db: Session = Depends(get_db),
):
    from app.models import RecordStatus
    return [
        {"stage": "Uploaded", "count": db.query(Document).count()},
        {"stage": "Extracted", "count": db.query(LandRecord).count()},
        {"stage": "Flagged", "count": db.query(LandRecord).filter(LandRecord.status == RecordStatus.flagged).count()},
        {"stage": "Pending Approval", "count": db.query(LandRecord).filter(LandRecord.status == RecordStatus.pending_approval).count()},
        {"stage": "Verified", "count": db.query(LandRecord).filter(LandRecord.status == RecordStatus.verified).count()},
    ]
