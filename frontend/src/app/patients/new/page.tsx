"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import Header from "@/components/Header";
import { apiPost } from "@/lib/api";
import { clearToken, isLoggedIn } from "@/lib/auth";

type CreatedPatient = {
  id: string;
};

const AUTH_ERROR_MESSAGES = new Set([
  "Not authenticated",
  "Could not validate credentials",
]);

export default function NewPatientPage() {
  const router = useRouter();
  const [nrc, setNrc] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [allergies, setAllergies] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
    }
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const patient = await apiPost<CreatedPatient>("/patients", {
        nrc,
        full_name: fullName,
        phone,
        date_of_birth: dateOfBirth,
        gender,
        allergies: allergies.trim() || null,
      });
      router.push(`/patients/${patient.id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to register patient";
      if (AUTH_ERROR_MESSAGES.has(message)) {
        clearToken();
        router.replace("/login");
        return;
      }
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold mb-6">Register New Patient</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="nrc"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                NRC
              </label>
              <input
                id="nrc"
                type="text"
                required
                value={nrc}
                onChange={(e) => setNrc(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Format: 123456/78/1</p>
            </div>

            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone
              </label>
              <input
                id="phone"
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: +260977123456 or 0977123456
              </p>
            </div>

            <div>
              <label
                htmlFor="dateOfBirth"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Gender
              </label>
              <select
                id="gender"
                required
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>
                  Select gender
                </option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="allergies"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Allergies
              </label>
              <textarea
                id="allergies"
                rows={3}
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                List any known drug or food allergies
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link
                href="/dashboard"
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-medium hover:bg-gray-300"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {loading ? "Registering..." : "Register Patient"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
