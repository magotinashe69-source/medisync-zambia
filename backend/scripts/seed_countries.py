"""Seed initial SADC countries and backfill existing data to Zambia.

Idempotent: upserts countries by ISO code (no data is deleted), then sets
country_id = Zambia for any existing user/patient rows that have none.
Run from the backend dir:
    venv\\Scripts\\python -m scripts.seed_countries
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal  # noqa: E402
from app.models import Country, Patient, User  # noqa: E402

COUNTRIES = [
    {
        "code": "ZM", "name": "Zambia", "currency_code": "ZMW",
        "phone_country_code": "+260", "default_language": "en",
        "national_id_label": "NRC",
        "national_id_format_regex": r"^\d{6}/\d{2}/\d$",
        "national_id_hint": "Format: 123456/78/1",
        "phone_format_regex": r"^(\+260|0)\d{9}$",
        "phone_hint": "+260977123456 or 0977123456",
        "medical_council_name": "HPCZ", "is_active": True,
    },
    {
        "code": "NA", "name": "Namibia", "currency_code": "NAD",
        "phone_country_code": "+264", "default_language": "en",
        "national_id_label": "ID Number",
        "national_id_format_regex": r"^\d{11}$",
        "national_id_hint": "11-digit national ID number",
        "phone_format_regex": r"^(\+264|0)\d{8,9}$",
        "phone_hint": "+264811234567 or 0811234567",
        "medical_council_name": "HPCNA", "is_active": True,
    },
]


def seed() -> None:
    db = SessionLocal()
    try:
        for data in COUNTRIES:
            existing = db.query(Country).filter(Country.code == data["code"]).first()
            if existing:
                for key, value in data.items():
                    setattr(existing, key, value)
            else:
                db.add(Country(**data))
        db.commit()

        # Backfill existing rows to Zambia (default country for legacy data).
        zambia = db.query(Country).filter(Country.code == "ZM").first()
        users_backfilled = (
            db.query(User)
            .filter(User.country_id.is_(None))
            .update({User.country_id: zambia.id}, synchronize_session=False)
        )
        patients_backfilled = (
            db.query(Patient)
            .filter(Patient.country_id.is_(None))
            .update({Patient.country_id: zambia.id}, synchronize_session=False)
        )
        db.commit()

        print(
            f"Upserted {len(COUNTRIES)} countries. "
            f"Backfilled {users_backfilled} user(s) and "
            f"{patients_backfilled} patient(s) to Zambia."
        )
    finally:
        db.close()


if __name__ == "__main__":
    seed()
