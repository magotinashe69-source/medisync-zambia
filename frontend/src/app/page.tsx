"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import Spinner from "@/components/ui/Spinner";
import { isLoggedIn } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(isLoggedIn() ? "/dashboard" : "/login");
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-primary-50 to-slate-50 px-4">
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-lg font-bold text-white shadow-sm">
          M
        </span>
        <span className="font-heading text-xl font-bold text-slate-900">
          MediSync <span className="text-primary-600">Africa</span>
        </span>
      </div>
      <Spinner className="text-primary-600" />
      <p className="text-sm text-slate-500">Loading…</p>
    </div>
  );
}
