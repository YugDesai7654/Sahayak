from datetime import datetime
from typing import Optional, List
from beanie import Document, Indexed
from pydantic import BaseModel, Field
import uuid


class UserAuth(BaseModel):
    email: Indexed(str, unique=True)
    password_hash: str
    is_verified: bool = False
    verification_token: Optional[str] = None


class FamilyMember(BaseModel):
    member_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    relation: str  # spouse, child, parent, sibling
    name: str
    dob: Optional[datetime] = None
    gender: Optional[str] = None
    aadhaar_last4: Optional[str] = None
    qr_token: Optional[str] = None


class EnrolledScheme(BaseModel):
    scheme_id: str
    scheme_name: str
    enrolled_date: datetime = Field(default_factory=datetime.utcnow)
    status: str = "draft"  # draft|submitted|pending_offline_verification|under_review|approved|rejected
    benefit_amount_annual: float = 0
    next_renewal_date: Optional[datetime] = None


class UserProfile(BaseModel):
    name: Optional[str] = None
    dob: Optional[datetime] = None
    gender: Optional[str] = None  # male|female|other
    aadhaar_last4: Optional[str] = None
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    taluka: Optional[str] = None
    village: Optional[str] = None
    pincode: Optional[str] = None
    income_annual: Optional[float] = None
    income_source: Optional[str] = None
    caste_category: Optional[str] = None  # general|OBC|SC|ST
    religion: Optional[str] = None
    occupation: Optional[str] = None
    land_holding_acres: Optional[float] = None
    is_bpl: Optional[bool] = None
    bpl_card_number: Optional[str] = None
    disability_type: Optional[str] = None
    disability_percentage: Optional[float] = None
    is_minority: Optional[bool] = None
    education_level: Optional[str] = None
    ration_card_type: Optional[str] = None  # APL|BPL|AAY|null
    bank_account_number_last4: Optional[str] = None
    ifsc_code: Optional[str] = None
    profile_photo_url: Optional[str] = None


class User(Document):
    sahayak_id: Indexed(str, unique=True)
    auth: UserAuth
    profile: UserProfile = Field(default_factory=UserProfile)
    family_members: List[FamilyMember] = Field(default_factory=list)
    enrolled_schemes: List[EnrolledScheme] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_synced_at: Optional[datetime] = None

    class Settings:
        name = "users"
