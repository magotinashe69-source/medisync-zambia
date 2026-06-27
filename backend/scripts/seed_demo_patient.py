"""Seed a richly-populated demo patient for the Surgery View.

Creates John Banda (NRC 123456/72/1) with a critical allergy, anticoagulant
medications, comorbidities, an emergency contact, and two past surgeries (one
with complications) so the Surgery View renders every section — critical-alert
banner included.

Idempotent: any existing patient with the same NRC (and its past surgeries) is
removed first; audit-log references are detached rather than deleted.

Run from the backend dir:
    venv\\Scripts\\python -m scripts.seed_demo_patient
"""
import os
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal  # noqa: E402
from app.models import AuditLog, Country, PastSurgery, Patient, User  # noqa: E402

NRC = "123456/72/1"


def seed() -> None:
    db = SessionLocal()
    try:
        owner = db.query(User).first()
        if owner is None:
            print("No users exist yet — register a doctor first, then re-run.")
            return

        zambia = db.query(Country).filter(Country.code == "ZM").first()
        country_id = zambia.id if zambia else owner.country_id

        # Idempotency: remove any existing patient with this NRC (+ dependents).
        existing = db.query(Patient).filter(Patient.nrc == NRC).first()
        if existing:
            db.query(AuditLog).filter(AuditLog.patient_id == existing.id).update(
                {AuditLog.patient_id: None}
            )
            db.query(PastSurgery).filter(
                PastSurgery.patient_id == existing.id
            ).delete()
            db.delete(existing)
            db.flush()

        patient = Patient(
            nrc=NRC,
            full_name="John Banda",
            phone="+260977123456",
            date_of_birth=date(1979, 5, 18),
            gender="Male",
            blood_group="O+",
            preferred_language="en",
            marital_status="Married",
            occupation="Teacher",
            next_of_kin_name="Mary Banda",
            next_of_kin_relationship="Wife",
            next_of_kin_phone="+260966112233",
            emergency_critical_allergies="Penicillin (Anaphylaxis, confirmed 2015)",
            known_allergies="Penicillin; Sulfa drugs (rash)",
            current_medications=(
                "Warfarin 5mg daily\n"
                "Aspirin 75mg daily\n"
                "Metformin 1g twice daily"
            ),
            chronic_conditions=(
                "Type 2 Diabetes\nHypertension\nAtrial Fibrillation"
            ),
            family_history="Father: ischaemic heart disease",
            emergency_contact_primary="Mary Banda (Wife) - +260966112233",
            emergency_contact_secondary="Peter Banda (Brother) - +260955778899",
            created_by=owner.id,
            country_id=country_id,
        )
        db.add(patient)
        db.flush()  # assign patient.id for the surgeries below

        surgeries = [
            PastSurgery(
                patient_id=patient.id,
                surgery_date=date(2019, 3, 12),
                procedure_name="Appendectomy",
                facility="University Teaching Hospital, Lusaka",
                anaesthetic_used="General anaesthesia (GA)",
                notes=None,
                created_by=owner.id,
            ),
            PastSurgery(
                patient_id=patient.id,
                surgery_date=date(2015, 8, 20),
                procedure_name="Inguinal Hernia Repair",
                facility="Ndola Teaching Hospital",
                anaesthetic_used="Spinal anaesthesia",
                notes="Prolonged post-op nausea; difficult airway noted.",
                created_by=owner.id,
            ),
        ]
        for s in surgeries:
            db.add(s)

        db.commit()
        print(
            f"Seeded demo patient 'John Banda' (NRC {NRC}), owned by "
            f"{owner.full_name}, with {len(surgeries)} past surgeries."
        )
    finally:
        db.close()


if __name__ == "__main__":
    seed()
