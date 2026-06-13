"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useId, useState } from "react";

import Button, { buttonClasses } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Header from "@/components/ui/Header";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { apiGet, apiPost } from "@/lib/api";
import { clearToken, isLoggedIn } from "@/lib/auth";

const DIAGNOSIS_OPTIONS = [
  "Malaria",
  "Tuberculosis",
  "HIV-related condition",
  "Hypertension",
  "Diabetes",
  "Respiratory infection",
  "Diarrheal disease",
  "Other (please specify)",
] as const;

const OTHER_OPTION = "Other (please specify)";

type Patient = {
  id: string;
  full_name: string;
};

type PrescriptionInput = {
  localId: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

const AUTH_ERROR_MESSAGES = new Set([
  "Not authenticated",
  "Could not validate credentials",
]);

function blankPrescription(): PrescriptionInput {
  return {
    localId: crypto.randomUUID(),
    medication_name: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  };
}

type Severity = "severe" | "moderate" | "minor";

type InteractionWarning = {
  severity: Severity;
  drug_name: string;
  conflicting_with: string | null;
  warning_message: string;
  clinical_action: string;
  source_reference: string | null;
};

type RowStatus = { hasWarnings: boolean; acknowledged: boolean };

const SEVERITY_STYLES: Record<
  Severity,
  { box: string; label: string; labelCls: string; icon: string; iconCls: string }
> = {
  severe: {
    box: "border-red-300 bg-red-50",
    label: "SEVERE INTERACTION",
    labelCls: "text-red-800",
    icon: "⚠",
    iconCls: "text-2xl text-red-600",
  },
  moderate: {
    box: "border-amber-300 bg-amber-50",
    label: "Moderate interaction",
    labelCls: "text-amber-900",
    icon: "⚠",
    iconCls: "text-xl text-amber-600",
  },
  minor: {
    box: "border-blue-200 bg-blue-50",
    label: "Note",
    labelCls: "text-blue-900",
    icon: "ℹ",
    iconCls: "text-xl text-blue-600",
  },
};

function PrescriptionRow({
  patientId,
  index,
  value,
  onChange,
  onRemove,
  onStatusChange,
}: {
  patientId: string;
  index: number;
  value: PrescriptionInput;
  onChange: (field: keyof Omit<PrescriptionInput, "localId">, value: string) => void;
  onRemove: () => void;
  onStatusChange: (localId: string, status: RowStatus) => void;
}) {
  const [warnings, setWarnings] = useState<InteractionWarning[]>([]);
  const [checking, setChecking] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const med = value.medication_name.trim();

  // Debounced interaction check (500ms) whenever the medication name changes.
  // All state updates happen inside the timer callback (not synchronously in
  // the effect body) to avoid cascading renders.
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(
      () => {
        if (cancelled) return;
        if (med.length < 3) {
          setWarnings([]);
          setChecking(false);
          setAcknowledged(false);
          return;
        }
        setChecking(true);
        apiPost<InteractionWarning[]>("/check-interactions", {
          patient_id: patientId,
          proposed_medication: med,
        })
          .then((w) => {
            if (cancelled) return;
            setWarnings(w);
            setAcknowledged(false); // new results must be re-acknowledged
          })
          .catch(() => {
            if (!cancelled) setWarnings([]);
          })
          .finally(() => {
            if (!cancelled) setChecking(false);
          });
      },
      med.length < 3 ? 0 : 500,
    );
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [med, patientId]);

  // Report this row's blocking status up to the parent.
  useEffect(() => {
    onStatusChange(value.localId, {
      hasWarnings: warnings.length > 0,
      acknowledged,
    });
  }, [warnings, acknowledged, value.localId, onStatusChange]);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <p className="font-heading text-sm font-semibold text-slate-900">
          Prescription {index + 1}
        </p>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex min-h-[44px] items-center gap-1 px-2 -mr-2 text-sm font-medium text-red-600 hover:text-red-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8.75 1a1 1 0 00-.95.68L7.5 3H4a.75.75 0 000 1.5h.5l.6 11.2A2 2 0 007.1 17h5.8a2 2 0 002-1.8L15.5 4.5h.5a.75.75 0 000-1.5H12.5l-.3-1.32A1 1 0 0011.25 1h-2.5zM9 7.25a.75.75 0 011.5 0v6a.75.75 0 01-1.5 0v-6z" clipRule="evenodd" />
          </svg>
          Remove
        </button>
      </div>

      <div className="mt-3 space-y-3">
        <Input
          label="Medication name"
          type="text"
          required
          value={value.medication_name}
          onChange={(e) => onChange("medication_name", e.target.value)}
        />

        {/* Interaction warnings — shown directly below the medication input */}
        {checking && (
          <p className="text-xs text-slate-400">Checking interactions…</p>
        )}

        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((w, i) => {
              const s = SEVERITY_STYLES[w.severity];
              return (
                <div
                  key={`${w.drug_name}-${w.conflicting_with}-${i}`}
                  className={`flex gap-2.5 rounded-lg border px-3 py-2.5 ${s.box}`}
                >
                  <span className={`leading-none ${s.iconCls}`} aria-hidden="true">
                    {s.icon}
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className={`font-bold uppercase tracking-wide ${s.labelCls}`}>
                      {s.label}
                    </p>
                    <p className={`mt-0.5 ${s.labelCls}`}>{w.warning_message}</p>
                    <p className={`mt-1 font-medium ${s.labelCls}`}>
                      Action: {w.clinical_action}
                    </p>
                    {w.source_reference && (
                      <p className="mt-1 text-xs text-slate-500">
                        Source: {w.source_reference}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Override requires explicit acknowledgement */}
            <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-lg border border-slate-300 bg-white px-3 py-2">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-slate-700">
                I have reviewed these interaction warnings and will proceed.
              </span>
            </label>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            label="Dosage"
            type="text"
            required
            placeholder="500mg"
            value={value.dosage}
            onChange={(e) => onChange("dosage", e.target.value)}
          />
          <Input
            label="Frequency"
            type="text"
            required
            placeholder="twice daily"
            value={value.frequency}
            onChange={(e) => onChange("frequency", e.target.value)}
          />
          <Input
            label="Duration"
            type="text"
            required
            placeholder="5 days"
            value={value.duration}
            onChange={(e) => onChange("duration", e.target.value)}
          />
        </div>

        <Input
          label="Instructions"
          type="text"
          value={value.instructions}
          onChange={(e) => onChange("instructions", e.target.value)}
        />
      </div>
    </div>
  );
}

export default function NewVisitPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const patientId = params.id;
  const notesId = useId();

  const [patient, setPatient] = useState<Patient | null>(null);

  const [vitalsBp, setVitalsBp] = useState("");
  const [vitalsTemp, setVitalsTemp] = useState("");
  const [vitalsWeight, setVitalsWeight] = useState("");

  const [diagnosisChoice, setDiagnosisChoice] = useState("");
  const [diagnosisOther, setDiagnosisOther] = useState("");
  const [notes, setNotes] = useState("");

  const [prescriptions, setPrescriptions] = useState<PrescriptionInput[]>([]);
  const [rowStatus, setRowStatus] = useState<Record<string, RowStatus>>({});

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    apiGet<Patient>(`/patients/${patientId}`)
      .then((p) => {
        if (cancelled) return;
        setPatient(p);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : "Failed to load patient";
        if (AUTH_ERROR_MESSAGES.has(msg)) {
          clearToken();
          router.replace("/login");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [patientId, router]);

  function addPrescription() {
    setPrescriptions((prev) => [...prev, blankPrescription()]);
  }

  function removePrescription(localId: string) {
    setPrescriptions((prev) => prev.filter((p) => p.localId !== localId));
    setRowStatus((prev) => {
      const next = { ...prev };
      delete next[localId];
      return next;
    });
  }

  const handleStatusChange = useCallback((localId: string, status: RowStatus) => {
    setRowStatus((prev) => {
      const cur = prev[localId];
      if (cur && cur.hasWarnings === status.hasWarnings && cur.acknowledged === status.acknowledged) {
        return prev; // no change — avoid needless re-render
      }
      return { ...prev, [localId]: status };
    });
  }, []);

  // True when at least one prescription has un-acknowledged interaction warnings.
  const hasUnacknowledged = prescriptions.some((p) => {
    const s = rowStatus[p.localId];
    return s?.hasWarnings && !s.acknowledged;
  });

  function updatePrescription(
    localId: string,
    field: keyof Omit<PrescriptionInput, "localId">,
    value: string,
  ) {
    setPrescriptions((prev) =>
      prev.map((p) => (p.localId === localId ? { ...p, [field]: value } : p)),
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const diagnosis =
      diagnosisChoice === OTHER_OPTION
        ? diagnosisOther.trim()
        : diagnosisChoice;

    if (!diagnosis) {
      setError(
        diagnosisChoice === OTHER_OPTION
          ? "Please specify the diagnosis"
          : "Please select a diagnosis",
      );
      setLoading(false);
      return;
    }

    if (hasUnacknowledged) {
      setError(
        "Please review and acknowledge the interaction warnings before saving.",
      );
      setLoading(false);
      return;
    }

    try {
      const visit = await apiPost<{ id: string }>(
        `/patients/${patientId}/visits`,
        {
          diagnosis,
          vitals_bp: vitalsBp.trim() || null,
          vitals_temp:
            vitalsTemp.trim() === "" ? null : parseFloat(vitalsTemp),
          vitals_weight:
            vitalsWeight.trim() === "" ? null : parseFloat(vitalsWeight),
          notes: notes.trim() || null,
        },
      );

      for (const p of prescriptions) {
        await apiPost(`/visits/${visit.id}/prescriptions`, {
          medication_name: p.medication_name,
          dosage: p.dosage,
          frequency: p.frequency,
          duration: p.duration,
          instructions: p.instructions.trim() || null,
        });
      }

      router.push(`/patients/${patientId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save visit";
      if (AUTH_ERROR_MESSAGES.has(msg)) {
        clearToken();
        router.replace("/login");
        return;
      }
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-2xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
        <Link
          href={`/patients/${patientId}`}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.83 10l3.94 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
          Back to patient
        </Link>

        <h1 className="font-heading text-xl font-bold text-slate-900 sm:text-2xl">
          Record new visit
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          for {patient ? patient.full_name : "…"}
        </p>

        {error && (
          <div className="mt-4 whitespace-pre-line rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Vitals */}
          <Card>
            <h2 className="font-heading text-base font-semibold text-slate-900">Vitals</h2>
            <p className="mt-0.5 text-sm text-slate-500">Optional — record what was measured.</p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Blood pressure"
                id="bp"
                type="text"
                hint="e.g. 120/80"
                value={vitalsBp}
                onChange={(e) => setVitalsBp(e.target.value)}
              />
              <Input
                label="Temperature (°C)"
                id="temp"
                type="number"
                step="0.1"
                min="0"
                value={vitalsTemp}
                onChange={(e) => setVitalsTemp(e.target.value)}
              />
              <Input
                label="Weight (kg)"
                id="weight"
                type="number"
                step="0.1"
                min="0"
                value={vitalsWeight}
                onChange={(e) => setVitalsWeight(e.target.value)}
              />
            </div>
          </Card>

          {/* Diagnosis */}
          <Card>
            <h2 className="font-heading text-base font-semibold text-slate-900">Diagnosis</h2>

            <div className="mt-4 space-y-4">
              <Select
                label="Diagnosis"
                id="diagnosis"
                required
                value={diagnosisChoice}
                onChange={(e) => setDiagnosisChoice(e.target.value)}
              >
                <option value="" disabled>
                  Select diagnosis
                </option>
                {DIAGNOSIS_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>

              {diagnosisChoice === OTHER_OPTION && (
                <Input
                  label="Specify diagnosis"
                  id="diagnosisOther"
                  type="text"
                  required
                  value={diagnosisOther}
                  onChange={(e) => setDiagnosisOther(e.target.value)}
                />
              )}

              <div>
                <label htmlFor={notesId} className="block text-sm font-medium text-slate-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  id={notesId}
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Clinical observations, history…
                </p>
              </div>
            </div>
          </Card>

          {/* Prescriptions */}
          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-heading text-base font-semibold text-slate-900">
                Prescriptions
              </h2>
              {prescriptions.length > 0 && (
                <span className="text-sm text-slate-400">
                  {prescriptions.length} added
                </span>
              )}
            </div>

            <div className="mt-4 space-y-4">
              {prescriptions.length === 0 && (
                <p className="text-sm text-slate-500">
                  No prescriptions added yet.
                </p>
              )}

              {prescriptions.map((p, i) => (
                <PrescriptionRow
                  key={p.localId}
                  patientId={patientId}
                  index={i}
                  value={p}
                  onChange={(field, value) => updatePrescription(p.localId, field, value)}
                  onRemove={() => removePrescription(p.localId)}
                  onStatusChange={handleStatusChange}
                />
              ))}

              <button
                type="button"
                onClick={addPrescription}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 text-sm font-medium text-primary-700 hover:border-primary-400 hover:bg-primary-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10 5a.75.75 0 01.75.75v3.5h3.5a.75.75 0 010 1.5h-3.5v3.5a.75.75 0 01-1.5 0v-3.5h-3.5a.75.75 0 010-1.5h3.5v-3.5A.75.75 0 0110 5z" />
                </svg>
                Add prescription
              </button>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href={`/patients/${patientId}`}
              className={buttonClasses({ variant: "ghost", className: "w-full sm:w-auto" })}
            >
              Cancel
            </Link>
            <Button
              type="submit"
              loading={loading}
              disabled={hasUnacknowledged}
              className="w-full sm:w-auto"
            >
              {loading ? "Saving…" : "Save Visit"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
