"""Smart Clinical Views — Surgery View endpoint (Step 1.3B).

Assembles a pre-operative summary for a patient (identity, critical safety
alerts, anaesthetic history, current medications, comorbidities, emergency
contact) and records every access to audit_logs.
"""

import re
from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import auth, schemas
from ..database import get_db
from ..models import AuditLog, PastSurgery, Patient, User

router = APIRouter(prefix="/clinical-view", tags=["clinical-view"])


# ----- Medication risk keywords -----

ANTICOAGULANT_KEYWORDS = [
    "warfarin", "heparin", "aspirin", "clopidogrel",
    "rivaroxaban", "apixaban", "dabigatran", "edoxaban",
    "enoxaparin", "fondaparinux",
]

HIGH_RISK_KEYWORDS = ANTICOAGULANT_KEYWORDS + [
    "insulin", "digoxin", "lithium", "methotrexate",
]


def detect_anticoagulant_lines(medications_text: Optional[str]) -> List[str]:
    """Return the medication lines that mention an anticoagulant."""
    if not medications_text:
        return []
    lines = [
        line.strip()
        for line in medications_text.replace(";", "\n").split("\n")
    ]
    matching = []
    for line in lines:
        if not line:
            continue
        lower = line.lower()
        if any(kw in lower for kw in ANTICOAGULANT_KEYWORDS):
            matching.append(line)
    return matching


def is_anticoagulant(medication_line: str) -> bool:
    lower = medication_line.lower()
    return any(kw in lower for kw in ANTICOAGULANT_KEYWORDS)


def is_high_risk(medication_line: str) -> bool:
    lower = medication_line.lower()
    return any(kw in lower for kw in HIGH_RISK_KEYWORDS)


# ----- Small parsing / formatting helpers -----

def _calculate_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _split_lines(text: Optional[str]) -> List[str]:
    """Split a free-text field by newline or semicolon into clean items."""
    if not text:
        return []
    return [
        line.strip()
        for line in text.replace(";", "\n").split("\n")
        if line.strip()
    ]


def _derive_allergy_title(text: str) -> str:
    """Use the first listed allergen as a concise alert title."""
    first = re.split(r"[,;\n(]", text.strip())[0].strip()
    if not first:
        return "Critical Allergy"
    if "allerg" in first.lower():
        return first
    return f"{first} Allergy"


def _parse_emergency_contact(
    raw: Optional[str],
) -> Optional[schemas.EmergencyContactInfo]:
    """Best-effort parse of "Name (Relationship) - Phone".

    Falls back to using the whole string as the name when the expected
    pattern isn't present."""
    if not raw or not raw.strip():
        return None
    text = raw.strip()

    relationship = None
    paren = re.search(r"\(([^)]*)\)", text)
    if paren:
        relationship = paren.group(1).strip() or None

    phone = None
    dash = re.search(r"-\s*([\d+][\d\s()\-]*)$", text)
    if dash:
        phone = dash.group(1).strip() or None

    # Name is whatever precedes the "(relationship)" or the "- phone" part.
    name = text
    if paren:
        name = text[: paren.start()].strip()
    elif dash:
        name = text[: dash.start()].strip()
    if not name:
        name = text

    return schemas.EmergencyContactInfo(
        name=name, relationship=relationship, phone=phone
    )


