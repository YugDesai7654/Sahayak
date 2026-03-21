from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.dependencies import require_citizen
from app.models.user import User
from app.models.notification import Notification

router = APIRouter()


@router.get("")
async def list_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    type: Optional[str] = None,
    unread_only: bool = False,
    user: User = Depends(require_citizen)
):
    """List notifications for the logged-in citizen."""
    query_filter = {"user_id": str(user.id)}
    if type:
        query_filter["type"] = type
    if unread_only:
        query_filter["is_read"] = False

    skip = (page - 1) * limit
    notifications = await Notification.find(query_filter).sort(
        "-created_at"
    ).skip(skip).limit(limit).to_list()
    total = await Notification.find(query_filter).count()

    return {
        "notifications": [_notif_to_dict(n) for n in notifications],
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/unread-count")
async def unread_count(user: User = Depends(require_citizen)):
    """Get count of unread notifications for badge display."""
    count = await Notification.find(
        {"user_id": str(user.id), "is_read": False}
    ).count()
    return {"unread_count": count}


@router.patch("/{notification_id}/read")
async def mark_read(notification_id: str, user: User = Depends(require_citizen)):
    """Mark a single notification as read."""
    notif = await Notification.find_one(
        Notification.notification_id == notification_id,
        Notification.user_id == str(user.id)
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    await notif.save()
    return {"message": "Marked as read"}


@router.post("/mark-all-read")
async def mark_all_read(user: User = Depends(require_citizen)):
    """Mark all notifications as read."""
    result = await Notification.find(
        {"user_id": str(user.id), "is_read": False}
    ).update_many({"$set": {"is_read": True}})
    return {"message": "All marked as read"}


@router.delete("/{notification_id}")
async def dismiss_notification(notification_id: str, user: User = Depends(require_citizen)):
    """Dismiss/delete a notification."""
    notif = await Notification.find_one(
        Notification.notification_id == notification_id,
        Notification.user_id == str(user.id)
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    await notif.delete()
    return {"message": "Notification dismissed"}


def _notif_to_dict(n: Notification) -> dict:
    return {
        "notification_id": n.notification_id,
        "title": n.title,
        "body": n.body,
        "type": n.type,
        "scheme_id": n.scheme_id,
        "is_read": n.is_read,
        "priority": n.priority,
        "suggestion_score": n.suggestion_score,
        "match_reasons": n.match_reasons,
        "created_at": n.created_at.isoformat() if n.created_at else None,
    }
