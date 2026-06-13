import uuid

from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import expression, func

from .database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    hpcz_number = Column(String(50), nullable=True)
    facility_name = Column(String(255), nullable=False)
    country_id = Column(String(36), ForeignKey("countries.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    patients_created = relationship("Patient", back_populates="creator")
    visits = relationship("Visit", back_populates="doctor")
    country = relationship("Country")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    nrc = Column(String(20), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(20), nullable=False)
    allergies = Column(Text, nullable=True)

    # ----- Personal details -----
    next_of_kin_name = Column(String(255), nullable=True)
    next_of_kin_relationship = Column(String(100), nullable=True)
    next_of_kin_phone = Column(String(20), nullable=True)
    marital_status = Column(String(50), nullable=True)
    occupation = Column(String(255), nullable=True)
    preferred_language = Column(
        String(20), nullable=False, server_default="en", default="en"
    )

    # ----- Insurance -----
    has_insurance = Column(
        Boolean, nullable=False, server_default=expression.false(), default=False
    )
    insurance_provider = Column(String(255), nullable=True)
    insurance_member_number = Column(String(100), nullable=True)
    insurance_plan_type = Column(String(100), nullable=True)

    # ----- Clinical background -----
    blood_group = Column(String(10), nullable=True)
    known_allergies = Column(Text, nullable=True)
    chronic_conditions = Column(Text, nullable=True)
    current_medications = Column(Text, nullable=True)
    family_history = Column(Text, nullable=True)
    social_history = Column(Text, nullable=True)
    immunization_record = Column(Text, nullable=True)

    # ----- Emergency -----
    emergency_critical_allergies = Column(Text, nullable=True)
    emergency_contact_primary = Column(String(255), nullable=True)
    emergency_contact_secondary = Column(String(255), nullable=True)

    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    country_id = Column(String(36), ForeignKey("countries.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    creator = relationship("User", back_populates="patients_created")
    country = relationship("Country")
    visits = relationship("Visit", back_populates="patient")
    past_surgeries = relationship(
        "PastSurgery", back_populates="patient", cascade="all, delete-orphan"
    )


class PastSurgery(Base):
    __tablename__ = "past_surgeries"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    surgery_date = Column(Date, nullable=False)
    procedure_name = Column(String(255), nullable=False)
    facility = Column(String(255), nullable=False)
    anaesthetic_used = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    patient = relationship("Patient", back_populates="past_surgeries")


class Visit(Base):
    __tablename__ = "visits"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    vitals_bp = Column(String(20), nullable=True)
    vitals_temp = Column(Float, nullable=True)
    vitals_weight = Column(Float, nullable=True)
    diagnosis = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    patient = relationship("Patient", back_populates="visits")
    doctor = relationship("User", back_populates="visits")
    prescriptions = relationship("Prescription", back_populates="visit")


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    visit_id = Column(String(36), ForeignKey("visits.id"), nullable=False)
    medication_name = Column(String(255), nullable=False)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)
    duration = Column(String(100), nullable=False)
    instructions = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    visit = relationship("Visit", back_populates="prescriptions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=True)
    action = Column(String(50), nullable=False)
    identifier_used = Column(String(100), nullable=True)
    reason = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user = relationship("User")
    patient = relationship("Patient")


class Country(Base):
    __tablename__ = "countries"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    code = Column(String(2), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    currency_code = Column(String(3), nullable=False)
    phone_country_code = Column(String(10), nullable=False)
    default_language = Column(
        String(10), nullable=False, server_default="en", default="en"
    )
    national_id_label = Column(String(50), nullable=False)
    national_id_format_regex = Column(String(255), nullable=False)
    national_id_hint = Column(String(255), nullable=True)
    phone_format_regex = Column(String(255), nullable=False)
    phone_hint = Column(String(255), nullable=True)
    medical_council_name = Column(String(100), nullable=True)
    is_active = Column(
        Boolean, nullable=False, server_default=expression.true(), default=True
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class DrugInteractionRule(Base):
    __tablename__ = "drug_interaction_rules"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    # Normalized lowercase name of the drug BEING PRESCRIBED.
    drug_name = Column(String(255), nullable=False, index=True)
    # Exactly one of the three "interacts_with_*" columns is set per rule.
    interacts_with_drug = Column(String(255), nullable=True)       # drug–drug
    interacts_with_condition = Column(String(255), nullable=True)  # drug–condition
    interacts_with_allergy = Column(String(255), nullable=True)    # drug–allergy
    severity = Column(String(20), nullable=False)                  # minor | moderate | severe
    warning_message = Column(Text, nullable=False)
    clinical_action = Column(Text, nullable=False)
    source_reference = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
