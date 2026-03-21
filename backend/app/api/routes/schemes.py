from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from app.core.dependencies import require_citizen
from app.models.user import User
from app.models.scheme import Scheme
from app.services.scheme_service import match_schemes_for_citizen

router = APIRouter()


@router.get("")
async def list_schemes(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    state: Optional[str] = None,
    benefit_type: Optional[str] = None,
    search: Optional[str] = None,
    scope: Optional[str] = None
):
    """List all active schemes with filtering and pagination."""
    query_filter = {"is_active": True}
    if category:
        query_filter["category"] = category
    if state:
        query_filter["$or"] = [
            {"scope": "national"},
            {"scope_state": state}
        ]
    if benefit_type:
        query_filter["benefit_type"] = benefit_type
    if scope:
        query_filter["scope"] = scope

    skip = (page - 1) * limit
    schemes = await Scheme.find(query_filter).skip(skip).limit(limit).to_list()
    total = await Scheme.find(query_filter).count()

    if search:
        schemes = [s for s in schemes if
                   search.lower() in (s.name.en or "").lower() or
                   search.lower() in (s.name.hi or "").lower()]

    return {
        "schemes": [_scheme_to_dict(s) for s in schemes],
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/match")
async def match_schemes(user: User = Depends(require_citizen)):
    """Run eligibility matching for the logged-in citizen."""
    eligible, near_miss = await match_schemes_for_citizen(
        profile=user.profile,
        state=user.profile.state,
        district=user.profile.district,
        taluka=user.profile.taluka
    )
    return {
        "eligible": eligible,
        "near_miss": near_miss,
        "total_eligible": len(eligible),
        "total_near_miss": len(near_miss),
        "total_annual_benefit": sum(s.get("benefit_amount", 0) for s in eligible)
    }


@router.get("/bundle")
async def download_scheme_bundle():
    """Download complete scheme database for offline caching."""
    schemes = await Scheme.find(Scheme.is_active == True).to_list()
    return {
        "schemes": [_scheme_to_full_dict(s) for s in schemes],
        "count": len(schemes),
        "bundle_version": 1
    }


@router.get("/{scheme_id}")
async def get_scheme(scheme_id: str):
    """Get single scheme with full form."""
    scheme = await Scheme.find_one(Scheme.scheme_id == scheme_id)
    if not scheme:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Scheme not found")
    return _scheme_to_full_dict(scheme)


def _scheme_to_dict(s: Scheme) -> dict:
    return {
        "scheme_id": s.scheme_id,
        "name": s.name.model_dump() if s.name else {},
        "description": s.description.model_dump() if s.description else {},
        "ministry": s.ministry,
        "department": s.department,
        "category": s.category,
        "benefit_type": s.benefit_type,
        "benefit_amount": s.benefit_amount,
        "benefit_frequency": s.benefit_frequency,
        "deadline": s.deadline.isoformat() if s.deadline else None,
        "is_active": s.is_active,
        "scope": s.scope,
        "scope_state": s.scope_state,
        "scope_district": s.scope_district,
        "scope_taluka": s.scope_taluka,
        "required_documents": s.required_documents
    }


def _scheme_to_full_dict(s: Scheme) -> dict:
    d = _scheme_to_dict(s)
    d["eligibility_rules"] = [r.model_dump() for r in s.eligibility_rules]
    d["application_form"] = s.application_form.model_dump() if s.application_form else None
    d["audio_url"] = s.audio_url
    d["created_at"] = s.created_at.isoformat() if s.created_at else None
    return d
