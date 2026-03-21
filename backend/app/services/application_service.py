from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from app.models.application import (
    Application, OfflineVerificationField, StatusHistoryEntry, UploadedDocument
)
from app.models.scheme import Scheme
from app.models.user import User
from app.models.audit_log import AuditLog
from app.core.security import generate_application_id


async def get_next_app_sequence() -> int:
    count = await Application.count()
    return count + 1


async def create_application(
    user: User,
    scheme_id: str,
    digital_form_data: Dict[str, Any]
) -> Application:
    """Create a new application with offline field splitting."""
    scheme = await Scheme.find_one(Scheme.scheme_id == scheme_id)
    if not scheme:
        raise ValueError("Scheme not found")

    if not scheme.is_active:
        raise ValueError("Scheme is not active")

    # Check for existing application
    existing_app = await Application.find_one(
        Application.user_id == str(user.id),
        Application.scheme_id == scheme_id
    )
    if existing_app:
        raise ValueError(
            f"You already have an application for this scheme ({existing_app.overall_status}). "
            "Please check 'My Applications' to track its status."
        )

    # Build offline verification fields from form
    offline_fields = []
    if scheme.application_form:
        for section in scheme.application_form.sections:
            for field in section.fields:
                if field.requires_offline_verification:
                    offline_fields.append(OfflineVerificationField(
                        field_id=field.field_id,
                        label=field.label.en if field.label else field.field_id,
                        offline_verification_label=field.offline_verification_label or field.label.en,
                        status="pending"
                    ))

    has_offline = len(offline_fields) > 0
    initial_status = "pending_offline_verification" if has_offline else "submitted"

    seq = await get_next_app_sequence()
    app_id = generate_application_id(seq)

    application = Application(
        application_id=app_id,
        user_id=str(user.id),
        scheme_id=scheme_id,
        scheme_name=scheme.name.en if scheme.name else scheme_id,
        digital_form_data=digital_form_data,
        offline_verification_fields=offline_fields,
        overall_status=initial_status,
        status_history=[StatusHistoryEntry(
            status=initial_status,
            timestamp=datetime.now(timezone.utc),
            actor="citizen",
            note="Application submitted"
        )],
        submitted_at=datetime.now(timezone.utc)
    )
    await application.insert()

    # Update user's enrolled_schemes
    from app.models.user import EnrolledScheme
    user.enrolled_schemes.append(EnrolledScheme(
        scheme_id=scheme_id,
        scheme_name=scheme.name.en if scheme.name else scheme_id,
        enrolled_date=datetime.now(timezone.utc),
        status=initial_status,
        benefit_amount_annual=scheme.benefit_amount
    ))
    await user.save()

    # Audit log
    await AuditLog(
        event_type="scheme_applied",
        user_id=str(user.id),
        actor_id=str(user.id),
        actor_role="citizen",
        metadata={"application_id": app_id, "scheme_id": scheme_id}
    ).insert()

    return application


async def verify_offline_field(
    app_id: str,
    field_id: str,
    status: str,  # "verified" or "rejected"
    officer_id: str,
    note: Optional[str] = None,
    proof_photo_url: Optional[str] = None
) -> Application:
    """Officer verifies or rejects an offline field."""
    application = await Application.find_one(Application.application_id == app_id)
    if not application:
        raise ValueError("Application not found")

    field_found = False
    for field in application.offline_verification_fields:
        if field.field_id == field_id:
            field.status = status
            field.verified_by_officer_id = officer_id
            field.verified_at = datetime.now(timezone.utc)
            field.officer_note = note
            field.proof_photo_url = proof_photo_url
            field_found = True
            break

    if not field_found:
        raise ValueError(f"Field {field_id} not found in application")

    # Check if all offline fields are now processed
    all_processed = all(
        f.status in ("verified", "rejected")
        for f in application.offline_verification_fields
    )

    if all_processed:
        application.all_offline_verified = True
        any_rejected = any(
            f.status == "rejected"
            for f in application.offline_verification_fields
        )
        if any_rejected:
            application.overall_status = "rejected"
            rejected_fields = [f.label for f in application.offline_verification_fields if f.status == "rejected"]
            application.rejection_reason = f"Offline verification rejected for: {', '.join(rejected_fields)}"
        else:
            application.overall_status = "under_review"

        application.status_history.append(StatusHistoryEntry(
            status=application.overall_status,
            timestamp=datetime.now(timezone.utc),
            actor=officer_id,
            note=f"All offline fields processed. Status: {application.overall_status}"
        ))

    application.last_updated_at = datetime.now(timezone.utc)
    await application.save()

    # Audit log
    await AuditLog(
        event_type=f"offline_field_{status}",
        user_id=application.user_id,
        actor_id=officer_id,
        actor_role="officer",
        metadata={
            "application_id": app_id,
            "field_id": field_id,
            "status": status,
            "note": note
        }
    ).insert()

    return application


from beanie.operators import In

async def get_pending_verifications(district: str) -> List[dict]:
    """Get all applications with pending offline verifications in a district."""
    # Find users in this district
    users_in_district = await User.find(
        {"profile.district": district}
    ).to_list()
    user_ids = [str(u.id) for u in users_in_district]

    applications = await Application.find(
        Application.overall_status == "pending_offline_verification",
        In(Application.user_id, user_ids)
    ).to_list()

    result = []
    for app in applications:
        user = next((u for u in users_in_district if str(u.id) == app.user_id), None)
        pending_fields = [f for f in app.offline_verification_fields if f.status == "pending"]
        result.append({
            "application_id": app.application_id,
            "scheme_name": app.scheme_name,
            "citizen_name": user.profile.name if user else "Unknown",
            "sahayak_id": user.sahayak_id if user else "Unknown",
            "pending_fields_count": len(pending_fields),
            "pending_fields": [f.model_dump() for f in pending_fields],
            "submitted_at": app.submitted_at.isoformat() if app.submitted_at else None
        })

    return result
