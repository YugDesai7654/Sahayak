from datetime import datetime, timezone, timedelta
from typing import Optional
from app.models.user import User
from app.models.qr_token import QRToken
from app.core.security import create_qr_token


def compute_income_band(income: Optional[float]) -> str:
    if income is None:
        return "unknown"
    if income < 100000:
        return "< 1L"
    elif income < 200000:
        return "1-2L"
    elif income < 500000:
        return "2-5L"
    else:
        return "> 5L"


async def generate_qr_for_user(user: User) -> QRToken:
    """Generate a signed QR JWT for a citizen and store it."""
    # Revoke any existing active tokens
    await QRToken.find(
        QRToken.user_id == str(user.id),
        QRToken.is_revoked == False
    ).update({"$set": {"is_revoked": True}})

    # Get the latest token version
    latest_token = await QRToken.find_one(
        QRToken.user_id == str(user.id),
        sort=[("token_version", -1)]
    )
    new_version = (latest_token.token_version + 1) if latest_token else 1

    # Build the QR payload
    enrolled_ids = [s.scheme_id for s in user.enrolled_schemes if s.status == "approved"]

    payload = {
        "sub": user.sahayak_id,
        "name": user.profile.name or "",
        "state": user.profile.state or "",
        "district": user.profile.district or "",
        "caste_category": user.profile.caste_category or "",
        "income_band": compute_income_band(user.profile.income_annual),
        "is_bpl": user.profile.is_bpl or False,
        "enrolled_scheme_ids": enrolled_ids,
        "aadhaar_last4": user.profile.aadhaar_last4 or "",
        "token_version": new_version
    }

    signed_jwt = create_qr_token(payload)
    now = datetime.now(timezone.utc)

    qr_token = QRToken(
        user_id=str(user.id),
        sahayak_id=user.sahayak_id,
        token_version=new_version,
        signed_jwt=signed_jwt,
        issued_at=now,
        expires_at=now + timedelta(days=365),
        is_revoked=False
    )
    await qr_token.insert()
    return qr_token


async def generate_qr_for_family_member(user: User, member_id: str) -> Optional[str]:
    """Generate a signed QR JWT for a specific family member."""
    member = next((m for m in user.family_members if m.member_id == member_id), None)
    if not member:
        return None

    payload = {
        "sub": f"{user.sahayak_id}-{member_id[:8]}",
        "name": member.name or "",
        "relation": member.relation,
        "parent_sahayak_id": user.sahayak_id,
        "state": user.profile.state or "",
        "district": user.profile.district or ""
    }

    signed_jwt = create_qr_token(payload)
    member.qr_token = signed_jwt
    await user.save()
    return signed_jwt


async def get_active_qr(user_id: str) -> Optional[QRToken]:
    """Get the current active (non-revoked, non-expired) QR token."""
    now = datetime.now(timezone.utc)
    return await QRToken.find_one(
        QRToken.user_id == user_id,
        QRToken.is_revoked == False,
        QRToken.expires_at > now,
        sort=[("token_version", -1)]
    )
