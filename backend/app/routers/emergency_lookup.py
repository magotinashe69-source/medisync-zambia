from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import auth, schemas
from ..database import get_db
from ..models import PastSurgery, Patient, User, Visit

router = APIRouter(prefix="/emergency", tags=["emergency"])

ANTICOAGULANTS = [
    "warfarin", "heparin", "aspirin", "clopidogrel",
    "rivaroxaban", "apixaban", "dabigatran", "edoxaban",
    "enoxaparin", "fondaparinux",
]


def _calculate_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _detect_anticoagulation(meds: str | None) -> tuple[bool, str | None]:
    """Flag if current_medications mentions any anticoagulant; return the
    matching line(s) as detail."""
    if not meds:
        return False, None
    matched = [
        line.strip()
        for line in meds.splitlines()
        if line.strip() and any(drug in line.lower() for drug in ANTICOAGULANTS)
    ]
    if not matched:
        return False, None
    return True, "\n".join(matched)


@router.get("/lookup/{nrc_or_id:path}", response_model=schemas.EmergencyCard)
def emergency_lookup(
    nrc_or_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
) -> schemas.EmergencyCard:
    # Step 1: match by NRC (exact). Step 2: fall back to ID. Step 3: 404.
    patient = db.query(Patient).filter(Patient.nrc == nrc_or_id).first()
    if patient is None:
        patient = db.query(Patient).filter(Patient.id == nrc_or_id).first()
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )

    # Step 4: build the card.
    surgeries = (
        db.query(PastSurgery)
        .filter(PastSurgery.patient_id == patient.id)
        .order_by(PastSurgery.surgery_date.desc())
        .limit(3)
        .all()
    )
    recent_surgeries = [
        schemas.EmergencySurgeryItem(
            surgery_date=s.surgery_date,
            procedure_name=s.procedure_name,
            facility_where_done=s.facility,   # model field is `facility`
            anaesthetic_used=s.anaesthetic_used,
            complications=s.notes,            # no `complications` column; map from `notes`
        )
        for s in surgeries
    ]

    is_anticoagulated, anticoagulation_details = _detect_anticoagulation(
        patient.current_medications
    )

    last_visit = (
        db.query(Visit)
        .filter(Visit.patient_id == patient.id)
        .order_by(Visit.created_at.desc())
        .first()
    )
    last_visit_date = last_visit.created_at.date() if last_visit else None
    facility_of_origin = patient.creator.facility_name if patient.creator else None

    # Step 5: audit logging deferred to step 2.2 (per spec).
    # Step 6: return.
    return schemas.EmergencyCard(
        patient_id=patient.id,
        nrc=patient.nrc,
        full_name=patient.full_name,
        age=_calculate_age(patient.date_of_birth),
        gender=patient.gender,
        blood_group=patient.blood_group,
        emergency_critical_allergies=patient.emergency_critical_allergies,
        known_allergies=patient.known_allergies,
        is_anticoagulated=is_anticoagulated,
        anticoagulation_details=anticoagulation_details,
        current_medications=patient.current_medications,
        chronic_conditions=patient.chronic_conditions,
        recent_surgeries=recent_surgeries,
        emergency_contact_primary=patient.emergency_contact_primary,
        emergency_contact_secondary=patient.emergency_contact_secondary,
        next_of_kin_name=patient.next_of_kin_name,
        next_of_kin_phone=patient.next_of_kin_phone,
        last_visit_date=last_visit_date,
        facility_of_origin=facility_of_origin,
    )
