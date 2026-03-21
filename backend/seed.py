"""
Sahayak Seed Script
Run: python seed.py
Seeds: hierarchy admins, officer, citizen, and 15+ schemes
"""
import asyncio
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.core.config import settings
from app.core.security import hash_password, load_keys
from app.models.user import User, UserAuth, UserProfile, EnrolledScheme
from app.models.officer import Officer, OfficerAuth
from app.models.admin import Admin, AdminAuth, AdminJurisdiction
from app.models.scheme import (
    Scheme, LocalizedText, ApplicationForm, FormSection, FormField,
    FieldValidation, FieldOption, EligibilityRule
)
from app.models.application import Application
from app.models.qr_token import QRToken
from app.models.audit_log import AuditLog


async def seed():
    load_keys()
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    await init_beanie(database=db, document_models=[
        User, Officer, Admin, Scheme, Application, QRToken, AuditLog
    ])

    # Clear existing data
    for model in [User, Officer, Admin, Scheme, Application, QRToken, AuditLog]:
        await model.find_all().delete()

    print("🌱 Seeding Sahayak database...")

    # ── 1. Admin hierarchy ─────────────────────
    national = Admin(
        admin_id="ADM-NAT-ALL-001",
        auth=AdminAuth(email="national@sahayak.gov.in", password_hash=hash_password("National@123")),
        name="National Super Admin",
        tier="national",
        jurisdiction=AdminJurisdiction(),
    )
    await national.insert()
    print("  ✅ National admin created")

    gujarat = Admin(
        admin_id="ADM-ST-GUJ-001",
        auth=AdminAuth(email="gujarat@sahayak.gov.in", password_hash=hash_password("Gujarat@123")),
        name="Gujarat State Admin",
        tier="state",
        jurisdiction=AdminJurisdiction(state="Gujarat"),
        created_by="ADM-NAT-ALL-001",
        created_by_tier="national",
    )
    await gujarat.insert()
    print("  ✅ Gujarat state admin created")

    ahmedabad = Admin(
        admin_id="ADM-DIS-AHM-001",
        auth=AdminAuth(email="ahmedabad@sahayak.gov.in", password_hash=hash_password("Ahmedabad@123")),
        name="Ahmedabad District Admin",
        tier="district",
        jurisdiction=AdminJurisdiction(state="Gujarat", district="Ahmedabad"),
        created_by="ADM-ST-GUJ-001",
        created_by_tier="state",
    )
    await ahmedabad.insert()
    print("  ✅ Ahmedabad district admin created")

    daskroi = Admin(
        admin_id="ADM-TAL-DAS-001",
        auth=AdminAuth(email="daskroi@sahayak.gov.in", password_hash=hash_password("Daskroi@123")),
        name="Daskroi Taluka Admin",
        tier="taluka",
        jurisdiction=AdminJurisdiction(state="Gujarat", district="Ahmedabad", taluka="Daskroi"),
        created_by="ADM-DIS-AHM-001",
        created_by_tier="district",
    )
    await daskroi.insert()
    print("  ✅ Daskroi taluka admin created")

    # Also create original admin and Rajasthan test officer
    Admin(
        admin_id="ADM-NAT-ALL-000",
        auth=AdminAuth(email="admin@sahayak.gov.in", password_hash=hash_password("Admin@123")),
        name="System Admin",
        tier="national",
        jurisdiction=AdminJurisdiction(),
    )
    await Admin.find_one(Admin.admin_id == "ADM-NAT-ALL-000") or await Admin(
        admin_id="ADM-NAT-ALL-000",
        auth=AdminAuth(email="admin@sahayak.gov.in", password_hash=hash_password("Admin@123")),
        name="System Admin",
        tier="national",
        jurisdiction=AdminJurisdiction(),
    ).insert()

    # ── 2. Officers ────────────────────────────
    off_ahm = Officer(
        officer_id="OFF-AHM-001",
        auth=OfficerAuth(email="officer.ahmedabad@sahayak.gov.in", password_hash=hash_password("Officer@123")),
        name="Rajesh Patel",
        designation="Talati cum Mantri",
        office_name="Daskroi Taluka Office",
        office_address="Block Development Office, Daskroi, Ahmedabad",
        state="Gujarat",
        district="Ahmedabad",
        department="Revenue",
        created_by_district_admin_id="ADM-DIS-AHM-001"
    )
    await off_ahm.insert()

    off_raj = Officer(
        officer_id="OFF-JAI-001",
        auth=OfficerAuth(email="officer.rajasthan@sahayak.gov.in", password_hash=hash_password("Officer@123")),
        name="Suresh Kumar",
        designation="Block Development Officer",
        office_name="District Collectorate, Jaipur",
        office_address="Lal Kothi, Tonk Road, Jaipur, Rajasthan",
        state="Rajasthan",
        district="Jaipur",
        department="Social Welfare",
    )
    await off_raj.insert()
    print("  ✅ Officers created")

    # ── 3. Test Citizen ────────────────────────
    citizen = User(
        sahayak_id="SAH-2024-GJ-00001",
        auth=UserAuth(email="test@citizen.in", password_hash=hash_password("Citizen@123"), is_verified=True),
        profile=UserProfile(
            name="Ramesh Solanki",
            dob=datetime(1985, 3, 15),
            gender="male",
            aadhaar_last4="4821",
            phone="9876543210",
            state="Gujarat",
            district="Ahmedabad",
            taluka="Daskroi",
            village="Bavla",
            pincode="382220",
            income_annual=80000,
            income_source="Agriculture",
            caste_category="SC",
            religion="Hindu",
            occupation="Farmer",
            land_holding_acres=2.5,
            is_bpl=True,
            bpl_card_number="GJ-AHM-2024-001",
            disability_type=None,
            disability_percentage=None,
            is_minority=False,
            education_level="10th Pass",
            ration_card_type="BPL",
            bank_account_number_last4="7890",
            ifsc_code="SBIN0001234",
        ),
    )
    await citizen.insert()
    print("  ✅ Test citizen created (Daskroi, Ahmedabad, Gujarat, SC, BPL)")

    # ── 4. Schemes (15+) ──────────────────────
    def make_form(fields_data):
        fields = []
        for f in fields_data:
            opts = None
            if f.get("options"):
                opts = [FieldOption(value=o["value"], label=o["label"]) for o in f["options"]]
            fields.append(FormField(
                field_id=f["field_id"],
                label=LocalizedText(en=f["label_en"], hi=f.get("label_hi", f["label_en"])),
                type=f.get("type", "text"),
                options=opts,
                is_required=f.get("required", True),
                maps_to_profile=f.get("maps_to_profile"),
                requires_offline_verification=f.get("offline", False),
                offline_verification_label=f.get("offline_label"),
                validation=FieldValidation(error_message=f.get("error", "This field is required"))
            ))
        return ApplicationForm(
            form_id=f"FORM-SEED",
            sections=[FormSection(
                section_id="sec-1",
                title=LocalizedText(en="Application Details", hi="आवेदन विवरण"),
                fields=fields
            )]
        )

    schemes_data = [
        # 1. PM Kisan (National)
        {
            "scheme_id": "PM-KISAN-001",
            "name": {"en": "PM Kisan Samman Nidhi", "hi": "पीएम किसान सम्मान निधि", "gu": "પીએમ કિસાન સન્માન નિધિ"},
            "desc": {"en": "Direct income support of ₹6,000/year to farmer families", "hi": "किसान परिवारों को ₹6,000/वर्ष प्रत्यक्ष आय सहायता"},
            "ministry": "Ministry of Agriculture", "department": "Agriculture",
            "category": ["agriculture"], "benefit_type": "cash", "benefit_amount": 6000, "benefit_frequency": "annual",
            "scope": "national",
            "rules": [
                {"rule_id": "r1", "field": "occupation", "operator": "eq", "value": "Farmer", "label": "Must be a farmer"},
                {"rule_id": "r2", "field": "land_holding_acres", "operator": "gt", "value": 0, "label": "Must own agricultural land"},
                {"rule_id": "r3", "field": "income_annual", "operator": "lte", "value": 200000, "label": "Annual income ≤ ₹2,00,000",
                 "near_miss_threshold": 15, "near_miss_tip": "If your income is slightly above ₹2L, check state-specific farmer schemes"},
            ],
            "form_fields": [
                {"field_id": "f1", "label_en": "Full Name", "label_hi": "पूरा नाम", "maps_to_profile": "name"},
                {"field_id": "f2", "label_en": "Aadhaar Last 4", "label_hi": "आधार अंतिम 4", "maps_to_profile": "aadhaar_last4"},
                {"field_id": "f3", "label_en": "Bank Account Last 4", "label_hi": "बैंक खाता", "maps_to_profile": "bank_account_number_last4"},
                {"field_id": "f4", "label_en": "IFSC Code", "maps_to_profile": "ifsc_code"},
                {"field_id": "f5", "label_en": "Land Area (acres)", "type": "number", "maps_to_profile": "land_holding_acres"},
                {"field_id": "f6", "label_en": "Khasra/Survey Number", "label_hi": "खसरा/सर्वे नम्बर"},
                {"field_id": "f7", "label_en": "Land Ownership Deed", "offline": True, "offline_label": "Original land ownership deed to be verified at Revenue office"},
                {"field_id": "f8", "label_en": "Village Sarpanch Certificate", "offline": True, "offline_label": "Sarpanch verification of active farming"}
            ],
            "docs": ["Aadhaar Card", "Land Record", "Bank Passbook"]
        },
        # 2. PMAY (National)
        {
            "scheme_id": "PMAY-002",
            "name": {"en": "Pradhan Mantri Awas Yojana", "hi": "प्रधानमंत्री आवास योजना", "gu": "પ્રધાનમંત્રી આવાસ યોજના"},
            "desc": {"en": "Housing for All - affordable housing scheme for economically weaker sections", "hi": "सभी के लिए आवास - आर्थिक रूप से कमजोर वर्गों के लिए"},
            "ministry": "Ministry of Housing", "department": "Housing",
            "category": ["housing"], "benefit_type": "subsidy", "benefit_amount": 250000, "benefit_frequency": "one-time",
            "scope": "national",
            "rules": [
                {"rule_id": "r1", "field": "income_annual", "operator": "lte", "value": 300000, "label": "Annual income ≤ ₹3,00,000",
                 "near_miss_threshold": 10, "near_miss_tip": "Consider EWS category if income is slightly above ₹3L"},
                {"rule_id": "r2", "field": "is_bpl", "operator": "eq", "value": True, "label": "Must be BPL cardholder"},
            ],
            "form_fields": [
                {"field_id": "f1", "label_en": "Full Name", "maps_to_profile": "name"},
                {"field_id": "f2", "label_en": "Annual Income", "type": "number", "maps_to_profile": "income_annual"},
                {"field_id": "f3", "label_en": "Current Address", "type": "textarea"},
                {"field_id": "f4", "label_en": "Family Members Count", "type": "number"},
                {"field_id": "f5", "label_en": "Do you own a pucca house?", "type": "radio", "options": [{"value": "yes", "label": "Yes"}, {"value": "no", "label": "No"}]},
                {"field_id": "f6", "label_en": "Land for construction", "offline": True, "offline_label": "Municipal verification of land availability for construction"},
            ],
            "docs": ["Aadhaar Card", "BPL Certificate", "Income Certificate", "No-Property Certificate"]
        },
        # 3. Ayushman Bharat (National)
        {
            "scheme_id": "AYUSH-003",
            "name": {"en": "Ayushman Bharat PMJAY", "hi": "आयुष्मान भारत PMJAY", "gu": "આયુષ્માન ભારત PMJAY"},
            "desc": {"en": "Health insurance cover of ₹5 lakh/family/year for secondary and tertiary hospitalization", "hi": "₹5 लाख/परिवार/वर्ष स्वास्थ्य बीमा कवर"},
            "ministry": "Ministry of Health", "department": "Health",
            "category": ["health"], "benefit_type": "insurance", "benefit_amount": 500000, "benefit_frequency": "annual",
            "scope": "national",
            "rules": [
                {"rule_id": "r1", "field": "is_bpl", "operator": "eq", "value": True, "label": "BPL family"},
                {"rule_id": "r2", "field": "income_annual", "operator": "lte", "value": 200000, "label": "Income ≤ ₹2L"},
            ],
            "form_fields": [
                {"field_id": "f1", "label_en": "Full Name", "maps_to_profile": "name"},
                {"field_id": "f2", "label_en": "Phone", "maps_to_profile": "phone"},
                {"field_id": "f3", "label_en": "Family Members", "type": "number"},
                {"field_id": "f4", "label_en": "Existing Health Conditions", "type": "textarea", "required": False},
                {"field_id": "f5", "label_en": "BPL Card Number", "maps_to_profile": "bpl_card_number"},
                {"field_id": "f6", "label_en": "Ration Card Verification", "offline": True, "offline_label": "Original ration card to be verified at block office"},
            ],
            "docs": ["Aadhaar Card", "BPL Card", "Ration Card"]
        },
        # 4. MNREGA (National)
        {
            "scheme_id": "MNREGA-004",
            "name": {"en": "MNREGA - Employment Guarantee", "hi": "मनरेगा - रोज़गार गारंटी", "gu": "મનરેગા"},
            "desc": {"en": "100 days guaranteed employment per rural household per year", "hi": "प्रति ग्रामीण परिवार प्रति वर्ष 100 दिनों का गारंटीकृत रोजगार"},
            "ministry": "Ministry of Rural Development", "department": "Rural Development",
            "category": ["employment"], "benefit_type": "cash", "benefit_amount": 25000, "benefit_frequency": "annual",
            "scope": "national",
            "rules": [
                {"rule_id": "r1", "field": "income_annual", "operator": "lte", "value": 200000, "label": "Income ≤ ₹2L"},
            ],
            "form_fields": [
                {"field_id": "f1", "label_en": "Full Name", "maps_to_profile": "name"},
                {"field_id": "f2", "label_en": "Village", "maps_to_profile": "village"},
                {"field_id": "f3", "label_en": "Household Members", "type": "number"},
                {"field_id": "f4", "label_en": "Preferred Work Type", "type": "select", "options": [
                    {"value": "road", "label": "Road Construction"},
                    {"value": "canal", "label": "Canal Digging"},
                    {"value": "plantation", "label": "Plantation"},
                    {"value": "other", "label": "Other"}
                ]},
                {"field_id": "f5", "label_en": "Job Card Number", "required": False},
                {"field_id": "f6", "label_en": "Address Verification", "offline": True, "offline_label": "Gram Panchayat verification of rural residence"},
            ],
            "docs": ["Aadhaar Card", "Job Card (if existing)"]
        },
        # 5. Beti Bachao Beti Padhao (National)
        {
            "scheme_id": "BBBP-005",
            "name": {"en": "Beti Bachao Beti Padhao", "hi": "बेटी बचाओ बेटी पढ़ाओ", "gu": "બેટી બચાવો બેટી પઢાવો"},
            "desc": {"en": "Scholarship and support for girl child education", "hi": "बेटियों की शिक्षा के लिए छात्रवृत्ति एवं सहायता"},
            "ministry": "Ministry of Women & Child Development", "department": "Women & Child Development",
            "category": ["education", "women"], "benefit_type": "scholarship", "benefit_amount": 12000, "benefit_frequency": "annual",
            "scope": "national",
            "rules": [
                {"rule_id": "r1", "field": "gender", "operator": "eq", "value": "female", "label": "Applicant must be female"},
                {"rule_id": "r2", "field": "income_annual", "operator": "lte", "value": 300000, "label": "Family income ≤ ₹3L"},
            ],
            "form_fields": [
                {"field_id": "f1", "label_en": "Girl's Name", "maps_to_profile": "name"},
                {"field_id": "f2", "label_en": "Date of Birth", "type": "date", "maps_to_profile": "dob"},
                {"field_id": "f3", "label_en": "School Name"},
                {"field_id": "f4", "label_en": "Class/Standard", "type": "number"},
                {"field_id": "f5", "label_en": "Parent/Guardian Name"},
                {"field_id": "f6", "label_en": "School Enrollment Certificate", "offline": True, "offline_label": "School principal must verify enrollment status"},
            ],
            "docs": ["Birth Certificate", "Aadhaar Card", "School ID"]
        },
        # 6. National Scholarship (National)
        {
            "scheme_id": "NSP-006",
            "name": {"en": "National Scholarship Portal", "hi": "राष्ट्रीय छात्रवृत्ति पोर्टल", "gu": "રાષ્ટ્રીય સ્કૉલરશિપ"},
            "desc": {"en": "Pre-matric and post-matric scholarships for SC/ST/OBC students", "hi": "SC/ST/OBC छात्रों के लिए प्री-मैट्रिक और पोस्ट-मैट्रिक छात्रवृत्ति"},
            "ministry": "Ministry of Social Justice", "department": "Social Justice",
            "category": ["education"], "benefit_type": "scholarship", "benefit_amount": 15000, "benefit_frequency": "annual",
            "scope": "national",
            "rules": [
                {"rule_id": "r1", "field": "caste_category", "operator": "in", "value": ["SC", "ST", "OBC"], "label": "Must be SC/ST/OBC"},
                {"rule_id": "r2", "field": "income_annual", "operator": "lte", "value": 250000, "label": "Income ≤ ₹2.5L",
                 "near_miss_threshold": 10, "near_miss_tip": "Apply for general merit scholarships if income is slightly above"},
            ],
            "form_fields": [
                {"field_id": "f1", "label_en": "Student Name", "maps_to_profile": "name"},
                {"field_id": "f2", "label_en": "Caste Category", "type": "select", "maps_to_profile": "caste_category",
                 "options": [{"value": "SC", "label": "SC"}, {"value": "ST", "label": "ST"}, {"value": "OBC", "label": "OBC"}]},
                {"field_id": "f3", "label_en": "Institution Name"},
                {"field_id": "f4", "label_en": "Course Name"},
                {"field_id": "f5", "label_en": "Year of Study", "type": "number"},
                {"field_id": "f6", "label_en": "Previous Year Marks (%)", "type": "number"},
                {"field_id": "f7", "label_en": "Caste Certificate Verification", "offline": True, "offline_label": "Original caste certificate to be verified at Tehsil office"},
            ],
            "docs": ["Caste Certificate", "Income Certificate", "Marksheet", "Institution Bonafide"]
        },
        # 7. Old Age Pension (National)
        {
            "scheme_id": "NSAP-007",
            "name": {"en": "National Social Assistance - Old Age Pension", "hi": "राष्ट्रीय सामाजिक सहायता - वृद्धावस्था पेंशन", "gu": "વૃદ્ધાવસ્થા પેન્શન"},
            "desc": {"en": "Monthly pension for citizens aged 60+", "hi": "60+ आयु के नागरिकों के लिए मासिक पेंशन"},
            "ministry": "Ministry of Rural Development", "department": "Social Welfare",
            "category": ["pension"], "benefit_type": "pension", "benefit_amount": 3000, "benefit_frequency": "monthly",
            "scope": "national",
            "rules": [
                {"rule_id": "r1", "field": "is_bpl", "operator": "eq", "value": True, "label": "BPL cardholder"},
                {"rule_id": "r2", "field": "income_annual", "operator": "lte", "value": 100000, "label": "Income ≤ ₹1L"},
            ],
            "form_fields": [
                {"field_id": "f1", "label_en": "Full Name", "maps_to_profile": "name"},
                {"field_id": "f2", "label_en": "Date of Birth", "type": "date", "maps_to_profile": "dob"},
                {"field_id": "f3", "label_en": "Bank Account Last 4", "maps_to_profile": "bank_account_number_last4"},
                {"field_id": "f4", "label_en": "Nominee Name"},
                {"field_id": "f5", "label_en": "Nominee Relation", "type": "select", "options": [
                    {"value": "spouse", "label": "Spouse"}, {"value": "child", "label": "Child"}, {"value": "other", "label": "Other"}
                ]},
                {"field_id": "f6", "label_en": "Age Certificate Verification", "offline": True, "offline_label": "Municipal authority to verify age and BPL status"},
            ],
            "docs": ["Aadhaar Card", "Age Proof", "BPL Card", "Bank Passbook"]
        },
        # 8. Widow Pension (National)
        {
            "scheme_id": "WIDOW-008",
            "name": {"en": "Widow Pension Scheme", "hi": "विधवा पेंशन योजना", "gu": "વિધવા પેન્શન યોજના"},
            "desc": {"en": "Monthly pension for widows from BPL families", "hi": "बीपीएल परिवारों की विधवाओं को मासिक पेंशन"},
            "ministry": "Ministry of Women & Child Development", "department": "Social Welfare",
            "category": ["pension", "women"], "benefit_type": "pension", "benefit_amount": 2000, "benefit_frequency": "monthly",
            "scope": "national",
            "rules": [
                {"rule_id": "r1", "field": "gender", "operator": "eq", "value": "female", "label": "Female applicant"},
                {"rule_id": "r2", "field": "is_bpl", "operator": "eq", "value": True, "label": "BPL cardholder"},
                {"rule_id": "r3", "field": "income_annual", "operator": "lte", "value": 150000, "label": "Income ≤ ₹1.5L"},
            ],
            "form_fields": [
                {"field_id": "f1", "label_en": "Full Name", "maps_to_profile": "name"},
                {"field_id": "f2", "label_en": "Late Husband's Name"},
                {"field_id": "f3", "label_en": "Date of Husband's Death", "type": "date"},
                {"field_id": "f4", "label_en": "Number of Dependents", "type": "number"},
                {"field_id": "f5", "label_en": "Bank Details", "maps_to_profile": "bank_account_number_last4"},
                {"field_id": "f6", "label_en": "Death Certificate Verification", "offline": True, "offline_label": "Original death certificate of husband to be verified at office"},
            ],
            "docs": ["Aadhaar Card", "Death Certificate of Husband", "BPL Card"]
        },
        # 9. Divyangjan Scholarship (National)
        {
            "scheme_id": "DIVYANG-009",
            "name": {"en": "Divyangjan Scholarship", "hi": "दिव्यांगजन छात्रवृत्ति", "gu": "દિવ્યાંગજન સ્કૉલરશિપ"},
            "desc": {"en": "Scholarship for students with disabilities (40%+)", "hi": "40%+ विकलांगता वाले छात्रों के लिए छात्रवृत्ति"},
            "ministry": "Ministry of Social Justice", "department": "Disability Affairs",
            "category": ["education", "disability"], "benefit_type": "scholarship", "benefit_amount": 20000, "benefit_frequency": "annual",
            "scope": "national",
            "rules": [
                {"rule_id": "r1", "field": "disability_percentage", "operator": "gte", "value": 40, "label": "Disability ≥ 40%",
                 "near_miss_threshold": 15, "near_miss_tip": "If disability is 30-39%, check state disability welfare schemes"},
                {"rule_id": "r2", "field": "income_annual", "operator": "lte", "value": 300000, "label": "Income ≤ ₹3L"},
            ],
            "form_fields": [
                {"field_id": "f1", "label_en": "Full Name", "maps_to_profile": "name"},
                {"field_id": "f2", "label_en": "Disability Type", "maps_to_profile": "disability_type"},
                {"field_id": "f3", "label_en": "Disability %", "type": "number", "maps_to_profile": "disability_percentage"},
                {"field_id": "f4", "label_en": "Institution Name"},
                {"field_id": "f5", "label_en": "Course Details"},
                {"field_id": "f6", "label_en": "UDID Number (if available)", "required": False},
                {"field_id": "f7", "label_en": "Disability Certificate Verification", "offline": True, "offline_label": "Original disability certificate from civil surgeon to be verified"},
            ],
            "docs": ["Disability Certificate", "Aadhaar Card", "Marksheet"]
        },
        # 10. Gujarat Kisan Sahay (State - Gujarat)
        {
            "scheme_id": "GJ-KISAN-010",
            "name": {"en": "Gujarat Kisan Sahay Yojana", "hi": "गुजरात किसान सहाय योजना", "gu": "ગુજરાત કિસાન સહાય યોજના"},
            "desc": {"en": "Crop insurance and relief for Gujarat farmers affected by natural calamity", "hi": "प्राकृतिक आपदा से प्रभावित गुजरात किसानों के लिए फसल बीमा"},
            "ministry": "Gujarat Agriculture Dept", "department": "Agriculture",
            "category": ["agriculture", "insurance"], "benefit_type": "insurance", "benefit_amount": 40000, "benefit_frequency": "annual",
            "scope": "state", "scope_state": "Gujarat",
            "rules": [
                {"rule_id": "r1", "field": "occupation", "operator": "eq", "value": "Farmer", "label": "Must be farmer"},
                {"rule_id": "r2", "field": "state", "operator": "eq", "value": "Gujarat", "label": "Gujarat resident"},
                {"rule_id": "r3", "field": "land_holding_acres", "operator": "gt", "value": 0, "label": "Must own land"},
            ],
            "form_fields": [
                {"field_id": "f1", "label_en": "Full Name", "maps_to_profile": "name"},
                {"field_id": "f2", "label_en": "Survey Number"},
                {"field_id": "f3", "label_en": "Crop Type", "type": "select", "options": [
                    {"value": "wheat", "label": "Wheat"}, {"value": "rice", "label": "Rice"},
                    {"value": "cotton", "label": "Cotton"}, {"value": "groundnut", "label": "Groundnut"}, {"value": "other", "label": "Other"}
                ]},
                {"field_id": "f4", "label_en": "Land Area (acres)", "type": "number", "maps_to_profile": "land_holding_acres"},
                {"field_id": "f5", "label_en": "Last Year Crop Loss (%)", "type": "number"},
                {"field_id": "f6", "label_en": "Talati Verification", "offline": True, "offline_label": "Talati must verify land records and crop details at Village office"},
            ],
            "docs": ["7/12 Utara", "Aadhaar Card", "Bank Passbook"]
        },
        # 11. Gujarat Vahali Dikri (State)
        {
            "scheme_id": "GJ-DIKRI-011",
            "name": {"en": "Vahali Dikri Yojana", "hi": "वहाली डिकरी योजना", "gu": "વ્હાલી દીકરી યોજના"},
            "desc": {"en": "Gujarat scheme providing financial assistance to families of girl children", "hi": "बालिकाओं के परिवारों को वित्तीय सहायता"},
            "ministry": "Gujarat Women & Child Dev", "department": "Women & Child Development",
            "category": ["women", "education"], "benefit_type": "cash", "benefit_amount": 110000, "benefit_frequency": "one-time",
            "scope": "state", "scope_state": "Gujarat",
            "rules": [
                {"rule_id": "r1", "field": "gender", "operator": "eq", "value": "female", "label": "Female child"},
                {"rule_id": "r2", "field": "state", "operator": "eq", "value": "Gujarat", "label": "Gujarat resident"},
                {"rule_id": "r3", "field": "income_annual", "operator": "lte", "value": 200000, "label": "Family income ≤ ₹2L"},
            ],
            "form_fields": [
                {"field_id": "f1", "label_en": "Girl's Name", "maps_to_profile": "name"},
                {"field_id": "f2", "label_en": "Father's Name"},
                {"field_id": "f3", "label_en": "Date of Birth", "type": "date", "maps_to_profile": "dob"},
                {"field_id": "f4", "label_en": "School Name"},
                {"field_id": "f5", "label_en": "Class", "type": "number"},
                {"field_id": "f6", "label_en": "Birth Certificate Verification", "offline": True, "offline_label": "Municipal birth certificate original to be verified at office"},
            ],
            "docs": ["Birth Certificate", "Aadhaar Card", "School Certificate"]
        },
        # 12. Ahmedabad District Skill (District)
        {
            "scheme_id": "AHM-SKILL-012",
            "name": {"en": "Ahmedabad Skill Development Program", "hi": "अहमदाबाद कौशल विकास कार्यक्रम", "gu": "અમદાવાદ કૌશલ્ય વિકાસ"},
            "desc": {"en": "Free skill training for youth in Ahmedabad district", "hi": "अहमदाबाद जिले के युवाओं के लिए मुफ्त कौशल प्रशिक्षण"},
            "ministry": "District Administration", "department": "Skill Development",
            "category": ["education", "employment"], "benefit_type": "other", "benefit_amount": 10000, "benefit_frequency": "one-time",
            "scope": "district", "scope_state": "Gujarat", "scope_district": "Ahmedabad",
            "rules": [
                {"rule_id": "r1", "field": "district", "operator": "eq", "value": "Ahmedabad", "label": "Ahmedabad resident"},
                {"rule_id": "r2", "field": "income_annual", "operator": "lte", "value": 250000, "label": "Income ≤ ₹2.5L"},
            ],
            "form_fields": [
                {"field_id": "f1", "label_en": "Full Name", "maps_to_profile": "name"},
                {"field_id": "f2", "label_en": "Education Level", "maps_to_profile": "education_level"},
                {"field_id": "f3", "label_en": "Preferred Skill", "type": "select", "options": [
                    {"value": "computer", "label": "Computer"}, {"value": "tailoring", "label": "Tailoring"},
                    {"value": "plumbing", "label": "Plumbing"}, {"value": "electrical", "label": "Electrical"}
                ]},
                {"field_id": "f4", "label_en": "Previous Training (if any)", "type": "textarea", "required": False},
                {"field_id": "f5", "label_en": "Phone", "maps_to_profile": "phone"},
                {"field_id": "f6", "label_en": "Domicile Verification", "offline": True, "offline_label": "Proof of Ahmedabad district residence to be verified at Mamlatdar office"},
            ],
            "docs": ["Aadhaar Card", "Education Certificate", "Domicile Certificate"]
        },
        # 13. Daskroi Taluka Micro Loan (Taluka)
        {
            "scheme_id": "DAS-LOAN-013",
            "name": {"en": "Daskroi Taluka Micro Enterprise Loan", "hi": "दस्क्रोई तालुका सूक्ष्म उद्यम ऋण", "gu": "દસક્રોઈ તાલુકા સૂક્ષ્મ ઉદ્યમ ધિરાણ"},
            "desc": {"en": "Interest-free micro loans for small businesses in Daskroi taluka", "hi": "दस्क्रोई तालुका में छोटे व्यवसायों के लिए ब्याज-मुक्त सूक्ष्म ऋण"},
            "ministry": "Taluka Admin", "department": "MSME",
            "category": ["employment"], "benefit_type": "subsidy", "benefit_amount": 50000, "benefit_frequency": "one-time",
            "scope": "taluka", "scope_state": "Gujarat", "scope_district": "Ahmedabad", "scope_taluka": "Daskroi",
            "rules": [
                {"rule_id": "r1", "field": "taluka", "operator": "eq", "value": "Daskroi", "label": "Daskroi resident"},
                {"rule_id": "r2", "field": "income_annual", "operator": "lte", "value": 200000, "label": "Income ≤ ₹2L"},
                {"rule_id": "r3", "field": "is_bpl", "operator": "eq", "value": True, "label": "BPL cardholder"},
            ],
            "form_fields": [
                {"field_id": "f1", "label_en": "Full Name", "maps_to_profile": "name"},
                {"field_id": "f2", "label_en": "Business Type"},
                {"field_id": "f3", "label_en": "Loan Amount Requested", "type": "number"},
                {"field_id": "f4", "label_en": "Business Plan Summary", "type": "textarea"},
                {"field_id": "f5", "label_en": "Bank Account", "maps_to_profile": "bank_account_number_last4"},
                {"field_id": "f6", "label_en": "Address & Taluka Residence Verification", "offline": True, "offline_label": "Talati to verify Daskroi taluka residence and business location"},
            ],
            "docs": ["Aadhaar Card", "BPL Card", "Bank Statement"]
        },
        # 14. SC/ST Post-Matric (National)
        {
            "scheme_id": "SCST-014",
            "name": {"en": "SC/ST Post-Matric Scholarship", "hi": "SC/ST पोस्ट-मैट्रिक छात्रवृत्ति", "gu": "SC/ST પોસ્ટ-મેટ્રિક સ્કૉલરશિપ"},
            "desc": {"en": "Full tuition fee scholarship for SC/ST students in higher education", "hi": "उच्च शिक्षा में SC/ST छात्रों को पूर्ण ट्यूशन शुल्क छात्रवृत्ति"},
            "ministry": "Ministry of Social Justice", "department": "Social Justice",
            "category": ["education"], "benefit_type": "scholarship", "benefit_amount": 30000, "benefit_frequency": "annual",
            "scope": "national",
            "rules": [
                {"rule_id": "r1", "field": "caste_category", "operator": "in", "value": ["SC", "ST"], "label": "Must be SC or ST"},
                {"rule_id": "r2", "field": "income_annual", "operator": "lte", "value": 250000, "label": "Income ≤ ₹2.5L"},
            ],
            "form_fields": [
                {"field_id": "f1", "label_en": "Student Name", "maps_to_profile": "name"},
                {"field_id": "f2", "label_en": "Caste", "maps_to_profile": "caste_category"},
                {"field_id": "f3", "label_en": "College/University"},
                {"field_id": "f4", "label_en": "Course"},
                {"field_id": "f5", "label_en": "Tuition Fee Amount", "type": "number"},
                {"field_id": "f6", "label_en": "Previous Year Marks", "type": "number"},
                {"field_id": "f7", "label_en": "Caste Certificate Original", "offline": True, "offline_label": "Original caste certificate to be verified at District Social Welfare office"},
            ],
            "docs": ["Caste Certificate", "Income Certificate", "Marksheet", "Fee Receipt"]
        },
        # 15. Rajasthan Farmer (State)
        {
            "scheme_id": "RJ-FARM-015",
            "name": {"en": "Rajasthan Kisan Kalyan Yojana", "hi": "राजस्थान किसान कल्याण योजना", "gu": "રાજસ્થાન કિસાન કલ્યાણ"},
            "desc": {"en": "Additional farmer support for Rajasthan small and marginal farmers", "hi": "राजस्थान के छोटे और सीमांत किसानों के लिए अतिरिक्त सहायता"},
            "ministry": "Rajasthan Agriculture Dept", "department": "Agriculture",
            "category": ["agriculture"], "benefit_type": "cash", "benefit_amount": 8000, "benefit_frequency": "annual",
            "scope": "state", "scope_state": "Rajasthan",
            "rules": [
                {"rule_id": "r1", "field": "state", "operator": "eq", "value": "Rajasthan", "label": "Rajasthan resident"},
                {"rule_id": "r2", "field": "occupation", "operator": "eq", "value": "Farmer", "label": "Must be farmer"},
                {"rule_id": "r3", "field": "land_holding_acres", "operator": "lte", "value": 5, "label": "Land ≤ 5 acres"},
            ],
            "form_fields": [
                {"field_id": "f1", "label_en": "Full Name", "maps_to_profile": "name"},
                {"field_id": "f2", "label_en": "Land Area", "type": "number", "maps_to_profile": "land_holding_acres"},
                {"field_id": "f3", "label_en": "Khasra Number"},
                {"field_id": "f4", "label_en": "Irrigation Type", "type": "select", "options": [
                    {"value": "rain", "label": "Rain-fed"}, {"value": "well", "label": "Well"}, {"value": "canal", "label": "Canal"}
                ]},
                {"field_id": "f5", "label_en": "Bank IFSC", "maps_to_profile": "ifsc_code"},
                {"field_id": "f6", "label_en": "Patwari Verification", "offline": True, "offline_label": "Patwari to verify land records and farming activity"},
            ],
            "docs": ["Jamabandi", "Aadhaar Card", "Bank Passbook"]
        },
    ]

    for sd in schemes_data:
        rules = [EligibilityRule(
            rule_id=r["rule_id"], field=r["field"], operator=r["operator"], value=r["value"],
            label=r.get("label", ""), near_miss_threshold=r.get("near_miss_threshold"),
            near_miss_tip=r.get("near_miss_tip")
        ) for r in sd.get("rules", [])]

        form = make_form(sd.get("form_fields", []))
        form.form_id = f"FORM-{sd['scheme_id']}"

        scheme = Scheme(
            scheme_id=sd["scheme_id"],
            name=LocalizedText(**sd["name"]),
            description=LocalizedText(**sd.get("desc", {"en": "", "hi": ""})),
            ministry=sd.get("ministry", ""),
            department=sd.get("department", ""),
            category=sd.get("category", []),
            benefit_type=sd.get("benefit_type", "cash"),
            benefit_amount=sd.get("benefit_amount", 0),
            benefit_frequency=sd.get("benefit_frequency", "annual"),
            is_active=True,
            eligibility_rules=rules,
            application_form=form,
            required_documents=sd.get("docs", []),
            scope=sd.get("scope", "national"),
            scope_state=sd.get("scope_state"),
            scope_district=sd.get("scope_district"),
            scope_taluka=sd.get("scope_taluka"),
            created_by_admin_id="ADM-NAT-ALL-001",
            created_by_tier=sd.get("scope", "national"),
        )
        await scheme.insert()

    print(f"  ✅ {len(schemes_data)} schemes seeded")
    print("\n🎉 Seeding complete!")
    print("\n📋 Login Credentials:")
    print("  National Admin:   national@sahayak.gov.in / National@123")
    print("  Gujarat State:    gujarat@sahayak.gov.in / Gujarat@123")
    print("  Ahmedabad Dist:   ahmedabad@sahayak.gov.in / Ahmedabad@123")
    print("  Daskroi Taluka:   daskroi@sahayak.gov.in / Daskroi@123")
    print("  Officer (AHM):    officer.ahmedabad@sahayak.gov.in / Officer@123")
    print("  Officer (JAI):    officer.rajasthan@sahayak.gov.in / Officer@123")
    print("  Citizen:          test@citizen.in / Citizen@123")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
