from datetime import datetime
from typing import Optional, List, Any, Dict
from beanie import Document, Indexed
from pydantic import BaseModel, Field


class LocalizedText(BaseModel):
    en: str = ""
    hi: str = ""
    gu: str = ""


class FieldValidation(BaseModel):
    min: Optional[float] = None
    max: Optional[float] = None
    pattern: Optional[str] = None
    error_message: str = ""


class FieldOption(BaseModel):
    value: str
    label: str


class FormField(BaseModel):
    field_id: str
    label: LocalizedText = Field(default_factory=LocalizedText)
    type: str = "text"  # text|number|date|select|radio|checkbox|file|textarea
    options: Optional[List[FieldOption]] = None
    is_required: bool = False
    maps_to_profile: Optional[str] = None
    requires_offline_verification: bool = False
    offline_verification_label: Optional[str] = None
    validation: FieldValidation = Field(default_factory=FieldValidation)


class FormSection(BaseModel):
    section_id: str
    title: LocalizedText = Field(default_factory=LocalizedText)
    fields: List[FormField] = Field(default_factory=list)


class ApplicationForm(BaseModel):
    form_id: str
    sections: List[FormSection] = Field(default_factory=list)


class EligibilityRule(BaseModel):
    rule_id: str
    field: str  # must match a users.profile field
    operator: str  # eq|neq|lt|lte|gt|gte|in|not_in
    value: Any
    label: str = ""
    near_miss_threshold: Optional[float] = None
    near_miss_tip: Optional[str] = None


class Scheme(Document):
    scheme_id: Indexed(str, unique=True)
    name: LocalizedText = Field(default_factory=LocalizedText)
    description: LocalizedText = Field(default_factory=LocalizedText)
    ministry: str = ""
    department: str = ""
    state: str = "central"  # "central" = all India, else state name
    category: List[str] = Field(default_factory=list)
    benefit_type: str = "cash"  # cash|subsidy|insurance|pension|scholarship|other
    benefit_amount: float = 0
    benefit_frequency: str = "annual"  # monthly|annual|one-time
    deadline: Optional[datetime] = None
    is_active: bool = True

    eligibility_rules: List[EligibilityRule] = Field(default_factory=list)
    application_form: Optional[ApplicationForm] = None
    required_documents: List[str] = Field(default_factory=list)

    # Scope fields for 4-tier hierarchy
    scope: str = "national"  # national|state|district|taluka
    scope_state: Optional[str] = None
    scope_district: Optional[str] = None
    scope_taluka: Optional[str] = None
    created_by_admin_id: Optional[str] = None
    created_by_tier: Optional[str] = None

    # Audio explainer
    audio_url: Optional[Dict[str, str]] = None  # {en: url, hi: url}

    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "schemes"
