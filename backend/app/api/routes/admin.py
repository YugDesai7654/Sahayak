from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr

from app.core.dependencies import require_admin
from app.core.security import hash_password, generate_random_password, generate_admin_id, generate_officer_id
from app.models.admin import Admin, AdminAuth, AdminJurisdiction
from app.models.officer import Officer, OfficerAuth
from app.models.scheme import (
    Scheme, LocalizedText, ApplicationForm, FormSection, FormField,
    FieldValidation, FieldOption, EligibilityRule
)
from app.models.application import Application
from app.models.user import User
from app.models.audit_log import AuditLog

router = APIRouter()


class SchemeIdProjection(BaseModel):
    scheme_id: str


# ── Scheme Models ───────────────────────────────────────────────

class SchemeFieldRequest(BaseModel):
    field_id: str
    label: dict = {"en": "", "hi": ""}
    type: str = "text"
    options: Optional[List[dict]] = None
    is_required: bool = False
    maps_to_profile: Optional[str] = None
    requires_offline_verification: bool = False
    offline_verification_label: Optional[str] = None
    validation: dict = {}


class SchemeSectionRequest(BaseModel):
    section_id: str
    title: dict = {"en": "", "hi": ""}
    fields: List[SchemeFieldRequest] = []


class SchemeRuleRequest(BaseModel):
    rule_id: str
    field: str
    operator: str
    value: object
    label: str = ""
    near_miss_threshold: Optional[float] = None
    near_miss_tip: Optional[str] = None


class CreateSchemeRequest(BaseModel):
    name: dict = {"en": "", "hi": "", "gu": ""}
    description: dict = {"en": "", "hi": ""}
    ministry: str = ""
    department: str = ""
    category: List[str] = []
    benefit_type: str = "cash"
    benefit_amount: float = 0
    benefit_frequency: str = "annual"
    deadline: Optional[str] = None
    required_documents: List[str] = []
    eligibility_rules: List[SchemeRuleRequest] = []
    application_form: Optional[dict] = None


class CreateAdminRequest(BaseModel):
    name: str
    email: EmailStr
    tier: str
    jurisdiction: dict = {}


class CreateOfficerRequest(BaseModel):
    name: str
    email: EmailStr
    designation: str
    office_name: str
    office_address: str
    department: str


# ── Scheme Routes ───────────────────────────────────────────────

@router.get("/schemes")
async def list_all_schemes(
    admin: Admin = Depends(require_admin),
    scope: Optional[str] = None,
    state: Optional[str] = None,
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200)
):
    """List all schemes across all tiers (read-only for non-owners)."""
    query_filter = {}
    if scope:
        query_filter["scope"] = scope
    if state:
        query_filter["scope_state"] = state
    if category:
        query_filter["category"] = category

    skip = (page - 1) * limit
    schemes = await Scheme.find(query_filter).skip(skip).limit(limit).sort(-Scheme.created_at).to_list()
    total = await Scheme.find(query_filter).count()

    return {
        "schemes": [{
            **s.model_dump(exclude={"id"}),
            "id": str(s.id),
            "is_owner": s.created_by_admin_id == admin.admin_id,
            "can_edit": s.created_by_admin_id == admin.admin_id or (
                s.created_by_tier == admin.tier and _jurisdiction_match(admin, s)
            )
        } for s in schemes],
        "total": total,
        "page": page
    }


