"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import Button, { buttonClasses } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Header from "@/components/ui/Header";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { apiGet, apiPost } from "@/lib/api";
import { clearToken, isLoggedIn } from "@/lib/auth";

type Patient = {
  id: string;
  full_name: string;
};

const AUTH_ERROR_MESSAGES = new Set([
  "Not authenticated",
  "Could not validate credentials",
]);

export default function NewSurgeryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const patientId = params.id;

  const [patient, setPatient] = useState<Patient | null>(null);

  const [surgeryDate, setSurgeryDate] = useState("");
  const [procedureName, setProcedureName] = useState("");
  const [facility, setFacility] = useState("");
  const [anaesthetic, setAnaesthetic] = useState("");
  const [notes, setNotes] = useState("");

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
        const msg = err instanceof Error ? err.message : "Failed to load patient";
        if (AUTH_ERROR_MESSAGES.has(msg)) {
          clearToken();
          router.replace("/login");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [patientId, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiPost(`/patients/${patientId}/surgeries`, {
        surgery_date: surgeryDate,
        procedure_name: procedureName,
        facility,
        anaesthetic_used: anaesthetic.trim() || null,
        notes: notes.trim() || null,
      });
      router.push(`/patients/${patientId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save surgery";
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
          Record past surgery
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
          <Card>
            <div className="space-y-5">
              <Input
                label="Procedure name"
                id="procedure"
                type="text"
                required
                placeholder="e.g. Appendectomy"
                value={procedureName}
                onChange={(e) => setProcedureName(e.target.value)}
              />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  label="Surgery date"
                  id="surgeryDate"
                  type="date"
                  required
                  value={surgeryDate}
                  onChange={(e) => setSurgeryDate(e.target.value)}
                />
                <Input
                  label="Facility"
                  id="facility"
                  type="text"
                  required
                  placeholder="Hospital / clinic"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                />
              </div>

              <Input
                label="Anaesthetic used"
                id="anaesthetic"
                type="text"
                placeholder="e.g. general, spinal, local"
                value={anaesthetic}
                onChange={(e) => setAnaesthetic(e.target.value)}
              />

              <Textarea
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                hint="Complications, outcome, surgeon…"
              />
            </div>
          </Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href={`/patients/${patientId}`}
              className={buttonClasses({ variant: "ghost", className: "w-full sm:w-auto" })}
            >
              Cancel
            </Link>
            <Button type="submit" loading={loading} className="w-full sm:w-auto">
              {loading ? "Saving…" : "Save Surgery"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
