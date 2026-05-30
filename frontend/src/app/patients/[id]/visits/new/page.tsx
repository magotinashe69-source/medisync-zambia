"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import Header from "@/components/Header";
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

export default function NewVisitPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const patientId = params.id;

  const [patient, setPatient] = useState<Patient | null>(null);

  const [vitalsBp, setVitalsBp] = useState("");
  const [vitalsTemp, setVitalsTemp] = useState("");
  const [vitalsWeight, setVitalsWeight] = useState("");

  const [diagnosisChoice, setDiagnosisChoice] = useState("");
  const [diagnosisOther, setDiagnosisOther] = useState("");
  const [notes, setNotes] = useState("");

  const [prescriptions, setPrescriptions] = useState<PrescriptionInput[]>([]);

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
  }

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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-[700px] mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold">Record New Visit</h1>
          <p className="text-gray-600 text-sm mt-1">
            for {patient ? patient.full_name : "…"}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3 mt-4 whitespace-pre-line">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-8">
            <section>
              <h2 className="text-lg font-semibold mb-4 border-b border-gray-200 pb-2">
                Vitals
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="bp"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Blood Pressure
                  </label>
                  <input
                    id="bp"
                    type="text"
                    value={vitalsBp}
                    onChange={(e) => setVitalsBp(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">e.g. 120/80</p>
                </div>

                <div>
                  <label
                    htmlFor="temp"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Temperature (°C)
                  </label>
                  <input
                    id="temp"
                    type="number"
                    step="0.1"
                    min="0"
                    value={vitalsTemp}
                    onChange={(e) => setVitalsTemp(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="weight"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Weight (kg)
                  </label>
                  <input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0"
                    value={vitalsWeight}
                    onChange={(e) => setVitalsWeight(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-4 border-b border-gray-200 pb-2">
                Diagnosis
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="diagnosis"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Diagnosis
                  </label>
                  <select
                    id="diagnosis"
                    required
                    value={diagnosisChoice}
                    onChange={(e) => setDiagnosisChoice(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>
                      Select diagnosis
                    </option>
                    {DIAGNOSIS_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {diagnosisChoice === OTHER_OPTION && (
                  <div>
                    <label
                      htmlFor="diagnosisOther"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Specify diagnosis
                    </label>
                    <input
                      id="diagnosisOther"
                      type="text"
                      required
                      value={diagnosisOther}
                      onChange={(e) => setDiagnosisOther(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Clinical observations, history...
                  </p>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
                <h2 className="text-lg font-semibold">Prescriptions</h2>
                <button
                  type="button"
                  onClick={addPrescription}
                  className="text-sm text-blue-600 hover:underline"
                >
                  + Add Prescription
                </button>
              </div>

              {prescriptions.length === 0 ? (
                <p className="text-sm text-gray-500 py-3">
                  No prescriptions yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {prescriptions.map((p, i) => (
                    <div
                      key={p.localId}
                      className="border border-gray-200 rounded p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-700">
                          Prescription {i + 1}
                        </p>
                        <button
                          type="button"
                          onClick={() => removePrescription(p.localId)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Medication Name
                          </label>
                          <input
                            type="text"
                            required
                            value={p.medication_name}
                            onChange={(e) =>
                              updatePrescription(
                                p.localId,
                                "medication_name",
                                e.target.value,
                              )
                            }
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Dosage
                            </label>
                            <input
                              type="text"
                              required
                              value={p.dosage}
                              onChange={(e) =>
                                updatePrescription(
                                  p.localId,
                                  "dosage",
                                  e.target.value,
                                )
                              }
                              placeholder="500mg"
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Frequency
                            </label>
                            <input
                              type="text"
                              required
                              value={p.frequency}
                              onChange={(e) =>
                                updatePrescription(
                                  p.localId,
                                  "frequency",
                                  e.target.value,
                                )
                              }
                              placeholder="twice daily"
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Duration
                            </label>
                            <input
                              type="text"
                              required
                              value={p.duration}
                              onChange={(e) =>
                                updatePrescription(
                                  p.localId,
                                  "duration",
                                  e.target.value,
                                )
                              }
                              placeholder="5 days"
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Instructions
                          </label>
                          <input
                            type="text"
                            value={p.instructions}
                            onChange={(e) =>
                              updatePrescription(
                                p.localId,
                                "instructions",
                                e.target.value,
                              )
                            }
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <Link
                href={`/patients/${patientId}`}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-medium hover:bg-gray-300"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Save Visit"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