@router.post("/schemes")
async def create_scheme(req: CreateSchemeRequest, admin: Admin = Depends(require_admin)):
    """Create scheme scoped to calling admin's tier + jurisdiction."""
    count = await Scheme.count()
    scheme_id = f"{req.name.get('en', 'SCHEME')[:10].upper().replace(' ', '-')}-{count+1:03d}"

    # Auto-set scope from admin's JWT
    scope = admin.tier
    scope_state = admin.jurisdiction.state
    scope_district = admin.jurisdiction.district
    scope_taluka = admin.jurisdiction.taluka

    # Build application form
    app_form = None
    if req.application_form:
        sections = []
        for sec_data in req.application_form.get("sections", []):
            fields = []
            for f_data in sec_data.get("fields", []):
                options = None
                if f_data.get("options"):
                    options = [FieldOption(**o) for o in f_data["options"]]
                fields.append(FormField(
                    field_id=f_data["field_id"],
                    label=LocalizedText(**f_data.get("label", {})),
                    type=f_data.get("type", "text"),
                    options=options,
                    is_required=f_data.get("is_required", False),
                    maps_to_profile=f_data.get("maps_to_profile"),
                    requires_offline_verification=f_data.get("requires_offline_verification", False),
                    offline_verification_label=f_data.get("offline_verification_label"),
                    validation=FieldValidation(**f_data.get("validation", {}))
                ))
            sections.append(FormSection(
                section_id=sec_data["section_id"],
                title=LocalizedText(**sec_data.get("title", {})),
                fields=fields
            ))
        app_form = ApplicationForm(
            form_id=f"FORM-{scheme_id}",
            sections=sections
        )

    # Build eligibility rules
    rules = []
    for r in req.eligibility_rules:
        rules.append(EligibilityRule(
            rule_id=r.rule_id,
            field=r.field,
            operator=r.operator,
            value=r.value,
            label=r.label,
            near_miss_threshold=r.near_miss_threshold,
            near_miss_tip=r.near_miss_tip
        ))

    scheme = Scheme(
        scheme_id=scheme_id,
        name=LocalizedText(**req.name),
        description=LocalizedText(**req.description),
        ministry=req.ministry,
        department=req.department,
        category=req.category,
        benefit_type=req.benefit_type,
        benefit_amount=req.benefit_amount,
        benefit_frequency=req.benefit_frequency,
        deadline=datetime.fromisoformat(req.deadline) if req.deadline else None,
        required_documents=req.required_documents,
        eligibility_rules=rules,
        application_form=app_form,
        scope=scope,
        scope_state=scope_state,
        scope_district=scope_district,
        scope_taluka=scope_taluka,
        created_by_admin_id=admin.admin_id,
        created_by_tier=admin.tier,
        created_by=admin.admin_id
    )
    await scheme.insert()
    return {"message": "Scheme created", "scheme_id": scheme_id}


