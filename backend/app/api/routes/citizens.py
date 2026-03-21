from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io

from app.core.dependencies import require_citizen
from app.models.user import User, UserProfile, FamilyMember
from app.services.qr_service import generate_qr_for_user, get_active_qr, generate_qr_for_family_member
from app.services.ocr_service import extract_fields_from_image
from app.services.pdf_service import generate_qr_card_pdf
from app.models.audit_log import AuditLog

router = APIRouter()


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    aadhaar_last4: Optional[str] = None
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    taluka: Optional[str] = None
    village: Optional[str] = None
    pincode: Optional[str] = None
    income_annual: Optional[float] = None
    income_source: Optional[str] = None
    caste_category: Optional[str] = None
    religion: Optional[str] = None
    occupation: Optional[str] = None
    land_holding_acres: Optional[float] = None
    is_bpl: Optional[bool] = None
    bpl_card_number: Optional[str] = None
    disability_type: Optional[str] = None
    disability_percentage: Optional[float] = None
    is_minority: Optional[bool] = None
    education_level: Optional[str] = None
    ration_card_type: Optional[str] = None
    bank_account_number_last4: Optional[str] = None
    ifsc_code: Optional[str] = None
    profile_photo_url: Optional[str] = None


class FamilyMemberRequest(BaseModel):
    relation: str
    name: str
    dob: Optional[str] = None
    gender: Optional[str] = None
    aadhaar_last4: Optional[str] = None


@router.get("/me")
async def get_my_profile(user: User = Depends(require_citizen)):
    return {
        "sahayak_id": user.sahayak_id,
        "profile": user.profile.model_dump(),
        "family_members": [m.model_dump() for m in user.family_members],
        "enrolled_schemes": [s.model_dump() for s in user.enrolled_schemes],
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "email": user.auth.email
    }


@router.put("/me")
async def update_profile(req: ProfileUpdateRequest, user: User = Depends(require_citizen)):
    update_data = req.model_dump(exclude_none=True)
    if "dob" in update_data and update_data["dob"]:
        try:
            update_data["dob"] = datetime.fromisoformat(update_data["dob"])
        except ValueError:
            pass

    for key, value in update_data.items():
        if hasattr(user.profile, key):
            setattr(user.profile, key, value)

    user.updated_at = datetime.now(timezone.utc)
    await user.save()

    # Regenerate QR after profile update
    try:
        await generate_qr_for_user(user)
    except Exception:
        pass

    await AuditLog(
        event_type="profile_update",
        user_id=str(user.id),
        actor_id=str(user.id),
        actor_role="citizen",
        metadata={"updated_fields": list(update_data.keys())}
    ).insert()

    return {"message": "Profile updated", "profile": user.profile.model_dump()}


@router.post("/me/ocr")
async def ocr_document(file: UploadFile = File(...), user: User = Depends(require_citizen)):
    if file.content_type not in ("image/jpeg", "image/png", "image/jpg"):
        raise HTTPException(status_code=400, detail="Only JPEG/PNG images accepted")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    extracted = await extract_fields_from_image(contents)
    return {"extracted_fields": extracted}


@router.get("/me/qr")
async def get_qr(user: User = Depends(require_citizen)):
    qr = await get_active_qr(str(user.id))
    if not qr:
        # Generate one
        qr = await generate_qr_for_user(user)
    return {
        "sahayak_id": user.sahayak_id,
        "signed_jwt": qr.signed_jwt,
        "token_version": qr.token_version,
        "issued_at": qr.issued_at.isoformat(),
        "expires_at": qr.expires_at.isoformat()
    }


@router.post("/me/qr/refresh")
async def refresh_qr(user: User = Depends(require_citizen)):
    qr = await generate_qr_for_user(user)
    return {
        "message": "QR refreshed",
        "signed_jwt": qr.signed_jwt,
        "token_version": qr.token_version,
        "expires_at": qr.expires_at.isoformat()
    }


@router.get("/me/qr/card-pdf")
async def download_qr_card_pdf(user: User = Depends(require_citizen)):
    qr = await get_active_qr(str(user.id))
    if not qr:
        qr = await generate_qr_for_user(user)

    pdf_bytes = generate_qr_card_pdf(
        name=user.profile.name or "Citizen",
        sahayak_id=user.sahayak_id,
        state=user.profile.state or "",
        category=user.profile.caste_category or "",
        qr_data=qr.signed_jwt,
        issue_date=qr.issued_at.strftime("%d-%m-%Y") if qr.issued_at else "",
        expiry_date=qr.expires_at.strftime("%d-%m-%Y") if qr.expires_at else ""
    )
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=sahayak-card-{user.sahayak_id}.pdf"}
    )


@router.post("/me/family")
async def add_family_member(req: FamilyMemberRequest, user: User = Depends(require_citizen)):
    member = FamilyMember(
        relation=req.relation,
        name=req.name,
        dob=datetime.fromisoformat(req.dob) if req.dob else None,
        gender=req.gender,
        aadhaar_last4=req.aadhaar_last4
    )

    # Generate QR for family member
    user.family_members.append(member)
    await user.save()

    await generate_qr_for_family_member(user, member.member_id)

    return {"message": "Family member added", "member_id": member.member_id}


@router.put("/me/family/{member_id}")
async def update_family_member(member_id: str, req: FamilyMemberRequest, user: User = Depends(require_citizen)):
    member = next((m for m in user.family_members if m.member_id == member_id), None)
    if not member:
        raise HTTPException(status_code=404, detail="Family member not found")

    member.name = req.name
    member.relation = req.relation
    if req.dob:
        member.dob = datetime.fromisoformat(req.dob)
    member.gender = req.gender
    member.aadhaar_last4 = req.aadhaar_last4
    await user.save()

    await generate_qr_for_family_member(user, member_id)
    return {"message": "Family member updated"}


@router.delete("/me/family/{member_id}")
async def remove_family_member(member_id: str, user: User = Depends(require_citizen)):
    user.family_members = [m for m in user.family_members if m.member_id != member_id]
    await user.save()
    return {"message": "Family member removed"}
