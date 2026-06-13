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
        "phone_hint": "Format: +260977123456 or 0977123456",
        "medical_council_name": "HPCZ", "is_active": True,
    },
    {
        "code": "NA", "name": "Namibia", "currency_code": "NAD",
        "phone_country_code": "+264", "default_language": "en",
        "national_id_label": "National ID",
        "national_id_format_regex": r"^\d{11}$",
        "national_id_hint": "Format: 11-digit ID number",
        "phone_format_regex": r"^(\+264|0)\d{8,9}$",
        "phone_hint": "Format: +26481234567 or 081234567",
        "medical_council_name": "HPCNA", "is_active": True,
    },
    {
        "code": "MZ", "name": "Mozambique", "currency_code": "MZN",
        "phone_country_code": "+258", "default_language": "pt",
        "national_id_label": "Bilhete de Identidade",
        "national_id_format_regex": r"^[0-9A-Za-z]{13}$",
        "national_id_hint": "13-character BI (e.g. 110100000000A)",
        "phone_format_regex": r"^(\+258)?\d{9}$",
        "phone_hint": "+258841234567",
        "medical_council_name": "OrMM", "is_active": True,
    },
    {
        "code": "ZW", "name": "Zimbabwe", "currency_code": "ZWL",
        "phone_country_code": "+263", "default_language": "en",
        "national_id_label": "ID Number",
        "national_id_format_regex": r"^\d{2}-?\d{6,7}[A-Za-z]\d{2}$",
        "national_id_hint": "e.g. 63-123456A12",
        "phone_format_regex": r"^(\+263|0)\d{9}$",
        "phone_hint": "+263771234567 or 0771234567",
        "medical_council_name": "MDPCZ", "is_active": True,
    },
    {
        "code": "MW", "name": "Malawi", "currency_code": "MWK",
        "phone_country_code": "+265", "default_language": "en",
        "national_id_label": "National ID",
        "national_id_format_regex": r"^[0-9A-Za-z]{8}$",
        "national_id_hint": "8-character National ID",
        "phone_format_regex": r"^(\+265|0)\d{9}$",
        "phone_hint": "+265991234567 or 0991234567",
        "medical_council_name": "MCM", "is_active": True,
    },
    {
        "code": "ZA", "name": "South Africa", "currency_code": "ZAR",
        "phone_country_code": "+27", "default_language": "en",
        "national_id_label": "ID Number",
        "national_id_format_regex": r"^\d{13}$",
        "national_id_hint": "13-digit ID number",
        "phone_format_regex": r"^(\+27|0)\d{9}$",
        "phone_hint": "+27821234567 or 0821234567",
        "medical_council_name": "HPCSA", "is_active": True,
    },
    {
        "code": "BW", "name": "Botswana", "currency_code": "BWP",
        "phone_country_code": "+267", "default_language": "en",
        "national_id_label": "Omang",
        "national_id_format_regex": r"^\d{9}$",
        "national_id_hint": "9-digit Omang number",
        "phone_format_regex": r"^(\+267)?\d{8}$",
        "phone_hint": "+26771123456",
        "medical_council_name": "BHPC", "is_active": True,
    },
]


def seed() -> None:
    db = SessionLocal()
    try:
        for data in COUNTRIES:
            existing = db.query(Country).filter(Country.code == data["code"]).first()
            if existing:
                # Keep existing rows current with the canonical values.
                for key, value in data.items():
                    setattr(existing, key, value)
                print(f"{data['name']} already exists")
            else:
                db.add(Country(**data))
                print(f"Created {data['name']}")
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
            f"Backfilled {users_backfilled} user(s) and "
            f"{patients_backfilled} patient(s) to Zambia."
        )
    finally:
        db.close()


if __name__ == "__main__":
    seed()
