"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useId, useState } from "react";

import Button, { buttonClasses } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Header from "@/components/ui/Header";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
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
  const allergiesId = useId();
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
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.83 10l3.94 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
          Back to dashboard
        </Link>

        <Card className="p-6 sm:p-8">
          <h1 className="font-heading text-xl font-bold text-slate-900 sm:text-2xl">
            Register new patient
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter the patient&apos;s details to create their record.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <Input
              label="Full name"
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input
                label="NRC"
                id="nrc"
                type="text"
                required
                hint="Format: 123456/78/1"
                value={nrc}
                onChange={(e) => setNrc(e.target.value)}
              />
              <Input
                label="Phone"
                id="phone"
                type="text"
                required
                hint="Format: +260977123456 or 0977123456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input
                label="Date of birth"
                id="dateOfBirth"
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
              <Select
                label="Gender"
                id="gender"
                required
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="" disabled>
                  Select gender
                </option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Select>
            </div>

            <div>
              <label htmlFor={allergiesId} className="block text-sm font-medium text-slate-700 mb-1.5">
                Allergies
              </label>
              <textarea
                id={allergiesId}
                rows={3}
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                List any known drug or food allergies
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <Link
                href="/dashboard"
                className={buttonClasses({ variant: "ghost", className: "w-full sm:w-auto" })}
              >
                Cancel
              </Link>
              <Button type="submit" loading={loading} className="w-full sm:w-auto">
                {loading ? "Registering…" : "Register Patient"}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
