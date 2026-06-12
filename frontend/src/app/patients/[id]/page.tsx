"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

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
  // Personal
  next_of_kin_name: string | null;
  next_of_kin_relationship: string | null;
  next_of_kin_phone: string | null;
  marital_status: string | null;
  occupation: string | null;
  preferred_language: string | null;
  // Insurance
  has_insurance: boolean;
  insurance_provider: string | null;
  insurance_member_number: string | null;
  insurance_plan_type: string | null;
  // Clinical background
  blood_group: string | null;
  known_allergies: string | null;
  chronic_conditions: string | null;
  current_medications: string | null;
  family_history: string | null;
  social_history: string | null;
  immunization_record: string | null;
  // Emergency
  emergency_critical_allergies: string | null;
  emergency_contact_primary: string | null;
  emergency_contact_secondary: string | null;
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

type Surgery = {
  id: string;
  surgery_date: string;
  procedure_name: string;
  facility: string;
  anaesthetic_used: string | null;
  notes: string | null;
};

const AUTH_ERROR_MESSAGES = new Set([
  "Not authenticated",
  "Could not validate credentials",
]);

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  ny: "Nyanja",
  bem: "Bemba",
  toi: "Tonga",
  loz: "Lozi",
  other: "Other",
};

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

function hasText(v: string | null | undefined): v is string {
  return typeof v === "string" && v.trim() !== "";
}

/** A label/value row; renders nothing when the value is empty. */
function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!hasText(value)) return null;
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3 text-sm">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="whitespace-pre-line text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}

