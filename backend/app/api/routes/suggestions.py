from fastapi import APIRouter, Depends, BackgroundTasks
from app.core.dependencies import require_citizen
from app.models.user import User
from app.services.nlp_suggestion_service import get_smart_suggestions, generate_suggestion_notifications

router = APIRouter()


@router.get("")
async def get_suggestions(user: User = Depends(require_citizen)):
    """Get NLP-powered scheme suggestions for the logged-in citizen."""
    suggestions = await get_smart_suggestions(user, top_n=10, similarity_threshold=0.05)

    total_potential_benefit = sum(
        s["benefit_amount"] for s in suggestions if s["is_eligible"]
    )

    return {
        "suggestions": suggestions,
        "total": len(suggestions),
        "eligible_count": sum(1 for s in suggestions if s["is_eligible"]),
        "near_miss_count": sum(1 for s in suggestions if s["is_near_miss"]),
        "total_potential_benefit": total_potential_benefit,
    }


@router.post("/refresh")
async def refresh_suggestions(
    background_tasks: BackgroundTasks,
    user: User = Depends(require_citizen)
):
    """Force re-compute suggestions and generate notifications."""
    count = await generate_suggestion_notifications(user)
    return {
        "message": f"Suggestions refreshed. {count} new notifications generated.",
        "new_notifications": count
    }
