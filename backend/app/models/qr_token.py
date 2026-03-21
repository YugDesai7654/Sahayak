from datetime import datetime
from typing import Optional, List
from beanie import Document, Indexed
from pydantic import BaseModel, Field


class ScanLogEntry(BaseModel):
    scanned_by_officer_id: str
    officer_name: str
    office_name: str
    purpose: str = ""
    scanned_at: datetime = Field(default_factory=datetime.utcnow)


class QRToken(Document):
    user_id: str
    sahayak_id: Indexed(str)
    token_version: int = 1
    signed_jwt: str
    issued_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    is_revoked: bool = False
    scan_log: List[ScanLogEntry] = Field(default_factory=list)

    class Settings:
        name = "qr_tokens"
