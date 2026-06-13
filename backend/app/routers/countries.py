from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..models import Country

router = APIRouter(tags=["countries"])


@router.get("/countries", response_model=list[schemas.CountryResponse])
def list_countries(db: Session = Depends(get_db)) -> list[Country]:
    # Public endpoint — the registration page needs this before login.
    return (
        db.query(Country)
        .filter(Country.is_active.is_(True))
        .order_by(Country.name)
        .all()
    )
