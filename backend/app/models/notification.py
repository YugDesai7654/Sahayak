from datetime import datetime
from typing import Optional
from beanie import Document, Indexed
from pydantic import Field
import uuid


class Notification(Document):
    notification_id: Indexed(str, unique=True) = Field(
        default_factory=lambda: f"NOTIF-{uuid.uuid4().hex[:12].upper()}"
    )
    user_id: Indexed(str)  # references User._id as string
    title: str
    body: str
    type: str = "scheme_suggestion"  # scheme_suggestion | deadline_reminder | status_update
    scheme_id: Optional[str] = None  # link to scheme if applicable
    is_read: bool = False
    priority: str = "medium"  # high | medium | low
    suggestion_score: Optional[float] = None  # NLP confidence 0-1
    match_reasons: list = Field(default_factory=list)  # why this scheme was suggested
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "notifications"
