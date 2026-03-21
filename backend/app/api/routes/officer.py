from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.dependencies import require_officer
from app.core.security import decode_token
from app.models.officer import Officer
from app.models.user import User
from app.models.application import Application
from app.models.qr_token import QRToken, ScanLogEntry
from app.models.audit_log import AuditLog
from app.services.application_service import get_pending_verifications

router = APIRouter()


class ScanRequest(BaseModel):
    qr_jwt: str
    purpose: str = "verification"


@router.post("/scan")
async def scan_qr(req: ScanRequest, officer: Officer = Depends(require_officer)):
    """Log a QR scan and return citizen profile."""
    # Verify the QR JWT
    try:
        payload = decode_token(req.qr_jwt)
    except ValueError:
        raise HTTPException(status_code=400, detail="INVALID QR — Token tampered or expired. Do not proceed.")

    if payload.get("type") != "qr":
        raise HTTPException(status_code=400, detail="Invalid QR token type")

    sahayak_id = payload.get("sub")

    # Log the scan
    qr_token = await QRToken.find_one(
        QRToken.sahayak_id == sahayak_id,
        QRToken.is_revoked == False
    )
    if qr_token:
        qr_token.scan_log.append(ScanLogEntry(
            scanned_by_officer_id=officer.officer_id,
            officer_name=officer.name,
            office_name=officer.office_name,
            purpose=req.purpose
        ))
        await qr_token.save()

    # Audit log
    await AuditLog(
        event_type="qr_scan",
        user_id=None,
        actor_id=officer.officer_id,
        actor_role="officer",
        metadata={"sahayak_id": sahayak_id, "purpose": req.purpose}
    ).insert()

    # Fetch citizen profile
    user = await User.find_one(User.sahayak_id == sahayak_id)
    if not user:
        return {
            "valid": True,
            "qr_payload": payload,
            "citizen": None,
            "message": "QR valid but citizen not found in database (offline data from QR payload shown)"
        }

    # Get pending applications
    apps = await Application.find(
        Application.user_id == str(user.id),
        Application.overall_status == "pending_offline_verification"
    ).to_list()

    return {
        "valid": True,
        "citizen": {
            "sahayak_id": user.sahayak_id,
            "name": user.profile.name,
            "dob": user.profile.dob.isoformat() if user.profile.dob else None,
            "gender": user.profile.gender,
            "aadhaar_last4": user.profile.aadhaar_last4,
            "phone": user.profile.phone,
            "state": user.profile.state,
            "district": user.profile.district,
            "village": user.profile.village,
            "pincode": user.profile.pincode,
            "income_annual": user.profile.income_annual,
            "is_bpl": user.profile.is_bpl,
            "caste_category": user.profile.caste_category,
            "profile_photo_url": user.profile.profile_photo_url
        },
        "enrolled_schemes": [s.model_dump() for s in user.enrolled_schemes],
        "pending_applications": [{
            "application_id": a.application_id,
            "scheme_name": a.scheme_name,
            "overall_status": a.overall_status,
            "offline_verification_fields": [f.model_dump() for f in a.offline_verification_fields]
        } for a in apps]
    }


@router.get("/citizen/{sahayak_id}")
async def get_citizen_profile(sahayak_id: str, officer: Officer = Depends(require_officer)):
    """Fetch citizen profile for officer view."""
    user = await User.find_one(User.sahayak_id == sahayak_id)
    if not user:
        raise HTTPException(status_code=404, detail="Citizen not found")

    return {
        "sahayak_id": user.sahayak_id,
        "profile": user.profile.model_dump(),
        "family_members": [m.model_dump() for m in user.family_members],
        "enrolled_schemes": [s.model_dump() for s in user.enrolled_schemes]
    }


@router.get("/pending-verifications")
async def pending_verifications(officer: Officer = Depends(require_officer)):
    """List pending offline verifications in officer's district."""
    result = await get_pending_verifications(officer.district)
    return {"pending_verifications": result, "total": len(result)}


