"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Badge from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Header from "@/components/ui/Header";
import Spinner from "@/components/ui/Spinner";
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

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
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
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <Card className="p-0">
            <EmptyState
              icon={
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9.5a2.5 2.5 0 014.5 1.5c0 1.5-2 2-2 3M12 17h.01" />
                </svg>
              }
              title="Patient not found"
              message="This patient may have been removed or the link is incorrect."
              action={
                <Link href="/dashboard" className={buttonClasses()}>
                  Back to dashboard
                </Link>
              }
            />
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:pb-10 sm:pt-8">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.83 10l3.94 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
          Back to dashboard
        </Link>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {!patient ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" className="text-primary-600" />
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-3 lg:items-start lg:gap-6">
            {/* Left: patient summary (sticky on desktop) */}
            <div className="lg:col-span-1 lg:sticky lg:top-20">
              <Card className="overflow-hidden p-0">
                <div className="bg-gradient-to-br from-primary-600 to-primary-800 px-5 py-6 text-white">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 font-heading text-lg font-bold">
                      {initials(patient.full_name)}
                    </div>
                    <div className="min-w-0">
                      <h1 className="truncate font-heading text-xl font-bold">
                        {patient.full_name}
                      </h1>
                      <p className="text-sm capitalize text-primary-100">
                        {patient.gender}
                      </p>
                    </div>
                  </div>
                </div>

                <dl className="divide-y divide-slate-100">
                  <div className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                    <dt className="text-slate-500">NRC</dt>
                    <dd className="text-right font-medium text-slate-900">{patient.nrc}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                    <dt className="text-slate-500">Phone</dt>
                    <dd className="text-right font-medium text-slate-900">{patient.phone}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                    <dt className="text-slate-500">Date of birth</dt>
                    <dd className="text-right font-medium text-slate-900">
                      {formatNiceDate(patient.date_of_birth)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                    <dt className="text-slate-500">Gender</dt>
                    <dd className="text-right font-medium capitalize text-slate-900">
                      {patient.gender}
                    </dd>
                  </div>
                </dl>

                {patient.allergies && patient.allergies.trim() !== "" && (
                  <div className="border-t border-slate-100 p-5">
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.515 2.625H3.72c-1.345 0-2.188-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      <p>
                        <span className="font-semibold">Allergies: </span>
                        {patient.allergies}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Right: visit timeline */}
            <div className="mt-6 lg:col-span-2 lg:mt-0">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold text-slate-900 sm:text-xl">
                  Visit history
                </h2>
                <Link
                  href={`/patients/${id}/visits/new`}
                  className={buttonClasses({ className: "hidden sm:inline-flex" })}
                >
                  + Record New Visit
                </Link>
              </div>

              <div className="mt-4">
                {visits === null ? (
                  <div className="flex justify-center py-12">
                    <Spinner className="text-primary-600" />
                  </div>
                ) : visits.length === 0 ? (
                  <Card className="p-0">
                    <EmptyState
                      icon={
                        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5.5H6.5a2 2 0 00-2 2V19a2 2 0 002 2h11a2 2 0 002-2V7.5a2 2 0 00-2-2H16" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5h6a1 1 0 011 1V6a1 1 0 01-1 1H9a1 1 0 01-1-1v-.5a1 1 0 011-1z" />
                        </svg>
                      }
                      title="No visits yet"
                      message="Record this patient's first visit to start their history."
                    />
                  </Card>
                ) : (
                  <div>
                    {visits.map((v, i) => (
                      <div key={v.id} className="flex gap-4">
                        {/* Timeline marker */}
                        <div className="flex flex-col items-center">
                          <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-primary-600 ring-4 ring-primary-100" />
                          {i < visits.length - 1 && (
                            <span className="w-px flex-1 bg-slate-200" />
                          )}
                        </div>

                        {/* Visit card */}
                        <div className="flex-1 pb-5">
                          <Card>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h3 className="font-heading text-base font-semibold text-slate-900">
                                {v.diagnosis}
                              </h3>
                              <span className="text-xs text-slate-400">
                                {formatNiceDate(v.created_at)}
                              </span>
                            </div>

                            {(v.vitals_bp || v.vitals_temp != null || v.vitals_weight != null) && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {v.vitals_bp && <Badge variant="primary">BP {v.vitals_bp}</Badge>}
                                {v.vitals_temp != null && <Badge variant="primary">{v.vitals_temp}°C</Badge>}
                                {v.vitals_weight != null && <Badge variant="primary">{v.vitals_weight} kg</Badge>}
                              </div>
                            )}

                            {v.notes && (
                              <p className="mt-3 whitespace-pre-line text-sm text-slate-700">
                                {v.notes}
                              </p>
                            )}

                            {v.prescriptions.length > 0 && (
                              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Prescriptions
                                </p>
                                <ul className="mt-2 space-y-2">
                                  {v.prescriptions.map((p) => (
                                    <li key={p.id} className="text-sm text-slate-700">
                                      <span className="font-medium text-slate-900">
                                        {p.medication_name}
                                      </span>
                                      {" — "}
                                      {p.dosage}, {p.frequency} for {p.duration}.
                                      {p.instructions ? (
                                        <span className="text-slate-500"> {p.instructions}</span>
                                      ) : null}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </Card>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sticky mobile CTA */}
      {patient && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:hidden">
          <Link
            href={`/patients/${id}/visits/new`}
            className={buttonClasses({ fullWidth: true })}
          >
            + Record New Visit
          </Link>
        </div>
      )}
    </div>
  );
}
