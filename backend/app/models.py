import uuid

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

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

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    patients_created = relationship("Patient", back_populates="creator")
    visits = relationship("Visit", back_populates="doctor")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    nrc = Column(String(20), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(20), nullable=False)
    allergies = Column(Text, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    creator = relationship("User", back_populates="patients_created")
    visits = relationship("Visit", back_populates="patient")


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