@router.put("/schemes/{scheme_id}")
async def update_scheme(scheme_id: str, req: CreateSchemeRequest, admin: Admin = Depends(require_admin)):
    """Update scheme (only if admin owns it or same tier + jurisdiction)."""
    scheme = await Scheme.find_one(Scheme.scheme_id == scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    if scheme.created_by_admin_id != admin.admin_id:
        if scheme.created_by_tier != admin.tier or not _jurisdiction_match(admin, scheme):
            raise HTTPException(status_code=403, detail="Cannot edit another tier's scheme")

    # Update fields
    scheme.name = LocalizedText(**req.name)
    scheme.description = LocalizedText(**req.description)
    scheme.ministry = req.ministry
    scheme.department = req.department
    scheme.category = req.category
    scheme.benefit_type = req.benefit_type
    scheme.benefit_amount = req.benefit_amount
    scheme.benefit_frequency = req.benefit_frequency
    scheme.deadline = datetime.fromisoformat(req.deadline) if req.deadline else None
    scheme.required_documents = req.required_documents
    scheme.updated_at = datetime.now(timezone.utc)

    # Update rules
    if req.eligibility_rules:
        scheme.eligibility_rules = [EligibilityRule(**r.model_dump()) for r in req.eligibility_rules]

    # Update form
    if req.application_form:
        # Re-parse (reuse create logic)
        sections = []
        for sec_data in req.application_form.get("sections", []):
            fields = []
            for f_data in sec_data.get("fields", []):
                options = None
                if f_data.get("options"):
                    options = [FieldOption(**o) for o in f_data["options"]]
                fields.append(FormField(
                    field_id=f_data["field_id"],
                    label=LocalizedText(**f_data.get("label", {})),
                    type=f_data.get("type", "text"),
                    options=options,
                    is_required=f_data.get("is_required", False),
                    maps_to_profile=f_data.get("maps_to_profile"),
                    requires_offline_verification=f_data.get("requires_offline_verification", False),
                    offline_verification_label=f_data.get("offline_verification_label"),
                    validation=FieldValidation(**f_data.get("validation", {}))
                ))
            sections.append(FormSection(
                section_id=sec_data["section_id"],
                title=LocalizedText(**sec_data.get("title", {})),
                fields=fields
            ))
        scheme.application_form = ApplicationForm(form_id=f"FORM-{scheme_id}", sections=sections)

    await scheme.save()
    return {"message": "Scheme updated"}


@router.delete("/schemes/{scheme_id}")
async def deactivate_scheme(scheme_id: str, admin: Admin = Depends(require_admin)):
    """Soft delete — deactivate scheme."""
    scheme = await Scheme.find_one(Scheme.scheme_id == scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    if scheme.created_by_admin_id != admin.admin_id:
        if scheme.created_by_tier != admin.tier or not _jurisdiction_match(admin, scheme):
            raise HTTPException(status_code=403, detail="Cannot deactivate another tier's scheme")

    scheme.is_active = False
    scheme.updated_at = datetime.now(timezone.utc)
    await scheme.save()
    return {"message": "Scheme deactivated"}


# ── Admin Management Routes ─────────────────────────────────────

@router.post("/admins")
async def create_admin(req: CreateAdminRequest, admin: Admin = Depends(require_admin)):
    """Create admin one tier below the caller."""
    tier_chain = {"national": ["national", "state"], "state": ["district"], "district": ["taluka"], "taluka": []}

    allowed = tier_chain.get(admin.tier, [])
    if req.tier not in allowed:
        raise HTTPException(status_code=403, detail=f"{admin.tier} admin cannot create {req.tier} admin")

    # Jurisdiction validation
    j = req.jurisdiction
    if req.tier == "state" and not j.get("state"):
        raise HTTPException(status_code=400, detail="State required for state-tier admin")
    if req.tier == "district":
        if admin.tier == "state" and j.get("state") != admin.jurisdiction.state:
            raise HTTPException(status_code=403, detail="Cannot create district admin outside your state")
    if req.tier == "taluka":
        if admin.tier == "district" and j.get("district") != admin.jurisdiction.district:
            raise HTTPException(status_code=403, detail="Cannot create taluka admin outside your district")

    # Check email uniqueness
    existing = await Admin.find_one({"auth.email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use")

    # Auto-generate password
    password = generate_random_password()
    count = await Admin.count()
    admin_id = generate_admin_id(req.tier, j.get("state") or j.get("district") or j.get("taluka") or "all", count + 1)

    new_admin = Admin(
        admin_id=admin_id,
        auth=AdminAuth(email=req.email, password_hash=hash_password(password)),
        name=req.name,
        tier=req.tier,
        jurisdiction=AdminJurisdiction(
            state=j.get("state"),
            district=j.get("district"),
            taluka=j.get("taluka")
        ),
        created_by=admin.admin_id,
        created_by_tier=admin.tier,
        must_change_password=True
    )
    await new_admin.insert()

    return {
        "message": "Admin created",
        "admin_id": admin_id,
        "email": req.email,
        "temp_password": password,
        "tier": req.tier
    }


@router.get("/admins")
async def list_admins(admin: Admin = Depends(require_admin)):
    """List admins visible to the caller based on tier."""
    if admin.tier == "taluka":
        raise HTTPException(status_code=403, detail="Taluka admins cannot list admins")

    query = {}
    if admin.tier == "state":
        query = {"$or": [
            {"tier": "district", "jurisdiction.state": admin.jurisdiction.state},
            {"tier": "taluka", "jurisdiction.state": admin.jurisdiction.state}
        ]}
    elif admin.tier == "district":
        query = {"tier": "taluka", "jurisdiction.district": admin.jurisdiction.district}
    # national sees all

    admins = await Admin.find(query).to_list()
    return {
        "admins": [{
            "admin_id": a.admin_id,
            "name": a.name,
            "email": a.auth.email,
            "tier": a.tier,
            "jurisdiction": a.jurisdiction.model_dump(),
            "is_active": a.auth.is_active,
            "created_at": a.created_at.isoformat() if a.created_at else None
        } for a in admins]
    }


@router.patch("/admins/{admin_id}/deactivate")
async def deactivate_admin(admin_id: str, admin: Admin = Depends(require_admin)):
    """Deactivate an admin below your tier."""
    target = await Admin.find_one(Admin.admin_id == admin_id)
    if not target:
        raise HTTPException(status_code=404, detail="Admin not found")
    if target.admin_id == admin.admin_id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

    tier_order = {"national": 0, "state": 1, "district": 2, "taluka": 3}
    if tier_order.get(target.tier, 99) <= tier_order.get(admin.tier, 99):
        raise HTTPException(status_code=403, detail="Cannot deactivate same or higher tier admin")

    target.auth.is_active = False
    await target.save()
    return {"message": "Admin deactivated"}


# ── Officer Management Routes ───────────────────────────────────

@router.post("/officers")
async def create_officer(req: CreateOfficerRequest, admin: Admin = Depends(require_admin)):
    """Create officer — district admins only."""
    if admin.tier != "district":
        raise HTTPException(status_code=403, detail="Only district admins can create officers")

    existing = await Officer.find_one({"auth.email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use")

    password = generate_random_password()
    count = await Officer.count()
    officer_id = generate_officer_id(admin.jurisdiction.district or "UNK", count + 1)

    officer = Officer(
        officer_id=officer_id,
        auth=OfficerAuth(email=req.email, password_hash=hash_password(password)),
        name=req.name,
        designation=req.designation,
        office_name=req.office_name,
        office_address=req.office_address,
        state=admin.jurisdiction.state or "",
        district=admin.jurisdiction.district or "",
        department=req.department,
        created_by_district_admin_id=admin.admin_id
    )
    await officer.insert()

    return {
        "message": "Officer created",
        "officer_id": officer_id,
        "email": req.email,
        "temp_password": password
    }


@router.get("/officers")
async def list_officers(admin: Admin = Depends(require_admin)):
    """List officers — district admins only see their district."""
    if admin.tier != "district":
        raise HTTPException(status_code=403, detail="Only district admins can manage officers")

    officers = await Officer.find(
        Officer.district == admin.jurisdiction.district
    ).to_list()

    return {
        "officers": [{
            "officer_id": o.officer_id,
            "name": o.name,
            "email": o.auth.email,
            "designation": o.designation,
            "office_name": o.office_name,
            "district": o.district,
            "department": o.department,
            "is_active": o.auth.is_active
        } for o in officers]
    }


@router.put("/officers/{officer_id}")
async def update_officer(officer_id: str, req: CreateOfficerRequest, admin: Admin = Depends(require_admin)):
    if admin.tier != "district":
        raise HTTPException(status_code=403, detail="Only district admins can manage officers")

    officer = await Officer.find_one(Officer.officer_id == officer_id)
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")
    if officer.district != admin.jurisdiction.district:
        raise HTTPException(status_code=403, detail="Officer is not in your district")

    officer.name = req.name
    officer.designation = req.designation
    officer.office_name = req.office_name
    officer.office_address = req.office_address
    officer.department = req.department
    await officer.save()
    return {"message": "Officer updated"}


@router.patch("/officers/{officer_id}/deactivate")
async def deactivate_officer(officer_id: str, admin: Admin = Depends(require_admin)):
    if admin.tier != "district":
        raise HTTPException(status_code=403, detail="Only district admins can manage officers")

    officer = await Officer.find_one(Officer.officer_id == officer_id)
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")
    if officer.district != admin.jurisdiction.district:
        raise HTTPException(status_code=403, detail="Officer is not in your district")

    officer.auth.is_active = False
    await officer.save()
    return {"message": "Officer deactivated"}


# ── Analytics Routes ────────────────────────────────────────────

@router.get("/analytics/schemes")
async def scheme_analytics(admin: Admin = Depends(require_admin)):
    query_filter = {}
    if admin.tier == "state":
        query_filter["scope_state"] = admin.jurisdiction.state
    elif admin.tier == "district":
        query_filter["scope_state"] = admin.jurisdiction.state
        query_filter["scope_district"] = admin.jurisdiction.district
    elif admin.tier == "taluka":
        query_filter["scope_state"] = admin.jurisdiction.state
        query_filter["scope_district"] = admin.jurisdiction.district
        query_filter["scope_taluka"] = admin.jurisdiction.taluka

    total_schemes = await Scheme.find(query_filter).count()
    active_schemes = await Scheme.find({"is_active": True, **query_filter}).count()

    schemes = await Scheme.find(query_filter).project(SchemeIdProjection).to_list()
    scheme_ids = [s.scheme_id for s in schemes]

    app_filter = {"scheme_id": {"$in": scheme_ids}} if scheme_ids else {"scheme_id": "NONE"}
    if admin.tier == "national":
        app_filter = {}

    total_apps = await Application.find(app_filter).count()

    # Status breakdown
    approved = await Application.find({"overall_status": "approved", **app_filter}).count()
    rejected = await Application.find({"overall_status": "rejected", **app_filter}).count()
    pending = await Application.find({"overall_status": "pending_offline_verification", **app_filter}).count()

    return {
        "total_schemes": total_schemes,
        "active_schemes": active_schemes,
        "total_applications": total_apps,
        "approved": approved,
        "rejected": rejected,
        "pending_verification": pending,
        "approval_rate": round(approved / total_apps * 100, 1) if total_apps > 0 else 0
    }


@router.get("/analytics/citizens")
async def citizen_analytics(admin: Admin = Depends(require_admin)):
    query = {}
    if admin.tier == "state":
        query["profile.state"] = admin.jurisdiction.state
    elif admin.tier == "district":
        query["profile.state"] = admin.jurisdiction.state
        query["profile.district"] = admin.jurisdiction.district
    elif admin.tier == "taluka":
        query["profile.state"] = admin.jurisdiction.state
        query["profile.district"] = admin.jurisdiction.district
        query["profile.taluka"] = admin.jurisdiction.taluka

    total_citizens = await User.find(query).count()

    group_field = "$profile.state"
    if admin.tier in ["state", "district", "taluka"]:
        group_field = "$profile.district"

    pipeline = []
    if query:
        pipeline.append({"$match": query})

    pipeline.extend([
        {"$group": {"_id": group_field, "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ])
    from app.core.database import get_db
    db = get_db()
    state_breakdown = await db["users"].aggregate(pipeline).to_list(100)

    return {
        "total_citizens": total_citizens,
        "state_breakdown": [{
            "state": s["_id"] or "Unknown",
            "count": s["count"]
        } for s in state_breakdown]
    }


@router.get("/analytics/verifications")
async def verification_analytics(admin: Admin = Depends(require_admin)):
    total_verifications = await AuditLog.find(
        AuditLog.event_type.is_in(["offline_field_verified", "offline_field_rejected"])  # type: ignore
    ).count()

    query_filter = {}
    if admin.tier == "state":
        query_filter["scope_state"] = admin.jurisdiction.state
    elif admin.tier == "district":
        query_filter["scope_state"] = admin.jurisdiction.state
        query_filter["scope_district"] = admin.jurisdiction.district

    schemes = await Scheme.find(query_filter).project(SchemeIdProjection).to_list()
    scheme_ids = [s.scheme_id for s in schemes]

    app_filter = {"scheme_id": {"$in": scheme_ids}, "overall_status": "pending_offline_verification"}
    if admin.tier == "national":
        app_filter = {"overall_status": "pending_offline_verification"}

    pending_apps = await Application.find(app_filter).count()

    return {
        "total_verifications": total_verifications,
        "pending_applications": pending_apps
    }


# ── Helpers ─────────────────────────────────────────────────────

def _jurisdiction_match(admin: Admin, scheme: Scheme) -> bool:
    if admin.tier == "national":
        return True
    if admin.tier == "state":
        return scheme.scope_state == admin.jurisdiction.state
    if admin.tier == "district":
        return (scheme.scope_state == admin.jurisdiction.state and
                scheme.scope_district == admin.jurisdiction.district)
    if admin.tier == "taluka":
        return (scheme.scope_state == admin.jurisdiction.state and
                scheme.scope_district == admin.jurisdiction.district and
                scheme.scope_taluka == admin.jurisdiction.taluka)
    return False
