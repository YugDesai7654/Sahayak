from datetime import datetime
from typing import Optional, Any, Dict
from beanie import Document
from pydantic import Field


class AuditLog(Document):
    event_type: str
    # qr_scan|offline_field_verified|offline_field_rejected|scheme_applied
    # |application_status_changed|login|profile_update|form_submitted
    user_id: Optional[str] = None
    actor_id: str
    actor_role: str  # citizen|officer|admin
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    ip_address: str = ""

    class Settings:
        name = "audit_logs"
