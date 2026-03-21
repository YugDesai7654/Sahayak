from datetime import datetime
from typing import Optional, List, Any, Dict
from beanie import Document, Indexed
from pydantic import BaseModel, Field


class OfflineVerificationField(BaseModel):
    field_id: str
    label: str
    offline_verification_label: str
    status: str = "pending"  # pending|verified|rejected
    verified_by_officer_id: Optional[str] = None
    verified_at: Optional[datetime] = None
    officer_note: Optional[str] = None
    proof_photo_url: Optional[str] = None


class StatusHistoryEntry(BaseModel):
    status: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    actor: str  # "citizen" or officer_id or "system"
    note: str = ""


class UploadedDocument(BaseModel):
    document_name: str
    file_url: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


class Application(Document):
    application_id: Indexed(str, unique=True)
    user_id: str  # references User._id as string
    scheme_id: str
    scheme_name: str

    digital_form_data: Dict[str, Any] = Field(default_factory=dict)

    offline_verification_fields: List[OfflineVerificationField] = Field(default_factory=list)

    overall_status: str = "draft"
    # draft|submitted|pending_offline_verification|under_review|approved|rejected

    all_offline_verified: bool = False

    status_history: List[StatusHistoryEntry] = Field(default_factory=list)
    documents_uploaded: List[UploadedDocument] = Field(default_factory=list)

    submitted_at: Optional[datetime] = None
    last_updated_at: datetime = Field(default_factory=datetime.utcnow)
    rejection_reason: Optional[str] = None
    benefit_received: float = 0

    class Settings:
        name = "applications"
