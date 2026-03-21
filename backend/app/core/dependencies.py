from datetime import datetime, timezone
from typing import Optional, List
from fastapi import Depends, HTTPException, status, Request, Response
from app.core.security import decode_token
from app.models.user import User
from app.models.officer import Officer
from app.models.admin import Admin


async def get_current_user_from_cookie(request: Request) -> dict:
    """Extract and verify JWT from httpOnly cookie."""
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    return payload


async def require_citizen(payload: dict = Depends(get_current_user_from_cookie)) -> User:
    """Require authenticated citizen."""
    if payload.get("role") != "citizen":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Citizen access required")
    user = await User.find_one(User.sahayak_id == payload.get("sub"))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


async def require_officer(payload: dict = Depends(get_current_user_from_cookie)) -> Officer:
    """Require authenticated officer."""
    if payload.get("role") != "officer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Officer access required")
    officer = await Officer.find_one(Officer.officer_id == payload.get("sub"))
    if not officer or not officer.auth.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Officer account inactive or not found")
    return officer


async def require_admin(payload: dict = Depends(get_current_user_from_cookie)) -> Admin:
    """Require authenticated admin."""
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    admin = await Admin.find_one(Admin.admin_id == payload.get("sub"))
    if not admin or not admin.auth.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin account inactive or not found")
    return admin


def require_admin_tier(allowed_tiers: List[str]):
    """FastAPI dependency: require admin in specific tiers."""
    async def dependency(admin: Admin = Depends(require_admin)) -> Admin:
        if admin.tier not in allowed_tiers:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires admin tier: {', '.join(allowed_tiers)}"
            )
        return admin
    return dependency


def require_own_jurisdiction(resource_state: Optional[str] = None,
                              resource_district: Optional[str] = None,
                              resource_taluka: Optional[str] = None):
    """Check that admin has jurisdiction over the target resource."""
    async def dependency(admin: Admin = Depends(require_admin)) -> Admin:
        j = admin.jurisdiction
        if admin.tier == "national":
            return admin
        if admin.tier == "state":
            if resource_state and j.state != resource_state:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Jurisdiction mismatch: wrong state")
        elif admin.tier == "district":
            if resource_state and j.state != resource_state:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Jurisdiction mismatch: wrong state")
            if resource_district and j.district != resource_district:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Jurisdiction mismatch: wrong district")
        elif admin.tier == "taluka":
            if resource_state and j.state != resource_state:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Jurisdiction mismatch: wrong state")
            if resource_district and j.district != resource_district:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Jurisdiction mismatch: wrong district")
            if resource_taluka and j.taluka != resource_taluka:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Jurisdiction mismatch: wrong taluka")
        return admin
    return dependency
