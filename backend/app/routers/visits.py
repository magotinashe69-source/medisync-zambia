from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from .. import auth, schemas
from ..database import get_db
from ..models import Patient, Prescription, User, Visit

router = APIRouter(tags=["visits"])


@router.post(
    "/patients/{patient_id}/visits",
    response_model=schemas.VisitResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_visit(
    patient_id: str,
    payload: schemas.VisitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
) -> Visit:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    visit = Visit(
        patient_id=patient_id,
        doctor_id=current_user.id,
        vitals_bp=payload.vitals_bp,
        vitals_temp=payload.vitals_temp,
        vitals_weight=payload.vitals_weight,
        diagnosis=payload.diagnosis,
        notes=payload.notes,
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return visit


@router.get(
    "/patients/{patient_id}/visits",
    response_model=list[schemas.VisitResponse],
)
def list_visits(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
) -> list[Visit]:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    return (
        db.query(Visit)
        .options(selectinload(Visit.prescriptions))
        .filter(Visit.patient_id == patient_id)
        .order_by(Visit.created_at.desc())
        .all()
    )


@router.post(
    "/visits/{visit_id}/prescriptions",
    response_model=schemas.PrescriptionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_prescription(
    visit_id: str,
    payload: schemas.PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
) -> Prescription:
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if visit is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visit not found",
        )

    prescription = Prescription(
        visit_id=visit_id,
        medication_name=payload.medication_name,
        dosage=payload.dosage,
        frequency=payload.frequency,
        duration=payload.duration,
        instructions=payload.instructions,
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)
    return prescription
