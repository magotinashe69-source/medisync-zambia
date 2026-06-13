import re
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ----- Country -----

class CountryBase(BaseModel):
    code: str
    name: str
    currency_code: str
    phone_country_code: str
    default_language: str = "en"
    national_id_label: str
    national_id_format_regex: str
    national_id_hint: str | None = None
    phone_format_regex: str
    phone_hint: str | None = None
    medical_council_name: str | None = None
    is_active: bool = True


class CountryResponse(CountryBase):
    id: str

    model_config = ConfigDict(from_attributes=True)


# ----- User -----

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str
    hpcz_number: str | None = None
    facility_name: str
    country_id: str | None = None


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: str
    created_at: datetime
    country: CountryResponse | None = None

    model_config = ConfigDict(from_attributes=True)


# ----- Token -----

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ----- Patient -----

NRC_PATTERN = re.compile(r"^\d{6}/\d{2}/\d$")
PHONE_PATTERN = re.compile(r"^(\+260|0)\d{9}$")


class PatientBase(BaseModel):
    nrc: str
    full_name: str
    phone: str
    date_of_birth: date
    gender: str
    allergies: str | None = None
    country_id: str | None = None

    # ----- Personal details -----
    next_of_kin_name: str | None = None
    next_of_kin_relationship: str | None = None
    next_of_kin_phone: str | None = None
    marital_status: str | None = None
    occupation: str | None = None
    preferred_language: str = "en"

    # ----- Insurance -----
    has_insurance: bool = False
    insurance_provider: str | None = None
    insurance_member_number: str | None = None
    insurance_plan_type: str | None = None

    # ----- Clinical background -----
    blood_group: str | None = None
    known_allergies: str | None = None
    chronic_conditions: str | None = None
    current_medications: str | None = None
    family_history: str | None = None
    social_history: str | None = None
    immunization_record: str | None = None

    # ----- Emergency -----
    emergency_critical_allergies: str | None = None
    emergency_contact_primary: str | None = None
    emergency_contact_secondary: str | None = None


class PatientCreate(PatientBase):
    # National ID and phone are validated per-country in the route handler,
    # because the required format depends on the patient's country.
    pass


class PatientResponse(PatientBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    country: CountryResponse | None = None

    model_config = ConfigDict(from_attributes=True)


# ----- Past surgery -----

class PastSurgeryBase(BaseModel):
    surgery_date: date
    procedure_name: str
    facility: str
    anaesthetic_used: str | None = None
    notes: str | None = None


class PastSurgeryCreate(PastSurgeryBase):
    pass


class PastSurgeryResponse(PastSurgeryBase):
    id: str
    patient_id: str
    created_by: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----- Prescription (defined before VisitResponse uses it) -----

class PrescriptionBase(BaseModel):
    medication_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: str | None = None


class PrescriptionCreate(PrescriptionBase):
    pass


class PrescriptionResponse(PrescriptionBase):
    id: str
    visit_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----- Visit -----

class VisitBase(BaseModel):
    vitals_bp: str | None = None
    vitals_temp: float | None = None
    vitals_weight: float | None = None
    diagnosis: str
    notes: str | None = None


class VisitCreate(VisitBase):
    pass


class VisitResponse(VisitBase):
    id: str
    patient_id: str
    doctor_id: str
    created_at: datetime
    prescriptions: list[PrescriptionResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ----- Emergency lookup -----

class PastSurgeryEmergency(BaseModel):
    """Minimal surgery info for the emergency card — anaesthetic history is critical."""
    surgery_date: date
    procedure_name: str
    anaesthetic_used: str | None = None

    model_config = ConfigDict(from_attributes=True)


class EmergencyCardResponse(BaseModel):
    patient_name: str
    patient_id: str
    nrc: str
    age: int
    sex: str
    blood_group: str | None = None
    critical_allergies: list[str] = []
    current_medications: str | None = None
    chronic_conditions: str | None = None
    past_surgeries: list[PastSurgeryEmergency] = []
    emergency_contact_primary: str | None = None
    emergency_contact_secondary: str | None = None
    facility_of_origin: str | None = None


class EmergencyAccessLogCreate(BaseModel):
    nrc_or_id: str
    reason: str


class EmergencyAccessLogResponse(BaseModel):
    id: str
    user_id: str
    patient_id: str | None = None
    action: str
    identifier_used: str | None = None
    reason: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----- Drug interaction checking -----

class InteractionCheckRequest(BaseModel):
    patient_id: str
    proposed_medication: str


class InteractionWarning(BaseModel):
    severity: str  # severe | moderate | minor
    drug_name: str
    conflicting_with: str | None = None
    warning_message: str
    clinical_action: str
    source_reference: str | None = None
