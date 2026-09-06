from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import User, UserRole, UserStatus, AuditLog, SystemSetting
from app.auth import get_current_user, require_roles

router = APIRouter(tags=["admin"])


class UserCreate(BaseModel):
    name: str
    email: str
    role: str
    password: Optional[str] = "BhoomiSetu@2026"


class UserStatusUpdate(BaseModel):
    status: str


@router.get("/users")
async def list_users(
    current_user: User = Depends(require_roles([UserRole.admin])),
    db: Session = Depends(get_db),
):
    users = db.query(User).all()
    return [_user_out(u) for u in users]


@router.post("/users")
async def create_user(
    body: UserCreate,
    current_user: User = Depends(require_roles([UserRole.admin])),
    db: Session = Depends(get_db),
):
    role_map = {
        "citizen": UserRole.citizen, "operator": UserRole.data_operator,
        "data_operator": UserRole.data_operator, "verifier": UserRole.verifier,
        "officer": UserRole.approving_officer, "approving_officer": UserRole.approving_officer,
        "auditor": UserRole.auditor, "admin": UserRole.admin,
    }
    role_enum = role_map.get(body.role)
    if not role_enum:
        raise HTTPException(status_code=400, detail="Invalid role")

    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")

    # Create Firebase user via Admin SDK
    firebase_uid = None
    try:
        from app.auth import get_firebase_app
        app = get_firebase_app()
        if app:
            from firebase_admin import auth
            fb_user = auth.create_user(email=body.email, password=body.password, display_name=body.name, app=app)
            firebase_uid = fb_user.uid
            auth.set_custom_user_claims(firebase_uid, {"role": role_enum.value}, app=app)
    except Exception:
        pass

    if not firebase_uid:
        import uuid
        firebase_uid = f"local_{uuid.uuid4().hex}"

    user = User(firebase_uid=firebase_uid, name=body.name, email=body.email, role=role_enum, status=UserStatus.active)
    db.add(user)
    db.add(AuditLog(user_id=current_user.id, action="user_created", new_value=body.email))
    db.commit()
    db.refresh(user)
    return _user_out(user)


@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    current_user: User = Depends(require_roles([UserRole.admin])),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_out(user)


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    body: UserCreate,
    current_user: User = Depends(require_roles([UserRole.admin])),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.name = body.name
    user.email = body.email
    db.commit()
    return _user_out(user)


@router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    body: UserStatusUpdate,
    current_user: User = Depends(require_roles([UserRole.admin])),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = body.status
    # Also toggle Firebase disabled state
    try:
        from app.auth import get_firebase_app
        app = get_firebase_app()
        if app:
            from firebase_admin import auth
            auth.update_user(user.firebase_uid, disabled=(body.status == "suspended"), app=app)
    except Exception:
        pass
    db.add(AuditLog(user_id=current_user.id, action="user_status_changed", new_value=body.status))
    db.commit()
    return _user_out(user)


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(require_roles([UserRole.admin])),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    try:
        from app.auth import get_firebase_app
        app = get_firebase_app()
        if app:
            from firebase_admin import auth
            auth.delete_user(user.firebase_uid, app=app)
    except Exception:
        pass
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


@router.get("/settings")
async def get_settings(
    current_user: User = Depends(require_roles([UserRole.admin])),
    db: Session = Depends(get_db),
):
    rows = db.query(SystemSetting).all()
    return {r.key: r.value for r in rows}


@router.put("/settings")
async def update_settings(
    body: dict,
    current_user: User = Depends(require_roles([UserRole.admin])),
    db: Session = Depends(get_db),
):
    for key, value in body.items():
        row = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if row:
            row.value = value
        else:
            db.add(SystemSetting(key=key, value=value))
    db.commit()
    return {"message": "Settings updated"}


@router.get("/roles/permissions")
async def get_permissions(current_user: User = Depends(require_roles([UserRole.admin]))):
    return {
        "citizen": ["view_public_records", "submit_requests", "view_own_submissions"],
        "data_operator": ["upload_documents", "view_own_documents", "view_ocr_queue"],
        "verifier": ["view_verification_queue", "correct_fields", "submit_verification"],
        "approving_officer": ["view_approval_queue", "approve_records", "reject_records"],
        "auditor": ["view_audit_trail", "view_analytics", "view_records_readonly"],
        "admin": ["all"],
    }


def _user_out(u: User) -> dict:
    return {
        "id": str(u.id),
        "name": u.name,
        "email": u.email,
        "role": u.role.value,
        "status": u.status.value,
        "createdAt": u.created_at.isoformat() if u.created_at else None,
    }
