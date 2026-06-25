"use client";

import { ArrowLeft, Scissors } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Header from "@/components/ui/Header";
import { apiGet } from "@/lib/api";
import { clearToken, isLoggedIn } from "@/lib/auth";

interface SurgeryViewData {
  patient: {
    id: string;
    nrc: string;
    full_name: string;
    age: number;
    gender: string;
    blood_group: string | null;
  };
  critical_alerts: Array<{
    type: string;
    severity: string;
    title: string;
    detail: string;
    action: string | null;
  }>;
  previous_anaesthetics: Array<{
    surgery_id: string;
    surgery_date: string;
    procedure_name: string;
    facility: string;
    anaesthetic_used: string | null;
    complications: string | null;
    has_complications: boolean;
    surgeon_name: string | null;
  }>;
  current_medications: Array<{
    name: string;
    is_anticoagulant: boolean;
    is_high_risk: boolean;
  }>;
  comorbidities: string[];
  emergency_contact: {
    name: string | null;
    relationship: string | null;
    phone: string | null;
  } | null;
  metadata: {
    accessed_by: string;
    accessed_at: string;
    reason: string;
    view_type: string;
  };
}

type Me = {
  full_name: string;
  facility_name: string;
};

export default function SurgeryResultPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [data, setData] = useState<SurgeryViewData | null>(null);

  // Auth: redirect to /login if not authed (same pattern as other pages).
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

  // Load the looked-up data from sessionStorage.
  useEffect(() => {
    const raw = window.sessionStorage.getItem("surgery-view-data");
    if (!raw) {
      // No data (e.g. direct navigation) — send back to the lookup form.
      router.replace("/clinical-views/surgery");
      return;
    }
    try {
      setData(JSON.parse(raw) as SurgeryViewData);
    } catch {
      router.replace("/clinical-views/surgery");
    }
  }, [router]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading patient data…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userName={me?.full_name} facilityName={me?.facility_name} />

      <main className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        {/* Back link */}
        <Link
          href="/clinical-views/surgery"
          className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Search
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <Scissors className="h-8 w-8 text-brand-700" />
            <h1 className="font-heading text-3xl font-bold text-gray-900">
              Surgery Preparation
            </h1>
          </div>
          <p className="text-gray-600">Pre-operative clinical review</p>
        </div>

        {/* PLACEHOLDER: Raw data display for verification */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-heading font-semibold">
            Raw Data (temporary)
          </h2>
          <pre className="overflow-auto rounded bg-gray-100 p-4 text-xs">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>

        {/* Audit footer */}
        <div className="mt-8 border-t border-gray-200 pt-4 text-sm text-gray-500">
          ✓ Accessed by {data.metadata.accessed_by} at{" "}
          {new Date(data.metadata.accessed_at).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {" · "}
          Reason: {data.metadata.reason}
        </div>
      </main>
    </div>
  );
}
