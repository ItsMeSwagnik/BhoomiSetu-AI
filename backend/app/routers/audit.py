from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import AuditLog, SystemLog, User, UserRole
from app.auth import require_roles

router = APIRouter(tags=["audit"])


@router.get("/audit-trail")
async def get_audit_trail(
    record_id: Optional[str] = None,
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(100, le=500),
    current_user: User = Depends(require_roles([UserRole.admin, UserRole.auditor])),
    db: Session = Depends(get_db),
):
    q = db.query(AuditLog)
    if record_id:
        q = q.filter(AuditLog.record_id == record_id)
    if user_id:
        q = q.filter(AuditLog.user_id == user_id)
    if action:
        q = q.filter(AuditLog.action == action)
    logs = q.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": str(l.id),
            "recordId": str(l.record_id) if l.record_id else None,
            "userId": str(l.user_id),
            "userName": l.user.name if l.user else None,
            "action": l.action,
            "fieldChanged": l.field_changed,
            "oldValue": l.old_value,
            "newValue": l.new_value,
            "reason": l.reason,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None,
        }
        for l in logs
    ]


@router.get("/system-logs")
async def get_system_logs(
    level: Optional[str] = None,
    limit: int = Query(100, le=500),
    current_user: User = Depends(require_roles([UserRole.admin])),
    db: Session = Depends(get_db),
):
    q = db.query(SystemLog)
    if level:
        q = q.filter(SystemLog.level == level)
    logs = q.order_by(SystemLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": str(l.id),
            "eventType": l.event_type,
            "message": l.message,
            "level": l.level,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None,
        }
        for l in logs
    ]
