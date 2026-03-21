from typing import List, Dict, Any, Optional, Tuple
from app.models.scheme import Scheme
from app.models.user import UserProfile


def evaluate_rule(profile: UserProfile, rule_field: str, operator: str, value: Any) -> bool:
    """Evaluate a single eligibility rule against a user profile."""
    profile_dict = profile.model_dump()
    actual = profile_dict.get(rule_field)

    if actual is None:
        return False

    try:
        if operator == "eq":
            return actual == value
        elif operator == "neq":
            return actual != value
        elif operator == "lt":
            return float(actual) < float(value)
        elif operator == "lte":
            return float(actual) <= float(value)
        elif operator == "gt":
            return float(actual) > float(value)
        elif operator == "gte":
            return float(actual) >= float(value)
        elif operator == "in":
            if isinstance(value, list):
                return actual in value
            return actual == value
        elif operator == "not_in":
            if isinstance(value, list):
                return actual not in value
            return actual != value
        else:
            return False
    except (TypeError, ValueError):
        return False


def check_near_miss(profile: UserProfile, rule_field: str, operator: str,
                     value: Any, threshold: float) -> bool:
    """Check if a failing rule is within the near-miss threshold."""
    profile_dict = profile.model_dump()
    actual = profile_dict.get(rule_field)

    if actual is None or threshold is None:
        return False

    try:
        actual_num = float(actual)
        value_num = float(value)

        if value_num == 0:
            return False

        pct_diff = abs(actual_num - value_num) / value_num * 100
        return pct_diff <= threshold
    except (TypeError, ValueError):
        return False


async def match_schemes_for_citizen(
    profile: UserProfile,
    state: Optional[str] = None,
    district: Optional[str] = None,
    taluka: Optional[str] = None
) -> Tuple[List[dict], List[dict]]:
    """
    Match all active schemes against citizen profile.
    Returns (eligible_schemes, near_miss_schemes).
    Uses the 4-tier scope matching.
    """
    # Build scope filter: citizen sees national + their state + district + taluka
    scope_filter = {"$or": [
        {"scope": "national"},
    ]}
    if state:
        scope_filter["$or"].append({"scope": "state", "scope_state": state})
    if state and district:
        scope_filter["$or"].append({
            "scope": "district",
            "scope_state": state,
            "scope_district": district
        })
    if state and district and taluka:
        scope_filter["$or"].append({
            "scope": "taluka",
            "scope_state": state,
            "scope_district": district,
            "scope_taluka": taluka
        })

    query = {"is_active": True, **scope_filter}
    schemes = await Scheme.find(query).to_list()

    eligible = []
    near_miss = []

    for scheme in schemes:
        if not scheme.eligibility_rules:
            # No rules → auto-eligible
            eligible.append(_scheme_to_match_result(scheme, []))
            continue

        failed_rules = []
        for rule in scheme.eligibility_rules:
            if not evaluate_rule(profile, rule.field, rule.operator, rule.value):
                failed_rules.append(rule)

        if len(failed_rules) == 0:
            eligible.append(_scheme_to_match_result(scheme, []))
        elif len(failed_rules) == 1:
            rule = failed_rules[0]
            if rule.near_miss_threshold and check_near_miss(
                profile, rule.field, rule.operator, rule.value, rule.near_miss_threshold
            ):
                result = _scheme_to_match_result(scheme, failed_rules)
                result["near_miss_rule"] = {
                    "field": rule.field,
                    "label": rule.label,
                    "tip": rule.near_miss_tip or ""
                }
                near_miss.append(result)

    # Sort by benefit amount desc
    eligible.sort(key=lambda x: x.get("benefit_amount", 0), reverse=True)
    near_miss.sort(key=lambda x: x.get("benefit_amount", 0), reverse=True)

    return eligible, near_miss


def _scheme_to_match_result(scheme: Scheme, failed_rules: list) -> dict:
    return {
        "scheme_id": scheme.scheme_id,
        "name": scheme.name.model_dump() if scheme.name else {},
        "description": scheme.description.model_dump() if scheme.description else {},
        "ministry": scheme.ministry,
        "department": scheme.department,
        "category": scheme.category,
        "benefit_type": scheme.benefit_type,
        "benefit_amount": scheme.benefit_amount,
        "benefit_frequency": scheme.benefit_frequency,
        "deadline": scheme.deadline.isoformat() if scheme.deadline else None,
        "scope": scheme.scope,
        "scope_state": scheme.scope_state,
        "required_documents": scheme.required_documents,
        "has_offline_verification": any(
            f.requires_offline_verification
            for s in (scheme.application_form.sections if scheme.application_form else [])
            for f in s.fields
        )
    }
