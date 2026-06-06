"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Header from "@/components/Header";
import { apiGet } from "@/lib/api";
import { clearToken, isLoggedIn } from "@/lib/auth";

type Patient = {
  id: string;
  nrc: string;
  full_name: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  allergies: string | null;
};

type Prescription = {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
};

type Visit = {
  id: string;
  created_at: string;
  diagnosis: string;
  vitals_bp: string | null;
  vitals_temp: number | null;
  vitals_weight: number | null;
  notes: string | null;
  prescriptions: Prescription[];
};

const AUTH_ERROR_MESSAGES = new Set([
  "Not authenticated",
  "Could not validate credentials",
]);

function formatNiceDate(s: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  const d = m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function vitalsLine(v: Visit): string {
  const parts: string[] = [];
  if (v.vitals_bp) parts.push(`BP: ${v.vitals_bp}`);
  if (v.vitals_temp != null) parts.push(`Temp: ${v.vitals_temp}°C`);
  if (v.vitals_weight != null) parts.push(`Weight: ${v.vitals_weight}kg`);
  return parts.join(" | ");
}

function prescriptionText(p: Prescription): string {
  const base = `${p.medication_name} — ${p.dosage}, ${p.frequency} for ${p.duration}.`;
  return p.instructions ? `${base} ${p.instructions}` : base;
}

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    apiGet<Patient>(`/patients/${id}`)
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
        } else if (msg === "Patient not found") {
          setNotFound(true);
        } else {
          setError(msg);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  useEffect(() => {
    if (!patient) return;
    let cancelled = false;
    apiGet<Visit[]>(`/patients/${id}/visits`)
      .then((vs) => {
        if (cancelled) return;
        setVisits(vs);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : "Failed to load visits";
        if (AUTH_ERROR_MESSAGES.has(msg)) {
          clearToken();
          router.replace("/login");
        } else {
          setError(msg);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, patient, router]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
          <h1 className="text-xl font-bold mb-2">Patient not found</h1>
          <p className="text-gray-600 mb-4">
            This patient may have been removed or the link is incorrect.
          </p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Back to dashboard
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3 mb-4">
            {error}
          </div>
        )}

        {!patient ? (
          <p className="text-gray-500 text-sm py-8 text-center">Loading...</p>
        ) : (
          <>
            <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <h1 className="text-2xl font-bold mb-4">{patient.full_name}</h1>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">NRC</dt>
                  <dd className="font-medium">{patient.nrc}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Phone</dt>
                  <dd className="font-medium">{patient.phone}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Date of Birth</dt>
                  <dd className="font-medium">
                    {formatNiceDate(patient.date_of_birth)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Gender</dt>
                  <dd className="font-medium capitalize">{patient.gender}</dd>
                </div>
              </dl>

              {patient.allergies && patient.allergies.trim() !== "" && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                  <span className="font-medium text-yellow-900">
                    Allergies:{" "}
                  </span>
                  <span className="text-yellow-900">{patient.allergies}</span>
                </div>
              )}
            </section>

            <div className="my-6">
              <Link
                href={`/patients/${id}/visits/new`}
                className="inline-flex items-center justify-center w-full sm:w-auto bg-blue-600 text-white px-5 py-3 rounded font-medium hover:bg-blue-700"
              >
                + Record New Visit
              </Link>
            </div>

            <h2 className="text-xl font-bold mb-4">Visit History</h2>

            {visits === null ? (
              <p className="text-gray-500 text-sm py-8 text-center">
                Loading visits...
              </p>
            ) : visits.length === 0 ? (
              <p className="text-gray-500 text-sm py-8 text-center">
                No visits recorded yet.
              </p>
            ) : (
              <div className="space-y-4">
                {visits.map((v) => {
                  const vitals = vitalsLine(v);
                  return (
                    <div
                      key={v.id}
                      className="bg-white border border-gray-200 rounded-lg p-5"
                    >
                      <p className="text-sm text-gray-500">
                        {formatNiceDate(v.created_at)}
                      </p>
                      <p className="font-bold text-base mt-1">{v.diagnosis}</p>
                      {vitals && (
                        <p className="text-sm text-gray-600 mt-1">{vitals}</p>
                      )}
                      {v.notes && (
                        <p className="text-sm mt-2 whitespace-pre-line">
                          {v.notes}
                        </p>
                      )}
                      {v.prescriptions.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700">
                            Prescriptions:
                          </p>
                          <ul className="text-sm mt-1 space-y-1">
                            {v.prescriptions.map((p) => (
                              <li key={p.id}>• {prescriptionText(p)}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
