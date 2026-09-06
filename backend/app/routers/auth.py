from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserRole, UserStatus
from app.auth import get_current_user, verify_firebase_token, bearer_scheme
from fastapi.security import HTTPAuthorizationCredentials
from typing import Optional

router = APIRouter(prefix="/auth", tags=["auth"])


class CompleteRegistrationRequest(BaseModel):
    name: str
    role: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None


def _set_firebase_claim(uid: str, role: str):
    try:
        from app.auth import get_firebase_app
        app = get_firebase_app()
        if app:
            from firebase_admin import auth
            auth.set_custom_user_claims(uid, {"role": role}, app=app)
    except Exception:
        pass


@router.post("/complete-registration")
async def complete_registration(
    body: CompleteRegistrationRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    decoded = verify_firebase_token(credentials.credentials)
    if not decoded:
        raise HTTPException(status_code=401, detail="Invalid token")
    uid = decoded.get("uid") or decoded.get("user_id") or decoded.get("sub")
    email = decoded.get("email", "")

    valid_roles = [r.value for r in UserRole]
    role_map = {
        "citizen": UserRole.citizen,
        "operator": UserRole.data_operator,
        "data_operator": UserRole.data_operator,
        "verifier": UserRole.verifier,
        "officer": UserRole.approving_officer,
        "approving_officer": UserRole.approving_officer,
        "auditor": UserRole.auditor,
        "admin": UserRole.admin,
    }
    role_enum = role_map.get(body.role)
    if not role_enum:
        raise HTTPException(status_code=400, detail=f"Invalid role: {body.role}")

    existing = db.query(User).filter(User.firebase_uid == uid).first()
    if existing:
        existing.role = role_enum
        existing.name = body.name
        db.commit()
        _set_firebase_claim(uid, role_enum.value)
        return {"message": "Profile updated", "role": role_enum.value}

    user = User(firebase_uid=uid, name=body.name, email=email, role=role_enum, status=UserStatus.active)
    db.add(user)
    db.commit()
    _set_firebase_claim(uid, role_enum.value)
    return {"message": "Registration complete", "role": role_enum.value}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "firebaseUid": current_user.firebase_uid,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.value,
        "status": current_user.status.value,
        "createdAt": current_user.created_at.isoformat() if current_user.created_at else None,
    }


@router.patch("/me")
async def update_me(
    body: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.name:
        current_user.name = body.name
    db.commit()
    return {"message": "Profile updated"}
