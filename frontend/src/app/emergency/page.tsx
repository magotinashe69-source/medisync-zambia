"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import Button from "@/components/ui/Button";
import Header from "@/components/ui/Header";
import Input from "@/components/ui/Input";
import { apiGet } from "@/lib/api";
import { clearToken, isLoggedIn } from "@/lib/auth";

type PastSurgery = {
  surgery_date: string;
  procedure_name: string;
  anaesthetic_used: string | null;
};

type EmergencyCard = {
  patient_name: string;
  patient_id: string;
  nrc: string;
  age: number;
  sex: string;
  blood_group: string | null;
  critical_allergies: string[];
  current_medications: string | null;
  chronic_conditions: string | null;
  past_surgeries: PastSurgery[];
  emergency_contact_primary: string | null;
  emergency_contact_secondary: string | null;
  facility_of_origin: string | null;
};

type Me = {
  full_name: string;
  facility_name: string;
};

const AUTH_ERROR_MESSAGES = new Set([
  "Not authenticated",
  "Could not validate credentials",
]);

// Medications that change emergency management and must be flagged on sight.
const HIGH_RISK_MEDS = [
  "warfarin",
  "heparin",
  "enoxaparin",
  "clexane",
  "apixaban",
  "rivaroxaban",
  "dabigatran",
  "edoxaban",
  "clopidogrel",
  "aspirin",
  "insulin",
];

function hasText(v: string | null | undefined): v is string {
  return typeof v === "string" && v.trim() !== "";
}

