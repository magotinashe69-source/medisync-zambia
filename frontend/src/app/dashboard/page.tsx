"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Header from "@/components/Header";
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

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {me && (
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Welcome, Dr. {me.full_name}</h1>
            <p className="text-gray-600 text-sm mt-1">{me.facility_name}</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-6 gap-4">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or NRC..."
            className="flex-1 max-w-md border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Link
            href="/patients/new"
            className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 whitespace-nowrap"
          >
            + Register New Patient
          </Link>
        </div>

        {loadError && <p className="text-red-600 text-sm mb-4">{loadError}</p>}

        {patients === null ? (
          <p className="text-gray-500 text-sm py-8 text-center">Loading...</p>
        ) : patients.length === 0 ? (
          <p className="text-gray-500 text-sm py-12 text-center">
            {debouncedSearch.trim()
              ? "No patients match your search."
              : "No patients yet. Click 'Register New Patient' to add one."}
          </p>
        ) : (
          <div className="border border-gray-200 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-700">
                <tr>
                  <th className="px-4 py-3 font-medium">NRC</th>
                  <th className="px-4 py-3 font-medium">Full Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Date Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/patients/${p.id}`)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">{p.nrc}</td>
                    <td className="px-4 py-3">{p.full_name}</td>
                    <td className="px-4 py-3">{p.phone}</td>
                    <td className="px-4 py-3">{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
