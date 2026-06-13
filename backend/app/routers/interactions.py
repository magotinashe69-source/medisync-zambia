from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import auth, schemas
from ..database import get_db
from ..models import DrugInteractionRule, Patient, User

router = APIRouter(tags=["interactions"])

SEVERITY_ORDER = {"severe": 0, "moderate": 1, "minor": 2}


@router.post("/check-interactions", response_model=list[schemas.InteractionWarning])
def check_interactions(
    payload: schemas.InteractionCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
) -> list[schemas.InteractionWarning]:
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    proposed = payload.proposed_medication.lower().strip()
    if not proposed:
        return []

    # Patient context, normalized to lowercase free text.
    meds = (patient.current_medications or "").lower()
    conditions = (patient.chronic_conditions or "").lower()
    # Allergy matching is broadened across all three allergy fields for safety.
    allergies = " ".join(
        v
        for v in (
            patient.known_allergies,
            patient.allergies,
            patient.emergency_critical_allergies,
        )
        if v
    ).lower()

    warnings: list[schemas.InteractionWarning] = []
    for rule in db.query(DrugInteractionRule).all():
        # A rule applies when its drug_name appears in the proposed medication
        # (the proposed string may include dosage/strength, e.g. "warfarin 5mg").
        if rule.drug_name not in proposed:
            continue

        conflict: str | None = None
        if rule.interacts_with_drug and rule.interacts_with_drug.lower() in meds:
            conflict = rule.interacts_with_drug
        elif (
            rule.interacts_with_condition
            and rule.interacts_with_condition.lower() in conditions
        ):
            conflict = rule.interacts_with_condition
        elif (
            rule.interacts_with_allergy
            and rule.interacts_with_allergy.lower() in allergies
        ):
            conflict = rule.interacts_with_allergy

        if conflict is None:
            continue

        warnings.append(
            schemas.InteractionWarning(
                severity=rule.severity,
                drug_name=rule.drug_name,
                conflicting_with=conflict,
                warning_message=rule.warning_message,
                clinical_action=rule.clinical_action,
                source_reference=rule.source_reference,
            )
        )

    warnings.sort(key=lambda w: SEVERITY_ORDER.get(w.severity, 99))
    return warnings
