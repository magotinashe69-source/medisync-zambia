"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonClasses } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Header from "@/components/ui/Header";
import Spinner from "@/components/ui/Spinner";
import { apiGet } from "@/lib/api";
import { clearToken, isLoggedIn } from "@/lib/auth";

type Me = {
  full_name: string;
  facility_name: string;
};

type Patient = {
  id: string;
  nrc: string;
  full_name: string;
  phone: string;
  created_at: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB");
}

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [patients, setPatients] = useState<Patient[] | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

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

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    const trimmed = debouncedSearch.trim();
    const path = trimmed
      ? `/patients?search=${encodeURIComponent(trimmed)}`
      : "/patients";
    apiGet<Patient[]>(path)
      .then((p) => {
        if (cancelled) return;
        setPatients(p);
        setLoadError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : "Failed to load patients",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, me]);

  const searching = debouncedSearch.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header userName={me?.full_name} facilityName={me?.facility_name} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Welcome + actions */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold text-slate-900 sm:text-2xl">
              Welcome back{me ? `, Dr. ${me.full_name}` : ""}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {patients
                ? `${patients.length} patient${patients.length === 1 ? "" : "s"} registered`
                : "Loading your patients…"}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.45 4.39l3.33 3.33a.75.75 0 11-1.06 1.06l-3.33-3.33A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or NRC…"
                className="w-full min-h-[44px] rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <Link
              href="/patients/new"
              className={buttonClasses({ className: "w-full sm:w-auto" })}
            >
              + New Patient
            </Link>
          </div>
        </div>

        {loadError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {patients === null ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" className="text-primary-600" />
          </div>
        ) : patients.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              icon={
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5.5H6.5a2 2 0 00-2 2V19a2 2 0 002 2h11a2 2 0 002-2V7.5a2 2 0 00-2-2H16" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5h6a1 1 0 011 1V6a1 1 0 01-1 1H9a1 1 0 01-1-1v-.5a1 1 0 011-1z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v5M9.5 13.5h5" />
                </svg>
              }
              title={searching ? "No matches found" : "No patients yet"}
              message={
                searching
                  ? "Try a different name or NRC."
                  : "Register your first patient to start recording visits and prescriptions."
              }
              action={
                searching ? undefined : (
                  <Link href="/patients/new" className={buttonClasses()}>
                    Register your first patient
                  </Link>
                )
              }
            />
          </Card>
        ) : (
          <>
            {/* Mobile: card view (tap anywhere opens) */}
            <div className="space-y-3 md:hidden">
              {patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => router.push(`/patients/${p.id}`)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:bg-primary-50/60 active:bg-primary-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{p.full_name}</p>
                    <p className="mt-0.5 text-sm text-slate-500">NRC {p.nrc}</p>
                    <p className="text-sm text-slate-500">{p.phone}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-xs text-slate-400">{formatDate(p.created_at)}</span>
                    <svg className="h-5 w-5 text-slate-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.17 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>

            {/* Tablet/Desktop: table view */}
            <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">NRC</th>
                    <th className="px-5 py-3 font-medium">Full Name</th>
                    <th className="px-5 py-3 font-medium">Phone</th>
                    <th className="px-5 py-3 font-medium">Date Registered</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/patients/${p.id}`)}
                      className="cursor-pointer transition-colors hover:bg-primary-50/50"
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-900">{p.nrc}</td>
                      <td className="px-5 py-3.5 text-slate-700">{p.full_name}</td>
                      <td className="px-5 py-3.5 text-slate-700">{p.phone}</td>
                      <td className="px-5 py-3.5 text-slate-500">{formatDate(p.created_at)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <svg className="ml-auto h-5 w-5 text-slate-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.17 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