function formatNiceDate(s: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function flaggedMeds(meds: string | null): string[] {
  if (!hasText(meds)) return [];
  const lower = meds.toLowerCase();
  return HIGH_RISK_MEDS.filter((m) => lower.includes(m));
}

export default function EmergencyLookupPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [query, setQuery] = useState("");
  const [reason, setReason] = useState("");
  const [card, setCard] = useState<EmergencyCard | null>(null);
  const [accessedAt, setAccessedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    apiGet<Me>("/auth/me")
      .then(setMe)
      .catch(() => {
        clearToken();
        router.replace("/login");
      });
  }, [router]);

  async function handleLookup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const id = query.trim();
    if (!id) return;
    setError(null);
    setLoading(true);
    setCard(null);
    setAccessedAt(null);
    try {
      // encodeURI keeps the NRC slashes (route uses a :path converter);
      // reason is logged in the audit trail by the backend.
      const reasonQs = reason.trim()
        ? `?reason=${encodeURIComponent(reason.trim())}`
        : "";
      const data = await apiGet<EmergencyCard>(
        `/patients/emergency/${encodeURI(id)}${reasonQs}`,
      );
      setCard(data);
      setAccessedAt(new Date().toLocaleString("en-GB"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lookup failed";
      if (AUTH_ERROR_MESSAGES.has(msg)) {
        clearToken();
        router.replace("/login");
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const meds = card ? flaggedMeds(card.current_medications) : [];

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <div className="print:hidden">
        <Header userName={me?.full_name} facilityName={me?.facility_name} />
      </div>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Search panel */}
        <div className="print:hidden">
          <div className="mb-6 flex items-center gap-2">
            <svg className="h-7 w-7 shrink-0 text-red-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.515 2.625H3.72c-1.345 0-2.188-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div>
              <h1 className="font-heading text-xl font-bold text-slate-900 sm:text-2xl">
                Emergency Lookup
              </h1>
              <p className="text-sm text-slate-500">
                Critical patient information for trauma &amp; emergency care.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleLookup}
            className="rounded-xl border-2 border-red-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <Input
              label="Enter patient NRC or phone for emergency lookup"
              id="emergencyQuery"
              type="text"
              required
              autoFocus
              placeholder="e.g. 123456/78/1 or 0977123456"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="mt-4">
              <Input
                label="Reason for access (logged)"
                id="emergencyReason"
                type="text"
                placeholder="e.g. unconscious trauma patient, A&E"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="danger"
              size="lg"
              fullWidth
              loading={loading}
              className="mt-4 text-base font-bold uppercase tracking-wide"
            >
              {loading ? "Looking up…" : "Emergency Access"}
            </Button>
          </form>

          {error && (
            <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Emergency card */}
        {card && (
          <article className="mt-6 overflow-hidden rounded-2xl border-4 border-red-500 bg-white shadow-lg print:mt-0 print:shadow-none">
            {/* Big top section */}
            <header className="bg-red-600 px-5 py-5 text-white sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-red-100">
                Emergency Card
              </p>
              <h2 className="mt-1 font-heading text-3xl font-extrabold leading-tight sm:text-4xl">
                {card.patient_name}
              </h2>
              <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-100">Age</p>
                  <p className="text-2xl font-bold sm:text-3xl">{card.age}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-100">Sex</p>
                  <p className="text-2xl font-bold capitalize sm:text-3xl">{card.sex}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-100">Blood group</p>
                  <p className="text-2xl font-extrabold sm:text-3xl">
                    {hasText(card.blood_group) ? card.blood_group : "Unknown"}
                  </p>
                </div>
              </div>
            </header>

            {/* Red panel: critical allergies */}
            <section className="border-b-4 border-red-100 bg-red-50 px-5 py-4 sm:px-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-red-700">
                Critical Allergies
              </h3>
              {card.critical_allergies.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {card.critical_allergies.map((a, i) => (
                    <li
                      key={i}
                      className="text-xl font-extrabold uppercase leading-snug text-red-700 sm:text-2xl"
                    >
                      ⚠ {a}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-base font-semibold text-red-600">
                  None recorded — do not assume none exist.
                </p>
              )}
            </section>

            {/* Yellow panel: current medications */}
            <section className="border-b border-slate-100 bg-amber-50 px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wide text-amber-800">
                  Current Medications
                </h3>
                {meds.length > 0 && (
                  <span className="rounded-md bg-amber-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                    ⚠ {meds.join(", ")}
                  </span>
                )}
              </div>
              <p className="mt-2 whitespace-pre-line text-base font-medium text-amber-900">
                {hasText(card.current_medications) ? card.current_medications : "None recorded."}
              </p>
            </section>

            {/* Gray panel: chronic conditions */}
            <section className="border-b border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">
                Chronic Conditions
              </h3>
              <p className="mt-2 whitespace-pre-line text-base font-medium text-slate-800">
                {hasText(card.chronic_conditions) ? card.chronic_conditions : "None recorded."}
              </p>
            </section>

            {/* Blue panel: past surgeries & anaesthetics */}
            <section className="border-b border-slate-100 bg-blue-50 px-5 py-4 sm:px-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-blue-800">
                Past Surgeries &amp; Anaesthetics
              </h3>
              {card.past_surgeries.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {card.past_surgeries.map((s, i) => (
                    <li
                      key={i}
                      className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-blue-100 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-base font-semibold text-blue-900">
                        {s.procedure_name}
                      </span>
                      <span className="text-xs text-blue-500">{formatNiceDate(s.surgery_date)}</span>
                      <span className="w-full text-sm font-medium text-blue-700">
                        Anaesthetic:{" "}
                        <span className="font-bold">
                          {hasText(s.anaesthetic_used) ? s.anaesthetic_used : "Not recorded"}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-base font-medium text-blue-900">
                  No past surgeries recorded.
                </p>
              )}
            </section>

            {/* Bottom panel: emergency contacts */}
            <section className="px-5 py-4 sm:px-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">
                Emergency Contacts
              </h3>
              <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Primary</p>
                  <p className="text-base font-semibold text-slate-900">
                    {hasText(card.emergency_contact_primary) ? card.emergency_contact_primary : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Secondary</p>
                  <p className="text-base font-semibold text-slate-900">
                    {hasText(card.emergency_contact_secondary) ? card.emergency_contact_secondary : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">NRC</p>
                  <p className="text-base font-medium text-slate-900">{card.nrc}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Facility of origin
                  </p>
                  <p className="text-base font-medium text-slate-900">
                    {hasText(card.facility_of_origin) ? card.facility_of_origin : "—"}
                  </p>
                </div>
              </div>
            </section>

            {/* Access logged footer */}
            <footer className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p>
                <span className="font-semibold uppercase tracking-wide text-slate-600">
                  Access logged
                </span>
                {accessedAt && <> · {accessedAt}</>}
                {me && <> · {me.full_name}</>}
              </p>
              <div className="flex items-center gap-3 print:hidden">
                <Link
                  href={`/patients/${card.patient_id}`}
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  Full record →
                </Link>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex min-h-[40px] items-center rounded-lg border border-slate-300 bg-white px-3 font-medium text-slate-700 hover:bg-slate-100"
                >
                  Print Emergency Card
                </button>
              </div>
            </footer>
          </article>
        )}
      </main>
    </div>
  );
}
