from datetime import datetime
from typing import Optional
from beanie import Document, Indexed
from pydantic import BaseModel, Field


class AdminAuth(BaseModel):
    email: Indexed(str, unique=True)
    password_hash: str
    is_active: bool = True


class AdminJurisdiction(BaseModel):
    state: Optional[str] = None
    district: Optional[str] = None
    taluka: Optional[str] = None


class Admin(Document):
    admin_id: Indexed(str, unique=True)
    auth: AdminAuth
    name: str
    tier: str  # national|state|district|taluka
    jurisdiction: AdminJurisdiction = Field(default_factory=AdminJurisdiction)
    created_by: Optional[str] = None  # admin_id of creator
    created_by_tier: Optional[str] = None
    must_change_password: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login_at: Optional[datetime] = None

    class Settings:
        name = "admins"
