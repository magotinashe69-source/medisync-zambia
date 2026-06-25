"use client";

import { Pill, Scissors, Siren } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ViewSelectorCard } from "@/components/clinical";
import Header from "@/components/ui/Header";
import { apiGet } from "@/lib/api";
import { clearToken, isLoggedIn } from "@/lib/auth";

type Me = {
  full_name: string;
  facility_name: string;
};

export default function ClinicalViewsPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userName={me?.full_name} facilityName={me?.facility_name} />

      <main className="mx-auto max-w-6xl px-4 pb-12 pt-12 sm:px-6">
        {/* Page header */}
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl font-bold text-gray-900">
            Smart Clinical Views
          </h1>
          <p className="mt-2 text-gray-600">
            Right information at the right moment
          </p>
        </div>

        {/* Three view cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <ViewSelectorCard
            variant="surgery"
            icon={<Scissors className="h-8 w-8" />}
            title="Surgery Prep"
            description="Pre-operative anaesthetic history, allergies, anticoagulation status, and comorbidities at a glance."
            href="/clinical-views/surgery"
            isActive
          />
          <ViewSelectorCard
            variant="emergency"
            icon={<Siren className="h-8 w-8" />}
            title="Emergency Lookup"
            description="Critical patient information in seconds. Blood group, allergies, current medications, and emergency contacts."
            isActive={false}
          />
          <ViewSelectorCard
            variant="prescribing"
            icon={<Pill className="h-8 w-8" />}
            title="Prescribe Safely"
            description="Drug interaction checks, allergy alerts, and renal/hepatic dose adjustments before prescription."
            isActive={false}
          />
        </div>
      </main>
    </div>
  );
}