/** Section card with a heading; renders nothing when it has no visible content. */
function InfoCard({
  title,
  action,
  hasContent,
  children,
}: {
  title: string;
  action?: ReactNode;
  hasContent: boolean;
  children: ReactNode;
}) {
  return (
    <Card className="p-0">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
        <h2 className="font-heading text-sm font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      {hasContent ? (
        children
      ) : (
        <p className="px-5 py-4 text-sm text-slate-400">Not recorded.</p>
      )}
    </Card>
  );
}

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[] | null>(null);
  const [surgeries, setSurgeries] = useState<Surgery[] | null>(null);
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
        if (!cancelled) setVisits(vs);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to load visits";
        if (AUTH_ERROR_MESSAGES.has(msg)) {
          clearToken();
          router.replace("/login");
        } else {
          setError(msg);
        }
      });

    apiGet<Surgery[]>(`/patients/${id}/surgeries`)
      .then((ss) => {
        if (!cancelled) setSurgeries(ss);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to load surgeries";
        if (AUTH_ERROR_MESSAGES.has(msg)) {
          clearToken();
          router.replace("/login");
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

  const emergencyItems = patient
    ? [
        hasText(patient.blood_group),
        hasText(patient.emergency_critical_allergies),
        hasText(patient.emergency_contact_primary),
        hasText(patient.emergency_contact_secondary),
      ].some(Boolean)
    : false;

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
          <>
            {/* EMERGENCY banner — always at top, red-highlighted */}
            <div className="mb-6 overflow-hidden rounded-xl border-2 border-red-300 bg-red-50 shadow-sm">
              <div className="flex items-center gap-2 border-b border-red-200 bg-red-100 px-5 py-2.5">
                <svg className="h-5 w-5 shrink-0 text-red-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.515 2.625H3.72c-1.345 0-2.188-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-red-800">
                  Emergency Information
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 px-5 py-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Blood group</p>
                  <p className="mt-0.5 text-lg font-bold text-red-900">
                    {hasText(patient.blood_group) ? patient.blood_group : "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Critical allergies</p>
                  <p className="mt-0.5 whitespace-pre-line text-sm font-medium text-red-900">
                    {hasText(patient.emergency_critical_allergies)
                      ? patient.emergency_critical_allergies
                      : "None recorded"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Primary contact</p>
                  <p className="mt-0.5 text-sm font-medium text-red-900">
                    {hasText(patient.emergency_contact_primary)
                      ? patient.emergency_contact_primary
                      : "Not recorded"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Secondary contact</p>
                  <p className="mt-0.5 text-sm font-medium text-red-900">
                    {hasText(patient.emergency_contact_secondary)
                      ? patient.emergency_contact_secondary
                      : "Not recorded"}
                  </p>
                </div>
              </div>
              {!emergencyItems && (
                <p className="border-t border-red-200 px-5 py-2 text-xs text-red-500">
                  No emergency details captured for this patient yet.
                </p>
              )}
            </div>

            <div className="lg:grid lg:grid-cols-3 lg:items-start lg:gap-6">
              {/* Left: patient info */}
              <div className="space-y-6 lg:col-span-1">
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
                    <InfoRow label="NRC" value={patient.nrc} />
                    <InfoRow label="Phone" value={patient.phone} />
                    <InfoRow label="Date of birth" value={formatNiceDate(patient.date_of_birth)} />
                    <InfoRow label="Gender" value={patient.gender} />
                  </dl>

                  {hasText(patient.allergies) && (
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

                {/* Personal Details */}
                <InfoCard
                  title="Personal Details"
                  hasContent={
                    hasText(patient.marital_status) ||
                    hasText(patient.occupation) ||
                    hasText(patient.preferred_language) ||
                    hasText(patient.next_of_kin_name) ||
                    hasText(patient.next_of_kin_phone)
                  }
                >
                  <dl className="divide-y divide-slate-100">
                    <InfoRow label="Marital status" value={patient.marital_status} />
                    <InfoRow label="Occupation" value={patient.occupation} />
                    <InfoRow
                      label="Language"
                      value={
                        hasText(patient.preferred_language)
                          ? LANGUAGE_LABELS[patient.preferred_language] ?? patient.preferred_language
                          : null
                      }
                    />
                    <InfoRow label="Next of kin" value={patient.next_of_kin_name} />
                    <InfoRow label="Relationship" value={patient.next_of_kin_relationship} />
                    <InfoRow label="Kin phone" value={patient.next_of_kin_phone} />
                  </dl>
                </InfoCard>

                {/* Insurance */}
                <InfoCard
                  title="Medical Aid / Insurance"
                  hasContent={patient.has_insurance}
                >
                  {patient.has_insurance ? (
                    <dl className="divide-y divide-slate-100">
                      <div className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                        <dt className="text-slate-500">Status</dt>
                        <dd className="text-right">
                          <Badge variant="success">Insured</Badge>
                        </dd>
                      </div>
                      <InfoRow label="Provider" value={patient.insurance_provider} />
                      <InfoRow label="Member no." value={patient.insurance_member_number} />
                      <InfoRow label="Plan type" value={patient.insurance_plan_type} />
                    </dl>
                  ) : (
                    <p className="px-5 py-4 text-sm text-slate-400">No medical aid on record.</p>
                  )}
                </InfoCard>

                {/* Clinical Background */}
                <InfoCard
                  title="Clinical Background"
                  hasContent={
                    hasText(patient.blood_group) ||
                    hasText(patient.known_allergies) ||
                    hasText(patient.chronic_conditions) ||
                    hasText(patient.current_medications) ||
                    hasText(patient.family_history) ||
                    hasText(patient.social_history) ||
                    hasText(patient.immunization_record)
                  }
                >
                  <dl className="divide-y divide-slate-100">
                    <InfoRow label="Blood group" value={patient.blood_group} />
                    <InfoRow label="Known allergies" value={patient.known_allergies} />
                    <InfoRow label="Chronic conditions" value={patient.chronic_conditions} />
                    <InfoRow label="Current medications" value={patient.current_medications} />
                    <InfoRow label="Family history" value={patient.family_history} />
                    <InfoRow label="Social history" value={patient.social_history} />
                    <InfoRow label="Immunizations" value={patient.immunization_record} />
                  </dl>
                </InfoCard>
              </div>

              {/* Right: surgical history + visit timeline */}
              <div className="mt-6 space-y-8 lg:col-span-2 lg:mt-0">
                {/* Past Surgical History */}
                <section>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-heading text-lg font-bold text-slate-900 sm:text-xl">
                      Past surgical history
                    </h2>
                    <Link
                      href={`/patients/${id}/surgeries/new`}
                      className={buttonClasses({ variant: "secondary", size: "sm" })}
                    >
                      + Record Past Surgery
                    </Link>
                  </div>

                  <div className="mt-4">
                    {surgeries === null ? (
                      <div className="flex justify-center py-8">
                        <Spinner className="text-primary-600" />
                      </div>
                    ) : surgeries.length === 0 ? (
                      <Card>
                        <p className="text-sm text-slate-500">No past surgeries recorded.</p>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {surgeries.map((s) => (
                          <Card key={s.id}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h3 className="font-heading text-base font-semibold text-slate-900">
                                {s.procedure_name}
                              </h3>
                              <span className="text-xs text-slate-400">
                                {formatNiceDate(s.surgery_date)}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant="gray">{s.facility}</Badge>
                              {hasText(s.anaesthetic_used) && (
                                <Badge variant="primary">Anaesthetic: {s.anaesthetic_used}</Badge>
                              )}
                            </div>
                            {hasText(s.notes) && (
                              <p className="mt-3 whitespace-pre-line text-sm text-slate-700">
                                {s.notes}
                              </p>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                {/* Visit history */}
                <section>
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
                </section>
              </div>
            </div>
          </>
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
