import base64
import json
import os
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserRole, UserStatus
from app.config import settings

bearer_scheme = HTTPBearer(auto_error=False)

_firebase_app = None


def get_firebase_app():
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app
    try:
        import firebase_admin
        from firebase_admin import credentials
        if firebase_admin._apps:
            _firebase_app = firebase_admin.get_app()
            return _firebase_app
        sa_json = settings.firebase_service_account_json
        if sa_json:
            try:
                decoded = base64.b64decode(sa_json).decode()
                cred_dict = json.loads(decoded)
            except Exception:
                cred_dict = json.loads(sa_json)
            cred = credentials.Certificate(cred_dict)
        elif settings.firebase_project_id:
            cred = credentials.ApplicationDefault()
        else:
            return None
        _firebase_app = firebase_admin.initialize_app(cred)
        return _firebase_app
    except Exception:
        return None


def verify_firebase_token(token: str) -> Optional[dict]:
    app = get_firebase_app()
    if app is None:
        # Dev mode: decode token as plain JSON (for testing without Firebase)
        try:
            payload = json.loads(base64.b64decode(token + "==").decode())
            return payload
        except Exception:
            return None
    try:
        from firebase_admin import auth
        return auth.verify_id_token(token, app=app)
    except Exception:
        return None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    decoded = verify_firebase_token(credentials.credentials)
    if not decoded:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    uid = decoded.get("uid") or decoded.get("user_id") or decoded.get("sub")
    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    user = db.query(User).filter(User.firebase_uid == uid).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not registered")
    if user.status == UserStatus.suspended:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account suspended")
    return user


def require_roles(allowed_roles: list[UserRole]):
    async def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user
    return checker
