"""
NLP-based Scheme Suggestion Engine
Uses TF-IDF + cosine similarity to match citizen profiles against scheme descriptions,
combined with rule-based eligibility for ranked recommendations.
"""
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from app.models.scheme import Scheme
from app.models.user import User, UserProfile
from app.models.notification import Notification
from app.services.scheme_service import match_schemes_for_citizen

logger = logging.getLogger(__name__)


def build_profile_text(profile: UserProfile) -> str:
    """Convert a UserProfile into a natural language text for NLP matching."""
    parts = []

    if profile.gender:
        parts.append(profile.gender)
    if profile.occupation:
        parts.append(f"occupation {profile.occupation}")
    if profile.caste_category:
        parts.append(f"caste category {profile.caste_category}")
    if profile.state:
        parts.append(f"state {profile.state}")
    if profile.district:
        parts.append(f"district {profile.district}")
    if profile.taluka:
        parts.append(f"taluka {profile.taluka}")
    if profile.income_annual is not None:
        if profile.income_annual <= 100000:
            parts.append("very low income below poverty line economically weaker")
        elif profile.income_annual <= 200000:
            parts.append("low income economically weaker section EWS")
        elif profile.income_annual <= 300000:
            parts.append("lower middle income")
        else:
            parts.append("middle income")
    if profile.is_bpl:
        parts.append("BPL below poverty line poor family")
    if profile.occupation and profile.occupation.lower() == "farmer":
        parts.append("agriculture farming kisan cultivator crop land")
    if profile.land_holding_acres and profile.land_holding_acres > 0:
        if profile.land_holding_acres <= 2:
            parts.append("small marginal farmer")
        elif profile.land_holding_acres <= 5:
            parts.append("small farmer")
        else:
            parts.append("medium farmer")
    if profile.disability_type:
        parts.append(f"disability {profile.disability_type} divyang physically challenged handicapped")
    if profile.disability_percentage and profile.disability_percentage > 0:
        parts.append(f"disability percentage {profile.disability_percentage}")
    if profile.education_level:
        parts.append(f"education {profile.education_level}")
    if profile.is_minority:
        parts.append("minority community")
    if profile.religion:
        parts.append(f"religion {profile.religion}")
    if profile.ration_card_type:
        parts.append(f"ration card {profile.ration_card_type}")
    if profile.dob:
        age = _calculate_age(profile.dob)
        if age:
            parts.append(f"age {age}")
            if age < 18:
                parts.append("child minor youth")
            elif age < 25:
                parts.append("youth young adult student")
            elif age < 60:
                parts.append("adult working age")
            else:
                parts.append("senior citizen elderly old age pensioner")
    if profile.income_source:
        parts.append(f"income source {profile.income_source}")

    return " ".join(parts)


def build_scheme_text(scheme: Scheme) -> str:
    """Convert a Scheme into a searchable text for NLP matching."""
    parts = []

    # Name
    if scheme.name:
        if scheme.name.en:
            parts.append(scheme.name.en)
        if scheme.name.hi:
            parts.append(scheme.name.hi)

    # Description
    if scheme.description:
        if scheme.description.en:
            parts.append(scheme.description.en)

    # Category
    if scheme.category:
        parts.extend(scheme.category)

    # Department/Ministry
    if scheme.ministry:
        parts.append(scheme.ministry)
    if scheme.department:
        parts.append(scheme.department)

    # Benefit type
    if scheme.benefit_type:
        parts.append(f"benefit {scheme.benefit_type}")

    # Scope info
    if scheme.scope:
        parts.append(f"scope {scheme.scope}")
    if scheme.scope_state:
        parts.append(f"state {scheme.scope_state}")
    if scheme.scope_district:
        parts.append(f"district {scheme.scope_district}")

    # Eligibility rule labels
    for rule in scheme.eligibility_rules:
        if rule.label:
            parts.append(rule.label)
        if rule.near_miss_tip:
            parts.append(rule.near_miss_tip)

    return " ".join(parts)


