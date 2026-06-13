"""Seed the curated drug-interaction rule set.

Idempotent: clears existing rules and re-inserts. Run from the backend dir:
    venv\\Scripts\\python -m scripts.seed_drug_interactions
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal  # noqa: E402
from app.models import DrugInteractionRule  # noqa: E402

# Each rule: the drug being prescribed (drug_name) conflicts with ONE of
# interacts_with_drug / _condition / _allergy. Names/keywords are lowercase;
# matching is substring-based against the patient's free-text fields.
RULES = [
    # ---------- Warfarin ----------
    {"drug_name": "warfarin", "interacts_with_drug": "ibuprofen", "severity": "severe",
     "warning_message": "NSAIDs (ibuprofen) with warfarin sharply increase the risk of GI and intracranial bleeding.",
     "clinical_action": "Avoid the NSAID. Use paracetamol for analgesia. If unavoidable, add gastroprotection and monitor INR.",
     "source_reference": "Stockley's Drug Interactions; BNF 86"},
    {"drug_name": "warfarin", "interacts_with_drug": "diclofenac", "severity": "severe",
     "warning_message": "Diclofenac with warfarin markedly raises bleeding risk (antiplatelet + GI mucosal injury).",
     "clinical_action": "Avoid NSAID; prefer paracetamol. Monitor INR and for bleeding if co-prescribed.",
     "source_reference": "Stockley's Drug Interactions"},
    {"drug_name": "warfarin", "interacts_with_drug": "aspirin", "severity": "severe",
     "warning_message": "Aspirin plus warfarin gives additive antiplatelet and anticoagulant effect — high bleeding risk.",
     "clinical_action": "Only combine with a clear indication (e.g. mechanical valve). Otherwise stop aspirin.",
     "source_reference": "BNF 86"},
    {"drug_name": "warfarin", "interacts_with_drug": "metronidazole", "severity": "severe",
     "warning_message": "Metronidazole inhibits warfarin metabolism, raising INR and bleeding risk.",
     "clinical_action": "Avoid or reduce warfarin dose; check INR within 3-5 days and after stopping.",
     "source_reference": "Stockley's Drug Interactions"},
    {"drug_name": "warfarin", "interacts_with_drug": "fluconazole", "severity": "severe",
     "warning_message": "Fluconazole strongly inhibits CYP2C9, potentiating warfarin and raising INR.",
     "clinical_action": "Reduce warfarin dose and monitor INR closely; consider topical antifungal if appropriate.",
     "source_reference": "Stockley's Drug Interactions"},
    {"drug_name": "warfarin", "interacts_with_drug": "ciprofloxacin", "severity": "moderate",
     "warning_message": "Ciprofloxacin can potentiate warfarin, increasing INR.",
     "clinical_action": "Monitor INR during and after the antibiotic course.",
     "source_reference": "BNF 86"},
    {"drug_name": "warfarin", "interacts_with_drug": "erythromycin", "severity": "moderate",
     "warning_message": "Macrolides (erythromycin) can raise INR by inhibiting warfarin metabolism.",
     "clinical_action": "Monitor INR; consider an alternative antibiotic.",
     "source_reference": "Stockley's Drug Interactions"},
    {"drug_name": "warfarin", "interacts_with_drug": "rifampicin", "severity": "moderate",
     "warning_message": "Rifampicin induces warfarin metabolism, REDUCING anticoagulation and raising clot risk.",
     "clinical_action": "Expect higher warfarin requirement; monitor INR and adjust dose up, then down when rifampicin stops.",
     "source_reference": "Stockley's Drug Interactions"},

    # ---------- Rifampicin (as the prescribed drug) ----------
    {"drug_name": "rifampicin", "interacts_with_drug": "dolutegravir", "severity": "moderate",
     "warning_message": "Rifampicin lowers dolutegravir concentrations and may reduce HIV viral suppression.",
     "clinical_action": "Increase dolutegravir to 50 mg twice daily for the duration of rifampicin co-treatment.",
     "source_reference": "WHO Consolidated HIV Guidelines"},
    {"drug_name": "rifampicin", "interacts_with_drug": "lopinavir", "severity": "severe",
     "warning_message": "Rifampicin drastically reduces lopinavir/ritonavir levels, risking ARV failure and resistance.",
     "clinical_action": "Avoid. Use rifabutin or adjust the ARV regimen per HIV-TB co-treatment guidance.",
     "source_reference": "WHO HIV-TB co-treatment guidance"},
    {"drug_name": "rifampicin", "interacts_with_drug": "nevirapine", "severity": "moderate",
     "warning_message": "Rifampicin lowers nevirapine levels, reducing antiretroviral efficacy.",
     "clinical_action": "Avoid the combination; prefer an efavirenz- or dolutegravir-based regimen.",
     "source_reference": "WHO Consolidated HIV Guidelines"},
    {"drug_name": "rifampicin", "interacts_with_drug": "efavirenz", "severity": "moderate",
     "warning_message": "Rifampicin modestly lowers efavirenz levels.",
     "clinical_action": "Standard efavirenz dosing is usually retained; monitor for viral response.",
     "source_reference": "WHO Consolidated HIV Guidelines"},
    {"drug_name": "rifampicin", "interacts_with_drug": "contraceptive", "severity": "severe",
     "warning_message": "Rifampicin induces metabolism of hormonal contraceptives, causing contraceptive failure.",
     "clinical_action": "Advise an additional/alternative non-hormonal method (e.g. copper IUD, condoms) during and 4 weeks after.",
     "source_reference": "BNF 86; WHO MEC"},
    {"drug_name": "rifampicin", "interacts_with_drug": "warfarin", "severity": "moderate",
     "warning_message": "Rifampicin reduces warfarin effect via enzyme induction, increasing clot risk.",
     "clinical_action": "Monitor INR frequently; warfarin dose will need to rise during co-treatment.",
     "source_reference": "Stockley's Drug Interactions"},

    # ---------- Penicillins in penicillin-allergic patients ----------
    {"drug_name": "amoxicillin", "interacts_with_allergy": "penicillin", "severity": "severe",
     "warning_message": "Amoxicillin is a penicillin - risk of anaphylaxis in a penicillin-allergic patient.",
     "clinical_action": "Do NOT prescribe. Use a non-penicillin alternative (e.g. macrolide) per local guidance.",
     "source_reference": "BNF 86"},
    {"drug_name": "ampicillin", "interacts_with_allergy": "penicillin", "severity": "severe",
     "warning_message": "Ampicillin is a penicillin - risk of anaphylaxis in a penicillin-allergic patient.",
     "clinical_action": "Do NOT prescribe. Choose a non-penicillin antibiotic.",
     "source_reference": "BNF 86"},
    {"drug_name": "benzylpenicillin", "interacts_with_allergy": "penicillin", "severity": "severe",
     "warning_message": "Benzylpenicillin in a penicillin-allergic patient risks anaphylaxis.",
     "clinical_action": "Do NOT prescribe. Use an alternative class.",
     "source_reference": "BNF 86"},
    {"drug_name": "flucloxacillin", "interacts_with_allergy": "penicillin", "severity": "severe",
     "warning_message": "Flucloxacillin is a penicillin - anaphylaxis risk in penicillin allergy.",
     "clinical_action": "Do NOT prescribe. Select a non-penicillin alternative.",
     "source_reference": "BNF 86"},
    {"drug_name": "penicillin", "interacts_with_allergy": "penicillin", "severity": "severe",
     "warning_message": "Penicillin given to a penicillin-allergic patient risks fatal anaphylaxis.",
     "clinical_action": "Do NOT prescribe. Use an alternative class and document the allergy.",
     "source_reference": "BNF 86"},

    # ---------- Beta-blockers + asthma ----------
    {"drug_name": "propranolol", "interacts_with_condition": "asthma", "severity": "severe",
     "warning_message": "Non-selective beta-blocker (propranolol) can precipitate severe bronchospasm in asthma.",
     "clinical_action": "Contraindicated. Use a cardioselective agent only if essential, with specialist input.",
     "source_reference": "BNF 86"},
    {"drug_name": "carvedilol", "interacts_with_condition": "asthma", "severity": "severe",
     "warning_message": "Carvedilol is non-selective and may cause bronchospasm in asthma.",
     "clinical_action": "Avoid. Consider a cardioselective beta-blocker if a beta-blocker is essential.",
     "source_reference": "BNF 86"},
    {"drug_name": "atenolol", "interacts_with_condition": "asthma", "severity": "moderate",
     "warning_message": "Even cardioselective beta-blockers (atenolol) can worsen asthma at higher doses.",
     "clinical_action": "Use the lowest effective dose with caution; monitor respiratory symptoms.",
     "source_reference": "BNF 86"},

    # ---------- Metformin + renal impairment / heart failure ----------
    {"drug_name": "metformin", "interacts_with_condition": "renal", "severity": "severe",
     "warning_message": "Metformin in renal impairment risks lactic acidosis.",
     "clinical_action": "Check eGFR. Avoid if eGFR <30; reduce dose if 30-45. Hold during acute illness.",
     "source_reference": "BNF 86"},
    {"drug_name": "metformin", "interacts_with_condition": "kidney", "severity": "severe",
     "warning_message": "Metformin in chronic kidney disease risks lactic acidosis.",
     "clinical_action": "Check eGFR and dose-adjust; avoid in advanced CKD.",
     "source_reference": "BNF 86"},
    {"drug_name": "metformin", "interacts_with_condition": "heart failure", "severity": "moderate",
     "warning_message": "Unstable/acute heart failure with metformin increases lactic acidosis risk from hypoperfusion.",
     "clinical_action": "Avoid in acute or unstable heart failure; acceptable in stable, well-perfused patients.",
     "source_reference": "BNF 86"},

    # ---------- NSAIDs + hypertension ----------
    {"drug_name": "ibuprofen", "interacts_with_condition": "hypertension", "severity": "moderate",
     "warning_message": "NSAIDs (ibuprofen) raise blood pressure and blunt antihypertensive efficacy; renal risk.",
     "clinical_action": "Prefer paracetamol. If NSAID needed, use shortest course and monitor BP and renal function.",
     "source_reference": "BNF 86"},
    {"drug_name": "diclofenac", "interacts_with_condition": "hypertension", "severity": "moderate",
     "warning_message": "Diclofenac elevates blood pressure and carries added cardiovascular risk in hypertension.",
     "clinical_action": "Avoid where possible; prefer paracetamol. Monitor BP if used.",
     "source_reference": "BNF 86"},
    {"drug_name": "naproxen", "interacts_with_condition": "hypertension", "severity": "moderate",
     "warning_message": "Naproxen raises blood pressure and reduces antihypertensive effect.",
     "clinical_action": "Use shortest possible course; monitor BP and renal function.",
     "source_reference": "BNF 86"},

    # ---------- ACE inhibitors + pregnancy ----------
    {"drug_name": "enalapril", "interacts_with_condition": "pregnan", "severity": "severe",
     "warning_message": "ACE inhibitors (enalapril) are fetotoxic - cause renal failure and death in 2nd/3rd trimester.",
     "clinical_action": "Contraindicated in pregnancy. Switch to a pregnancy-safe agent (e.g. methyldopa, labetalol).",
     "source_reference": "BNF 86; WHO Model Formulary"},
    {"drug_name": "lisinopril", "interacts_with_condition": "pregnan", "severity": "severe",
     "warning_message": "Lisinopril (ACE inhibitor) is fetotoxic in pregnancy.",
     "clinical_action": "Contraindicated. Switch to methyldopa or labetalol.",
     "source_reference": "BNF 86"},
    {"drug_name": "captopril", "interacts_with_condition": "pregnan", "severity": "severe",
     "warning_message": "Captopril (ACE inhibitor) causes fetal harm in pregnancy.",
     "clinical_action": "Contraindicated. Use a pregnancy-safe antihypertensive.",
     "source_reference": "BNF 86"},

    # ---------- Methotrexate + folate antagonists / NSAIDs ----------
    {"drug_name": "methotrexate", "interacts_with_drug": "trimethoprim", "severity": "severe",
     "warning_message": "Trimethoprim + methotrexate (both antifolates) can cause severe bone-marrow suppression.",
     "clinical_action": "Avoid. Choose a non-antifolate antibiotic; if exposed, monitor FBC and give folinic acid.",
     "source_reference": "Stockley's Drug Interactions"},
    {"drug_name": "methotrexate", "interacts_with_drug": "cotrimoxazole", "severity": "severe",
     "warning_message": "Co-trimoxazole contains trimethoprim - additive antifolate marrow toxicity with methotrexate.",
     "clinical_action": "Avoid the combination. Monitor FBC closely if unavoidable.",
     "source_reference": "Stockley's Drug Interactions"},
    {"drug_name": "methotrexate", "interacts_with_drug": "ibuprofen", "severity": "moderate",
     "warning_message": "NSAIDs reduce methotrexate excretion, raising levels and toxicity (esp. high-dose).",
     "clinical_action": "Use NSAIDs cautiously with low-dose MTX; avoid with high-dose. Monitor for toxicity.",
     "source_reference": "Stockley's Drug Interactions"},

    # ---------- HIV ARV interactions ----------
    {"drug_name": "ritonavir", "interacts_with_drug": "simvastatin", "severity": "severe",
     "warning_message": "Ritonavir greatly raises simvastatin levels, risking rhabdomyolysis.",
     "clinical_action": "Contraindicated. Use a lower-risk statin (e.g. atorvastatin low dose) with monitoring.",
     "source_reference": "EACS Guidelines"},
    {"drug_name": "dolutegravir", "interacts_with_drug": "metformin", "severity": "moderate",
     "warning_message": "Dolutegravir increases metformin exposure, raising GI and lactic acidosis risk.",
     "clinical_action": "Limit metformin to <=1000 mg/day and monitor glucose and renal function.",
     "source_reference": "EACS Guidelines"},
    {"drug_name": "efavirenz", "interacts_with_drug": "contraceptive", "severity": "moderate",
     "warning_message": "Efavirenz can lower hormonal contraceptive levels, reducing efficacy.",
     "clinical_action": "Advise an additional barrier method or a long-acting method (e.g. copper IUD).",
     "source_reference": "WHO MEC"},
]


def seed() -> None:
    db = SessionLocal()
    try:
        deleted = db.query(DrugInteractionRule).delete()
        for r in RULES:
            db.add(DrugInteractionRule(
                drug_name=r["drug_name"].lower().strip(),
                interacts_with_drug=r.get("interacts_with_drug"),
                interacts_with_condition=r.get("interacts_with_condition"),
                interacts_with_allergy=r.get("interacts_with_allergy"),
                severity=r["severity"],
                warning_message=r["warning_message"],
                clinical_action=r["clinical_action"],
                source_reference=r.get("source_reference"),
            ))
        db.commit()
        print(f"Cleared {deleted} existing rule(s); inserted {len(RULES)} rule(s).")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
