import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .. import auth, schemas
from ..database import get_db
from ..models import Country, PastSurgery, Patient, User

router = APIRouter(prefix="/patients", tags=["patients"])


def _resolve_country_and_validate(
    db: Session, payload: schemas.PatientCreate, current_user: User
) -> Country | None:
    """Resolve the patient's country (payload -> doctor -> Zambia) and validate
    the national ID / phone fields against that country's formats."""
    country: Country | None = None
    if payload.country_id:
        country = db.query(Country).filter(Country.id == payload.country_id).first()
        if country is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unknown country selected",
            )
    if country is None and current_user.country_id:
        country = db.query(Country).filter(Country.id == current_user.country_id).first()
    if country is None:
        country = db.query(Country).filter(Country.code == "ZM").first()

    if country is None:
        return None  # no countries seeded — skip validation rather than 500

    if not re.match(country.national_id_format_regex, payload.nrc or ""):
        hint = f" {country.national_id_hint}" if country.national_id_hint else ""
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{country.national_id_label} format is invalid.{hint}",
        )
    if not re.match(country.phone_format_regex, payload.phone or ""):
        hint = f" {country.phone_hint}" if country.phone_hint else ""
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Phone format is invalid.{hint}",
        )
    nok = (payload.next_of_kin_phone or "").strip()
    if nok and not re.match(country.phone_format_regex, nok):
        hint = f" {country.phone_hint}" if country.phone_hint else ""
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Next of kin phone format is invalid.{hint}",
        )
    return country


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

    country = _resolve_country_and_validate(db, payload, current_user)
    data = payload.model_dump()
    data["country_id"] = country.id if country else data.get("country_id")
    patient = Patient(**data, created_by=current_user.id)
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

    country = _resolve_country_and_validate(db, payload, current_user)
    data = payload.model_dump()
    data["country_id"] = country.id if country else data.get("country_id")
    for field, value in data.items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)
    return patient


# ----- Past surgical history -----

@router.post(
    "/{patient_id}/surgeries",
    response_model=schemas.PastSurgeryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_surgery(
    patient_id: str,
    payload: schemas.PastSurgeryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
) -> PastSurgery:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    surgery = PastSurgery(
        **payload.model_dump(),
        patient_id=patient_id,
        created_by=current_user.id,
    )
    db.add(surgery)
    db.commit()
    db.refresh(surgery)
    return surgery


@router.get(
    "/{patient_id}/surgeries",
    response_model=list[schemas.PastSurgeryResponse],
)
def list_surgeries(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
) -> list[PastSurgery]:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    return (
        db.query(PastSurgery)
        .filter(PastSurgery.patient_id == patient_id)
        .order_by(PastSurgery.surgery_date.desc())
        .all()
    )
