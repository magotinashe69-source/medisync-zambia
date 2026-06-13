import re
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .. import auth, schemas
from ..database import get_db
from ..models import AuditLog, PastSurgery, Patient, User

router = APIRouter(tags=["emergency"])


def _calculate_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _parse_critical_allergies(raw: str | None) -> list[str]:
    """Split the free-text emergency_critical_allergies field into discrete items."""
    if not raw:
        return []
    parts = re.split(r"[\n,;]+", raw)
    return [p.strip() for p in parts if p.strip()]


def _find_patient(db: Session, nrc_or_id: str) -> Patient | None:
    return (
        db.query(Patient)
        .filter(
            or_(
                Patient.id == nrc_or_id,
                Patient.nrc == nrc_or_id,
                Patient.phone == nrc_or_id,
            )
        )
        .first()
    )


@router.get(
    "/patients/emergency/{nrc_or_id}",
    response_model=schemas.EmergencyCardResponse,
)
def emergency_lookup(
    nrc_or_id: str,
    reason: str | None = Query(None, description="Reason for emergency access"),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
) -> schemas.EmergencyCardResponse:
    patient = _find_patient(db, nrc_or_id)
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No patient found for the given NRC, ID or phone",
        )

    # Audit EVERY emergency access (per clinical/governance requirement)
    db.add(
        AuditLog(
            user_id=current_user.id,
            patient_id=patient.id,
            action="emergency_access",
            identifier_used=nrc_or_id,
            reason=reason,
        )
    )
    db.commit()

    surgeries = (
        db.query(PastSurgery)
        .filter(PastSurgery.patient_id == patient.id)
        .order_by(PastSurgery.surgery_date.desc())
        .all()
    )

    facility = patient.creator.facility_name if patient.creator else None

    return schemas.EmergencyCardResponse(
        patient_name=patient.full_name,
        patient_id=patient.id,
        nrc=patient.nrc,
        age=_calculate_age(patient.date_of_birth),
        sex=patient.gender,
        blood_group=patient.blood_group,
        critical_allergies=_parse_critical_allergies(patient.emergency_critical_allergies),
        current_medications=patient.current_medications,
        chronic_conditions=patient.chronic_conditions,
        past_surgeries=[schemas.PastSurgeryEmergency.model_validate(s) for s in surgeries],
        emergency_contact_primary=patient.emergency_contact_primary,
        emergency_contact_secondary=patient.emergency_contact_secondary,
        facility_of_origin=facility,
    )


@router.post(
    "/emergency-access-logs",
    response_model=schemas.EmergencyAccessLogResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_emergency_access_log(
    payload: schemas.EmergencyAccessLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
) -> AuditLog:
    patient = _find_patient(db, payload.nrc_or_id)
    log = AuditLog(
        user_id=current_user.id,
        patient_id=patient.id if patient else None,
        action="emergency_access",
        identifier_used=payload.nrc_or_id,
        reason=payload.reason,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
