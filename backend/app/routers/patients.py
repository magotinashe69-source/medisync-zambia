from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .. import auth, schemas
from ..database import get_db
from ..models import Patient, User

router = APIRouter(prefix="/patients", tags=["patients"])


@router.post(
    "",
    response_model=schemas.PatientResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_patient(
    payload: schemas.PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
) -> Patient:
    existing = db.query(Patient).filter(Patient.nrc == payload.nrc).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="NRC already registered",
        )

    patient = Patient(
        nrc=payload.nrc,
        full_name=payload.full_name,
        phone=payload.phone,
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
        allergies=payload.allergies,
        created_by=current_user.id,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("", response_model=list[schemas.PatientResponse])
def list_patients(
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
) -> list[Patient]:
    query = db.query(Patient)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(Patient.full_name.ilike(term), Patient.nrc.ilike(term))
        )
    return query.order_by(Patient.created_at.desc()).limit(100).all()


@router.get("/{patient_id}", response_model=schemas.PatientResponse)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
) -> Patient:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )
    return patient


@router.put("/{patient_id}", response_model=schemas.PatientResponse)
def update_patient(
    patient_id: str,
    payload: schemas.PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
) -> Patient:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    patient.nrc = payload.nrc
    patient.full_name = payload.full_name
    patient.phone = payload.phone
    patient.date_of_birth = payload.date_of_birth
    patient.gender = payload.gender
    patient.allergies = payload.allergies

    db.commit()
    db.refresh(patient)
    return patient
