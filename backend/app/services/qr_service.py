from datetime import datetime, timezone, timedelta
from typing import Optional
from app.models.user import User
from app.models.qr_token import QRToken


async def generate_qr_for_user(user: User) -> QRToken:
    """Generate a QR record for a citizen and store raw Sahayak ID as QR value."""
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

    qr_value = user.sahayak_id
    now = datetime.now(timezone.utc)

    qr_token = QRToken(
        user_id=str(user.id),
        sahayak_id=user.sahayak_id,
        token_version=new_version,
        signed_jwt=qr_value,
        issued_at=now,
        expires_at=now + timedelta(days=36500), # 100 years
        is_revoked=False
    )
    await qr_token.insert()
    return qr_token


async def generate_qr_for_family_member(user: User, member_id: str) -> Optional[str]:
    """Generate QR data for a specific family member."""
    member = next((m for m in user.family_members if m.member_id == member_id), None)
    if not member:
        return None

    qr_value = f"{user.sahayak_id}-{member_id[:8]}"
    member.qr_token = qr_value
    await user.save()
    return qr_value


async def get_active_qr(user_id: str) -> Optional[QRToken]:
    """Get the current active (non-revoked, non-expired) QR token."""
    now = datetime.now(timezone.utc)
    return await QRToken.find_one(
        QRToken.user_id == user_id,
        QRToken.is_revoked == False,
        QRToken.expires_at > now,
        sort=[("token_version", -1)]
    )
