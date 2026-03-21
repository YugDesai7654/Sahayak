from datetime import datetime
from typing import Optional
from beanie import Document, Indexed
from pydantic import BaseModel, Field


class OfficerAuth(BaseModel):
    email: Indexed(str, unique=True)
    password_hash: str
    is_active: bool = True


class Officer(Document):
    officer_id: Indexed(str, unique=True)
    auth: OfficerAuth
    name: str
    designation: str
    office_name: str
    office_address: str
    state: str
    district: str
    department: str
    created_by_district_admin_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "officers"
