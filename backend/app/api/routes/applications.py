from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io

from app.core.dependencies import require_citizen, require_officer
from app.models.user import User
from app.models.officer import Officer
from app.models.application import Application
from app.services.application_service import create_application, verify_offline_field
from app.services.pdf_service import generate_application_pdf

router = APIRouter()


class CreateApplicationRequest(BaseModel):
    scheme_id: str
    digital_form_data: Dict[str, Any] = {}


class VerifyFieldRequest(BaseModel):
    field_id: str
    status: str  # verified | rejected
    note: Optional[str] = None
    proof_photo_url: Optional[str] = None


@router.get("")
async def list_applications(user: User = Depends(require_citizen)):
    """List all citizen's applications."""
    apps = await Application.find(
        Application.user_id == str(user.id)
    ).sort(-Application.last_updated_at).to_list()

    return {
        "applications": [_app_to_dict(a) for a in apps],
        "total": len(apps)
    }


@router.post("")
async def submit_application(req: CreateApplicationRequest, user: User = Depends(require_citizen)):
    """Create a new application (submit digital form)."""
    try:
        app = await create_application(user, req.scheme_id, req.digital_form_data)
        return {
            "message": "Application submitted successfully",
            "application_id": app.application_id,
            "status": app.overall_status,
            "has_offline_verification": len(app.offline_verification_fields) > 0,
            "offline_fields": [f.model_dump() for f in app.offline_verification_fields]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{app_id}")
async def get_application(app_id: str, user: User = Depends(require_citizen)):
    """Get application detail with offline status."""
    app = await Application.find_one(Application.application_id == app_id)
    if not app or app.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Application not found")
    return _app_to_full_dict(app)


@router.put("/{app_id}")
async def update_draft(app_id: str, req: CreateApplicationRequest, user: User = Depends(require_citizen)):
    """Update a draft application."""
    app = await Application.find_one(Application.application_id == app_id)
    if not app or app.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Application not found")
    if app.overall_status != "draft":
        raise HTTPException(status_code=400, detail="Can only update draft applications")

    app.digital_form_data = req.digital_form_data
    app.last_updated_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
    await app.save()
    return {"message": "Draft updated"}


@router.patch("/{app_id}/verify-field")
async def verify_field(app_id: str, req: VerifyFieldRequest, officer: Officer = Depends(require_officer)):
    """Officer verifies or rejects an offline field."""
    if req.status not in ("verified", "rejected"):
        raise HTTPException(status_code=400, detail="Status must be 'verified' or 'rejected'")

    try:
        app = await verify_offline_field(
            app_id=app_id,
            field_id=req.field_id,
            status=req.status,
            officer_id=officer.officer_id,
            note=req.note,
            proof_photo_url=req.proof_photo_url
        )
        return {
            "message": f"Field {req.status}",
            "application_status": app.overall_status,
            "all_offline_verified": app.all_offline_verified
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{app_id}/pdf")
async def download_application_pdf(app_id: str, user: User = Depends(require_citizen)):
    """Download application summary as PDF."""
    app = await Application.find_one(Application.application_id == app_id)
    if not app or app.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Application not found")

    pdf_bytes = generate_application_pdf(
        application_id=app.application_id,
        scheme_name=app.scheme_name,
        citizen_name=user.profile.name or "Citizen",
        sahayak_id=user.sahayak_id,
        form_data=app.digital_form_data,
        status=app.overall_status,
        submitted_at=app.submitted_at.strftime("%d-%m-%Y") if app.submitted_at else "N/A"
    )
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=application-{app_id}.pdf"}
    )


def _app_to_dict(a: Application) -> dict:
    return {
        "application_id": a.application_id,
        "scheme_id": a.scheme_id,
        "scheme_name": a.scheme_name,
        "overall_status": a.overall_status,
        "submitted_at": a.submitted_at.isoformat() if a.submitted_at else None,
        "last_updated_at": a.last_updated_at.isoformat() if a.last_updated_at else None,
        "has_offline_fields": len(a.offline_verification_fields) > 0,
        "pending_offline_count": sum(1 for f in a.offline_verification_fields if f.status == "pending")
    }


def _app_to_full_dict(a: Application) -> dict:
    d = _app_to_dict(a)
    d["digital_form_data"] = a.digital_form_data
    d["offline_verification_fields"] = [f.model_dump() for f in a.offline_verification_fields]
    d["status_history"] = [s.model_dump() for s in a.status_history]
    d["documents_uploaded"] = [doc.model_dump() for doc in a.documents_uploaded]
    d["rejection_reason"] = a.rejection_reason
    d["benefit_received"] = a.benefit_received
    d["all_offline_verified"] = a.all_offline_verified
    return d
