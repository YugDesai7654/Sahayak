// ── Localized Text ─────────────────────────────────────────
export interface LocalizedText {
  en: string;
  hi: string;
  gu?: string;
}

// ── User / Citizen ─────────────────────────────────────────
export interface UserProfile {
  name?: string;
  dob?: string;
  gender?: string;
  aadhaar_last4?: string;
  phone?: string;
  state?: string;
  district?: string;
  taluka?: string;
  village?: string;
  pincode?: string;
  income_annual?: number;
  income_source?: string;
  caste_category?: string;
  religion?: string;
  occupation?: string;
  land_holding_acres?: number;
  is_bpl?: boolean;
  bpl_card_number?: string;
  disability_type?: string | null;
  disability_percentage?: number | null;
  is_minority?: boolean;
  education_level?: string;
  ration_card_type?: string | null;
  bank_account_number_last4?: string;
  ifsc_code?: string;
  profile_photo_url?: string | null;
}

export interface FamilyMember {
  member_id: string;
  relation: string;
  name: string;
  dob?: string;
  gender?: string;
  aadhaar_last4?: string;
  qr_token?: string;
}

export interface EnrolledScheme {
  scheme_id: string;
  scheme_name: string;
  enrolled_date: string;
  status: string;
  benefit_amount_annual: number;
  next_renewal_date?: string;
}

export interface User {
  sahayak_id: string;
  profile: UserProfile;
  family_members: FamilyMember[];
  enrolled_schemes: EnrolledScheme[];
  created_at?: string;
  email: string;
}

// ── Scheme ─────────────────────────────────────────────────
export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldValidation {
  min?: number | null;
  max?: number | null;
  pattern?: string | null;
  error_message: string;
}

export interface FormField {
  field_id: string;
  label: LocalizedText;
  type: string;
  options?: FieldOption[] | null;
  is_required: boolean;
  maps_to_profile?: string | null;
  requires_offline_verification: boolean;
  offline_verification_label?: string | null;
  validation: FieldValidation;
}

export interface FormSection {
  section_id: string;
  title: LocalizedText;
  fields: FormField[];
}

export interface ApplicationForm {
  form_id: string;
  sections: FormSection[];
}

export interface EligibilityRule {
  rule_id: string;
  field: string;
  operator: string;
  value: any;
  label: string;
  near_miss_threshold?: number | null;
  near_miss_tip?: string | null;
}

export interface Scheme {
  scheme_id: string;
  name: LocalizedText;
  description: LocalizedText;
  ministry: string;
  department: string;
  category: string[];
  benefit_type: string;
  benefit_amount: number;
  benefit_frequency: string;
  deadline?: string | null;
  is_active: boolean;
  scope: string;
  scope_state?: string | null;
  scope_district?: string | null;
  scope_taluka?: string | null;
  required_documents: string[];
  eligibility_rules: EligibilityRule[];
  application_form?: ApplicationForm | null;
  audio_url?: Record<string, string> | null;
  created_at?: string;
}

export interface SchemeMatchResult {
  scheme_id: string;
  name: LocalizedText;
  description: LocalizedText;
  ministry: string;
  department: string;
  category: string[];
  benefit_type: string;
  benefit_amount: number;
  benefit_frequency: string;
  deadline?: string | null;
  scope: string;
  required_documents: string[];
  near_miss_rule?: {
    field: string;
    label: string;
    tip: string;
  };
}

// ── Application ────────────────────────────────────────────
export interface OfflineVerificationField {
  field_id: string;
  label: string;
  offline_verification_label: string;
  status: string;
  verified_by_officer_id?: string | null;
  verified_at?: string | null;
  officer_note?: string | null;
  proof_photo_url?: string | null;
}

export interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  actor: string;
  note: string;
}

export interface Application {
  application_id: string;
  scheme_id: string;
  scheme_name: string;
  overall_status: string;
  submitted_at?: string | null;
  last_updated_at?: string | null;
  has_offline_fields: boolean;
  pending_offline_count: number;
  digital_form_data?: Record<string, any>;
  offline_verification_fields?: OfflineVerificationField[];
  status_history?: StatusHistoryEntry[];
  documents_uploaded?: any[];
  rejection_reason?: string | null;
  benefit_received?: number;
  all_offline_verified?: boolean;
}

// ── Officer ────────────────────────────────────────────────
export interface OfficerInfo {
  officer_id: string;
  name: string;
  email: string;
  office_name: string;
  district: string;
  department: string;
}

// ── Admin ──────────────────────────────────────────────────
export interface AdminJurisdiction {
  state?: string | null;
  district?: string | null;
  taluka?: string | null;
}

export interface AdminInfo {
  admin_id: string;
  name: string;
  email: string;
  tier: string;
  jurisdiction: AdminJurisdiction;
  must_change_password?: boolean;
}

// ── Auth ───────────────────────────────────────────────────
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    sahayak_id?: string;
    officer_id?: string;
    admin_id?: string;
    name: string;
    email: string;
    role: string;
    tier?: string;
    jurisdiction?: AdminJurisdiction;
    office_name?: string;
    district?: string;
    department?: string;
    must_change_password?: boolean;
  };
}

// ── QR ─────────────────────────────────────────────────────
export interface QRTokenData {
  sahayak_id: string;
  signed_jwt: string;
  token_version: number;
  issued_at: string;
  expires_at: string;
}