def _calculate_age(dob: datetime) -> Optional[int]:
    """Calculate age from date of birth."""
    if not dob:
        return None
    today = datetime.utcnow()
    age = today.year - dob.year
    if (today.month, today.day) < (dob.month, dob.day):
        age -= 1
    return age


async def get_smart_suggestions(
    user: User,
    top_n: int = 10,
    similarity_threshold: float = 0.05
) -> List[Dict[str, Any]]:
    """
    Generate NLP-powered scheme suggestions for a user.
    Combines rule-based eligibility with NLP similarity scoring.
    Returns ranked list of suggested schemes with scores and reasons.
    """
    profile = user.profile

    # 1. Get all active schemes
    all_schemes = await Scheme.find({"is_active": True}).to_list()
    if not all_schemes:
        return []

    # 2. Get already enrolled scheme IDs to exclude
    enrolled_ids = {es.scheme_id for es in user.enrolled_schemes}

    # 3. Run rule-based matching
    eligible_schemes, near_miss_schemes = await match_schemes_for_citizen(
        profile=profile,
        state=profile.state,
        district=profile.district,
        taluka=profile.taluka
    )
    eligible_ids = {s["scheme_id"] for s in eligible_schemes}
    near_miss_ids = {s["scheme_id"] for s in near_miss_schemes}

    # 4. Build NLP texts
    profile_text = build_profile_text(profile)
    scheme_texts = [build_scheme_text(s) for s in all_schemes]

    # 5. Compute TF-IDF cosine similarity
    try:
        all_texts = [profile_text] + scheme_texts
        vectorizer = TfidfVectorizer(
            stop_words='english',
            max_features=5000,
            ngram_range=(1, 2),
            min_df=1
        )
        tfidf_matrix = vectorizer.fit_transform(all_texts)
        similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    except Exception as e:
        logger.error(f"TF-IDF computation failed: {e}")
        similarities = np.zeros(len(all_schemes))

    # 6. Build suggestion list with combined scoring
    suggestions = []
    for i, scheme in enumerate(all_schemes):
        # Skip already enrolled
        if scheme.scheme_id in enrolled_ids:
            continue

        nlp_score = float(similarities[i])
        rule_score = 0.0
        match_reasons = []
        priority = "medium"

        # Scope check: citizen should only see schemes in their region
        if not _scope_matches(scheme, profile):
            continue

        if scheme.scheme_id in eligible_ids:
            rule_score = 1.0
            match_reasons.append("You meet all eligibility criteria")
            priority = "high"
        elif scheme.scheme_id in near_miss_ids:
            rule_score = 0.7
            nm = next((s for s in near_miss_schemes if s["scheme_id"] == scheme.scheme_id), None)
            if nm and nm.get("near_miss_rule"):
                tip = nm["near_miss_rule"].get("tip", "")
                match_reasons.append(f"Near miss: {tip}" if tip else "You nearly qualify for this scheme")
            priority = "medium"
        else:
            # Only NLP match: check if similarity is above threshold
            if nlp_score < similarity_threshold:
                continue
            match_reasons.append("Matched based on your profile characteristics")
            priority = "low"

        # Combined score: weighted average
        combined_score = (rule_score * 0.7) + (nlp_score * 0.3)

        # Build reason explanations
        if profile.occupation and scheme.category:
            if profile.occupation.lower() == "farmer" and "agriculture" in scheme.category:
                match_reasons.append("Relevant to your occupation as a farmer")
            elif "education" in scheme.category:
                match_reasons.append("Educational benefits available")

        if profile.caste_category and profile.caste_category in ["SC", "ST", "OBC"]:
            for rule in scheme.eligibility_rules:
                if rule.field == "caste_category" and profile.caste_category in (
                    rule.value if isinstance(rule.value, list) else [rule.value]
                ):
                    match_reasons.append(f"Available for {profile.caste_category} category")
                    break

        if profile.is_bpl:
            for rule in scheme.eligibility_rules:
                if rule.field == "is_bpl":
                    match_reasons.append("Available for BPL families")
                    break

        if scheme.scope_state and scheme.scope_state == profile.state:
            match_reasons.append(f"Available in your state: {profile.state}")

        suggestions.append({
            "scheme_id": scheme.scheme_id,
            "name": scheme.name.model_dump() if scheme.name else {},
            "description": scheme.description.model_dump() if scheme.description else {},
            "ministry": scheme.ministry,
            "department": scheme.department,
            "category": scheme.category,
            "benefit_type": scheme.benefit_type,
            "benefit_amount": scheme.benefit_amount,
            "benefit_frequency": scheme.benefit_frequency,
            "scope": scheme.scope,
            "scope_state": scheme.scope_state,
            "deadline": scheme.deadline.isoformat() if scheme.deadline else None,
            "required_documents": scheme.required_documents,
            "combined_score": round(combined_score, 3),
            "nlp_score": round(nlp_score, 3),
            "rule_score": round(rule_score, 3),
            "match_reasons": list(set(match_reasons)),  # deduplicate
            "priority": priority,
            "is_eligible": scheme.scheme_id in eligible_ids,
            "is_near_miss": scheme.scheme_id in near_miss_ids,
        })

    # 7. Sort by combined score (descending)
    suggestions.sort(key=lambda x: x["combined_score"], reverse=True)

    return suggestions[:top_n]


