from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..models import Country

router = APIRouter(prefix="/countries", tags=["countries"])


@router.get("", response_model=list[schemas.CountryResponse])
def list_countries(db: Session = Depends(get_db)) -> list[Country]:
    # Public endpoint — the registration page needs this before login.
    return (
        db.query(Country)
        .filter(Country.is_active.is_(True))
        .order_by(Country.name)
        .all()
    )


@router.get("/{country_code}", response_model=schemas.CountryResponse)
def get_country(country_code: str, db: Session = Depends(get_db)) -> Country:
    country = db.query(Country).filter(Country.code == country_code.upper()).first()
    if country is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Country not found",
        )
    return country