def _client_ip(request: Request) -> Optional[str]:
    """Resolve the originating client IP, honouring X-Forwarded-For behind a
    proxy (mirrors emergency_lookup)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        first = forwarded.split(",")[0].strip()
        if first:
            return first[:45]
    return request.client.host if request.client else None


def _record_access(
    db: Session,
    *,
    user: User,
    patient_id: Optional[str],
    identifier_used: str,
    reason: Optional[str],
    request: Request,
    success: bool,
    error_message: Optional[str] = None,
) -> None:
    """Persist an audit entry for a clinical-view access attempt.

    Mirrors emergency_lookup's pattern (no shared app.audit helper exists). A
    logging failure must never break the request, so a commit failure is
    swallowed after rollback."""
    try:
        db.add(
            AuditLog(
                user_id=user.id,
                patient_id=patient_id,
                action="clinical_view_surgery",
                identifier_used=identifier_used,
                reason=reason,
                success=success,
                error_message=error_message,
                ip_address=_client_ip(request),
                user_agent=request.headers.get("user-agent"),
            )
        )
        db.commit()
    except Exception:
        db.rollback()


@router.get(
    "/surgery/{nrc_or_id:path}",
    response_model=schemas.SurgeryViewResponse,
)
def surgery_view(
    nrc_or_id: str,
    request: Request,
    reason: str = Query(
        ...,
        min_length=5,
        description="Clinical reason for accessing this view (audited)",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
) -> schemas.SurgeryViewResponse:
    # STEP 1: find the patient — tolerant NRC match, alt format, UUID, then
    # unique name match; else 404 (+ audit).
    cleaned_input = nrc_or_id.strip()

    # NRC match, tolerant of stored leading/trailing whitespace.
    patient = (
        db.query(Patient)
        .filter(func.trim(Patient.nrc) == cleaned_input)
        .first()
    )

    # Retry with the dash/slash-swapped format.
    if patient is None:
        if "/" in cleaned_input:
            alt_format = cleaned_input.replace("/", "-")
        elif "-" in cleaned_input:
            alt_format = cleaned_input.replace("-", "/")
        else:
            alt_format = cleaned_input
        patient = (
            db.query(Patient)
            .filter(func.trim(Patient.nrc) == alt_format)
            .first()
        )

    # Fall back to UUID.
    if patient is None:
        try:
            patient = (
                db.query(Patient).filter(Patient.id == cleaned_input).first()
            )
        except Exception:
            pass

    # Fall back to name search when the input contains letters — but only
    # accept a UNIQUE match. Guessing the wrong patient on a surgery view is
    # unsafe, so 2+ matches are treated as "not found" (ambiguous).
    if patient is None and any(c.isalpha() for c in cleaned_input):
        name_matches = (
            db.query(Patient)
            .filter(Patient.full_name.ilike(f"%{cleaned_input}%"))
            .limit(2)
            .all()
        )
        if len(name_matches) == 1:
            patient = name_matches[0]

    if patient is None:
        _record_access(
            db,
            user=current_user,
            patient_id=None,
            identifier_used=nrc_or_id,
            reason=reason,
            request=request,
            success=False,
            error_message="Patient not found",
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )

    # STEP 2: identity subset.
    view_patient = schemas.ClinicalViewPatient(
        id=patient.id,
        nrc=patient.nrc,
        full_name=patient.full_name,
        age=_calculate_age(patient.date_of_birth),
        gender=patient.gender,
        blood_group=patient.blood_group,
    )

    # STEP 3: critical alerts.
    critical_alerts: List[schemas.CriticalAlert] = []

    # 3a — allergy (from emergency_critical_allergies).
    if (
        patient.emergency_critical_allergies
        and patient.emergency_critical_allergies.strip()
    ):
        critical_alerts.append(
            schemas.CriticalAlert(
                type="allergy",
                severity="critical",
                title=_derive_allergy_title(patient.emergency_critical_allergies),
                detail=patient.emergency_critical_allergies.strip(),
                action="Avoid all listed drugs. Use alternatives with caution.",
            )
        )

    # 3b — anticoagulation (scan current_medications).
    anticoag_lines = detect_anticoagulant_lines(patient.current_medications)
    if anticoag_lines:
        critical_alerts.append(
            schemas.CriticalAlert(
                type="anticoagulation",
                severity="critical",
                title="Anticoagulated",
                detail="\n".join(anticoag_lines),
                action="Bleeding risk. Consider hold/bridge per surgeon protocol.",
            )
        )

    # STEP 4: previous anaesthetics (5 most recent).
    surgeries = (
        db.query(PastSurgery)
        .filter(PastSurgery.patient_id == patient.id)
        .order_by(PastSurgery.surgery_date.desc())
        .limit(5)
        .all()
    )
    previous_anaesthetics = [
        schemas.PreviousAnaesthetic(
            surgery_id=s.id,
            surgery_date=s.surgery_date,
            procedure_name=s.procedure_name,
            facility=s.facility,
            anaesthetic_used=s.anaesthetic_used,
            complications=s.notes,                       # no `complications` column
            has_complications=bool(s.notes and s.notes.strip()),
            surgeon_name=None,                           # not captured in the model
        )
        for s in surgeries
    ]

    # STEP 5: current medications with risk flags.
    current_medications = [
        schemas.CurrentMedication(
            name=line,
            is_anticoagulant=is_anticoagulant(line),
            is_high_risk=is_high_risk(line),
        )
        for line in _split_lines(patient.current_medications)
    ]

    # STEP 6: comorbidities.
    comorbidities = _split_lines(patient.chronic_conditions)

    # STEP 7: emergency contact.
    emergency_contact = _parse_emergency_contact(patient.emergency_contact_primary)

    # STEP 8: metadata.
    metadata = schemas.ClinicalViewMetadata(
        accessed_by=current_user.full_name or current_user.email,
        accessed_at=datetime.utcnow(),
        reason=reason,
        view_type="surgery",
    )

    # STEP 9: audit the successful access.
    _record_access(
        db,
        user=current_user,
        patient_id=patient.id,
        identifier_used=nrc_or_id,
        reason=reason,
        request=request,
        success=True,
    )

    # STEP 10: assemble + return.
    return schemas.SurgeryViewResponse(
        patient=view_patient,
        critical_alerts=critical_alerts,
        previous_anaesthetics=previous_anaesthetics,
        current_medications=current_medications,
        comorbidities=comorbidities,
        emergency_contact=emergency_contact,
        metadata=metadata,
    )
