"use client";

import { Scissors } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import Header from "@/components/ui/Header";
import Spinner from "@/components/ui/Spinner";
import { apiGet } from "@/lib/api";
import { clearToken, isLoggedIn } from "@/lib/auth";
import { fetchSurgeryView, SurgeryViewError } from "@/lib/clinical-views-api";

type Me = {
  full_name: string;
  facility_name: string;
};

export default function SurgeryLookupPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [nrc, setNrc] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Same auth pattern as the dashboard: redirect to /login if not authed.
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Client-side validation.
    const trimmedNrc = nrc.trim();
    const trimmedReason = reason.trim();
    if (!trimmedNrc) {
      setError("Please enter a patient NRC or name.");
      return;
    }
    if (trimmedReason.length < 5) {
      setError("Reason must be at least 5 characters.");
      return;
    }

    setLoading(true);
    try {
      const data = await fetchSurgeryView(trimmedNrc, trimmedReason);
      // sessionStorage (not localStorage) — clears on tab close, safer for PHI.
      window.sessionStorage.setItem("surgery-view-data", JSON.stringify(data));
      router.push("/clinical-views/surgery/result");
    } catch (err) {
      if (err instanceof SurgeryViewError) {
        if (err.status === 401) {
          clearToken();
          router.replace("/login");
          return;
        }
        if (err.status === 404) {
          setError("Patient not found");
        } else if (err.status === 422) {
          setError(err.message);
        } else if (err.status >= 500) {
          setError("Server error. Please try again.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userName={me?.full_name} facilityName={me?.facility_name} />

      <main className="mx-auto max-w-2xl p-6 md:p-8">
        {/* Back link */}
        <Link
          href="/clinical-views"
          className="mb-6 inline-block text-sm text-gray-600 hover:text-brand-700"
        >
          ← Back to Smart Views
        </Link>

        {/* Page header */}
        <div className="mb-6">
          <Scissors className="h-8 w-8 text-brand-700" />
          <h1 className="mt-3 font-heading text-3xl font-bold text-gray-900">
            Surgery Preparation Lookup
          </h1>
          <p className="mt-2 text-gray-600">
            Get critical anaesthetic and surgical info instantly
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <form onSubmit={handleSubmit} noValidate>
            {/* Field 1: Patient NRC or Name */}
            <div className="mb-6">
              <label htmlFor="nrc" className="text-sm font-medium text-gray-700">
                Patient NRC or Name <span className="text-critical-600">*</span>
              </label>
              <input
                id="nrc"
                type="text"
                value={nrc}
                onChange={(e) => setNrc(e.target.value)}
                placeholder="e.g., 123456/72/1"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-body text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>

            {/* Field 2: Reason for Access */}
            <div className="mb-6">
              <label
                htmlFor="reason"
                className="text-sm font-medium text-gray-700"
              >
                Reason for Access <span className="text-critical-600">*</span>{" "}
                <span className="text-xs font-normal text-gray-500">
                  (required — logged for compliance)
                </span>
              </label>
              <input
                id="reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Pre-op anaesthetic review"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-body text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>

            {/* Error (above the submit button) */}
            {error && (
              <div className="mb-6 rounded-lg border border-critical-500 bg-critical-50 p-3 font-medium text-critical-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 py-3 font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-brand-700"
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  Looking up…
                </>
              ) : (
                "Look Up Patient →"
              )}
            </button>
          </form>

          {/* Help text (below button) */}
          <p className="mt-4 text-center text-sm text-gray-500">
            Sample data: Try NRC 123456/72/1 (John Banda)
          </p>
        </div>
      </main>
    </div>
  );
}