@router.get("/dashboard")
async def officer_dashboard(officer: Officer = Depends(require_officer)):
    """Officer dashboard stats."""
    from app.models.qr_token import QRToken

    # Today's scans
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0)
    today_scans = await AuditLog.find(
        AuditLog.event_type == "qr_scan",
        AuditLog.actor_id == officer.officer_id,
        AuditLog.timestamp >= today_start
    ).count()

    # Pending verifications
    pending = await get_pending_verifications(officer.district)

    # Recent scans
    recent_scans = await AuditLog.find(
        AuditLog.event_type == "qr_scan",
        AuditLog.actor_id == officer.officer_id
    ).sort(-AuditLog.timestamp).limit(10).to_list()

    return {
        "officer": {
            "name": officer.name,
            "office_name": officer.office_name,
            "district": officer.district,
            "department": officer.department
        },
        "today_scan_count": today_scans,
        "pending_verifications_count": len(pending),
        "recent_scans": [{
            "timestamp": s.timestamp.isoformat() if s.timestamp else None,
            "metadata": s.metadata
        } for s in recent_scans]
    }


class ApplicationDecisionRequest(BaseModel):
    decision: str  # approved | rejected
    reason: Optional[str] = None


@router.get("/applications")
async def list_district_applications(officer: Officer = Depends(require_officer)):
    """List all submitted applications in the officer's district."""
    # Find all users in this district
    users = await User.find({"profile.district": officer.district}).to_list()
    user_ids = [str(u.id) for u in users]

    from beanie.operators import In
    applications = await Application.find(In(Application.user_id, user_ids)).sort(-Application.last_updated_at).to_list()

    return {
        "applications": [{
            "application_id": a.application_id,
            "scheme_name": a.scheme_name,
            "user_id": a.user_id,
            "citizen_name": next((u.profile.name for u in users if str(u.id) == a.user_id), "Unknown"),
            "sahayak_id": next((u.sahayak_id for u in users if str(u.id) == a.user_id), "Unknown"),
            "overall_status": a.overall_status,
            "submitted_at": a.submitted_at.isoformat() if a.submitted_at else None,
            "has_pending_offline": any(f.status == "pending" for f in a.offline_verification_fields)
        } for a in applications],
        "total": len(applications)
    }


@router.patch("/applications/{app_id}/decision")
async def decide_application(app_id: str, req: ApplicationDecisionRequest, officer: Officer = Depends(require_officer)):
    """Accept or reject an application. Ensures pending offline items are done."""
    from app.models.application import StatusHistoryEntry
    
    application = await Application.find_one(Application.application_id == app_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Verify user is in officer's district
    user = await User.get(application.user_id)
    if not user or user.profile.district != officer.district:
        raise HTTPException(status_code=403, detail="Application outside your district jurisdiction")

    if req.decision not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Decision must be 'approved' or 'rejected'")

    # Prevent approval if offline verification is pending
    if req.decision == "approved":
        pending_fields = [f for f in application.offline_verification_fields if f.status == "pending"]
        if pending_fields:
            raise HTTPException(
                status_code=400, 
                detail="Cannot approve. Citizen has physical verification items pending. Please view their QR first."
            )

    application.overall_status = req.decision
    if req.decision == "rejected" and req.reason:
        application.rejection_reason = req.reason

    application.status_history.append(StatusHistoryEntry(
        status=req.decision,
        timestamp=datetime.now(timezone.utc),
        actor=officer.officer_id,
        note=f"Officer final decision: {req.decision} - {req.reason or ''}"
    ))
    
    application.last_updated_at = datetime.now(timezone.utc)
    await application.save()

    # Update enrolled scheme status for citizen
    if user:
        for enrolled in user.enrolled_schemes:
            if enrolled.scheme_id == application.scheme_id:
                enrolled.status = req.decision
        await user.save()

    # Audit log
    await AuditLog(
        event_type=f"application_{req.decision}",
        user_id=str(user.id),
        actor_id=officer.officer_id,
        actor_role="officer",
        metadata={"application_id": app_id, "reason": req.reason}
    ).insert()

    return {"message": f"Application {req.decision}", "status": req.decision}