def _scope_matches(scheme: Scheme, profile: UserProfile) -> bool:
    """Check if a scheme's geographic scope matches the user's location."""
    if scheme.scope == "national":
        return True
    if scheme.scope == "state":
        return scheme.scope_state == profile.state
    if scheme.scope == "district":
        return (scheme.scope_state == profile.state and
                scheme.scope_district == profile.district)
    if scheme.scope == "taluka":
        return (scheme.scope_state == profile.state and
                scheme.scope_district == profile.district and
                scheme.scope_taluka == profile.taluka)
    return True


async def generate_suggestion_notifications(user: User) -> int:
    """
    Generate in-app notifications for a user's top scheme suggestions.
    Returns number of new notifications created.
    """
    suggestions = await get_smart_suggestions(user, top_n=15, similarity_threshold=0.05)

    # Get existing notification scheme_ids to avoid duplicates
    existing = await Notification.find(
        {"user_id": str(user.id), "type": "scheme_suggestion"}
    ).to_list()
    existing_scheme_ids = {n.scheme_id for n in existing if n.scheme_id}

    count = 0
    for suggestion in suggestions:
        if suggestion["scheme_id"] in existing_scheme_ids:
            continue

        # Build notification text
        name = suggestion["name"].get("en", "Government Scheme")
        benefit = suggestion["benefit_amount"]
        benefit_type = suggestion["benefit_type"]
        frequency = suggestion["benefit_frequency"]

        if benefit > 0:
            if benefit_type == "cash":
                body = f"You may be eligible for ₹{benefit:,.0f}/{frequency} under {name}."
            elif benefit_type == "insurance":
                body = f"Get health coverage of ₹{benefit:,.0f} under {name}."
            elif benefit_type == "subsidy":
                body = f"Subsidy of ₹{benefit:,.0f} available under {name}."
            elif benefit_type == "scholarship":
                body = f"Scholarship of ₹{benefit:,.0f}/{frequency} under {name}."
            elif benefit_type == "pension":
                body = f"Pension of ₹{benefit:,.0f}/{frequency} under {name}."
            else:
                body = f"Benefits available under {name}. Estimated value: ₹{benefit:,.0f}."
        else:
            body = f"You may be eligible for {name}. Check your eligibility now!"

        if suggestion["match_reasons"]:
            body += f" {suggestion['match_reasons'][0]}."

        notification = Notification(
            user_id=str(user.id),
            title=f"🎯 New Scheme Suggestion: {name}",
            body=body,
            type="scheme_suggestion",
            scheme_id=suggestion["scheme_id"],
            priority=suggestion["priority"],
            suggestion_score=suggestion["combined_score"],
            match_reasons=suggestion["match_reasons"],
        )
        await notification.insert()
        count += 1

    logger.info(f"Generated {count} new suggestion notifications for user {user.sahayak_id}")
    return count
