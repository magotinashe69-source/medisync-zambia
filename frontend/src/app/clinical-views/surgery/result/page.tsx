"use client";

import { ArrowLeft, Scissors } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  CriticalAlertBanner,
  InfoRow,
  SectionCard,
  type CriticalAlert,
} from "@/components/clinical";
import Badge from "@/components/ui/Badge";
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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

  // Map backend alerts → CriticalAlertBanner shape (type union + null→undefined).
  const alerts = data.critical_alerts.map((a) => ({
    type: a.type as CriticalAlert["type"],
    title: a.title,
    detail: a.detail,
    action: a.action ?? undefined,
  }));

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
          <p className="text-gray-600">
            Pre-operative clinical review · {data.patient.full_name}
          </p>
        </div>

        {/* Critical alerts (renders nothing when empty) */}
        <CriticalAlertBanner alerts={alerts} />

        <div className="mt-6 space-y-6">
          {/* Patient identity */}
          <SectionCard title="Patient Identity">
            <InfoRow label="Full Name" value={data.patient.full_name} />
            <InfoRow label="NRC" value={data.patient.nrc} variant="mono" />
            <InfoRow label="Age" value={`${data.patient.age} years`} />
            <InfoRow label="Gender" value={data.patient.gender} />
            <InfoRow
              label="Blood Group"
              value={data.patient.blood_group ?? "—"}
            />
          </SectionCard>

          {/* Previous anaesthetics */}
          <SectionCard title="Previous Anaesthetics">
            {data.previous_anaesthetics.length === 0 ? (
              <p className="text-sm text-gray-500">
                No previous anaesthetic records.
              </p>
            ) : (
              <div className="space-y-4">
                {data.previous_anaesthetics.map((s) => (
                  <div
                    key={s.surgery_id}
                    className="rounded-lg border border-gray-100 bg-gray-50/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-heading text-base font-semibold text-gray-900">
                        {s.procedure_name}
                      </h3>
                      {s.has_complications && (
                        <Badge variant="danger">Complications</Badge>
                      )}
                    </div>
                    <div className="mt-2">
                      <InfoRow label="Date" value={formatDate(s.surgery_date)} />
                      <InfoRow label="Facility" value={s.facility} />
                      <InfoRow
                        label="Anaesthetic"
                        value={s.anaesthetic_used ?? "Not recorded"}
                      />
                      {s.complications && (
                        <InfoRow
                          label="Complications"
                          value={s.complications}
                          variant="critical"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Current medications */}
          <SectionCard title="Current Medications">
            {data.current_medications.length === 0 ? (
              <p className="text-sm text-gray-500">
                No current medications recorded.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.current_medications.map((m, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <span className="font-body text-base font-medium text-gray-900">
                      {m.name}
                    </span>
                    <span className="flex shrink-0 gap-1.5">
                      {m.is_anticoagulant ? (
                        <Badge variant="danger">Anticoagulant</Badge>
                      ) : m.is_high_risk ? (
                        <Badge variant="warning">High-risk</Badge>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Comorbidities */}
          <SectionCard title="Comorbidities">
            {data.comorbidities.length === 0 ? (
              <p className="text-sm text-gray-500">None recorded.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {data.comorbidities.map((c, i) => (
                  <li
                    key={i}
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Emergency contact */}
          {data.emergency_contact && (
            <SectionCard title="Emergency Contact">
              <InfoRow
                label="Name"
                value={data.emergency_contact.name ?? "—"}
              />
              <InfoRow
                label="Relationship"
                value={data.emergency_contact.relationship ?? "—"}
              />
              <InfoRow
                label="Phone"
                value={data.emergency_contact.phone ?? "—"}
              />
            </SectionCard>
          )}
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
