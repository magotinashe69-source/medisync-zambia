"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import Button, { buttonClasses } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Header from "@/components/ui/Header";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { apiPost } from "@/lib/api";
import { clearToken, isLoggedIn } from "@/lib/auth";

type CreatedPatient = {
  id: string;
};

const AUTH_ERROR_MESSAGES = new Set([
  "Not authenticated",
  "Could not validate credentials",
]);

type FormState = {
  // Personal
  full_name: string;
  nrc: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  occupation: string;
  preferred_language: string;
  allergies: string;
  // Next of kin
  next_of_kin_name: string;
  next_of_kin_relationship: string;
  next_of_kin_phone: string;
  // Insurance
  has_insurance: boolean;
  insurance_provider: string;
  insurance_member_number: string;
  insurance_plan_type: string;
  // Clinical background
  blood_group: string;
  known_allergies: string;
  chronic_conditions: string;
  current_medications: string;
  family_history: string;
  social_history: string;
  immunization_record: string;
  // Emergency
  emergency_critical_allergies: string;
  emergency_contact_primary: string;
  emergency_contact_secondary: string;
};

const INITIAL: FormState = {
  full_name: "",
  nrc: "",
  phone: "",
  date_of_birth: "",
  gender: "",
  marital_status: "",
  occupation: "",
  preferred_language: "en",
  allergies: "",
  next_of_kin_name: "",
  next_of_kin_relationship: "",
  next_of_kin_phone: "",
  has_insurance: false,
  insurance_provider: "",
  insurance_member_number: "",
  insurance_plan_type: "",
  blood_group: "",
  known_allergies: "",
  chronic_conditions: "",
  current_medications: "",
  family_history: "",
  social_history: "",
  immunization_record: "",
  emergency_critical_allergies: "",
  emergency_contact_primary: "",
  emergency_contact_secondary: "",
};

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="font-heading text-base font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

export default function NewPatientPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
    }
  }, [router]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Trim a text field and convert empty to null for nullable columns.
  function orNull(v: string): string | null {
    return v.trim() === "" ? null : v.trim();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const patient = await apiPost<CreatedPatient>("/patients", {
        nrc: form.nrc,
        full_name: form.full_name,
        phone: form.phone,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        allergies: orNull(form.allergies),
        // Personal
        next_of_kin_name: orNull(form.next_of_kin_name),
        next_of_kin_relationship: orNull(form.next_of_kin_relationship),
        next_of_kin_phone: orNull(form.next_of_kin_phone),
        marital_status: orNull(form.marital_status),
        occupation: orNull(form.occupation),
        preferred_language: form.preferred_language || "en",
        // Insurance — only send details when insured
        has_insurance: form.has_insurance,
        insurance_provider: form.has_insurance ? orNull(form.insurance_provider) : null,
        insurance_member_number: form.has_insurance
          ? orNull(form.insurance_member_number)
          : null,
        insurance_plan_type: form.has_insurance ? orNull(form.insurance_plan_type) : null,
        // Clinical background
        blood_group: orNull(form.blood_group),
        known_allergies: orNull(form.known_allergies),
        chronic_conditions: orNull(form.chronic_conditions),
        current_medications: orNull(form.current_medications),
        family_history: orNull(form.family_history),
        social_history: orNull(form.social_history),
        immunization_record: orNull(form.immunization_record),
        // Emergency
        emergency_critical_allergies: orNull(form.emergency_critical_allergies),
        emergency_contact_primary: orNull(form.emergency_contact_primary),
        emergency_contact_secondary: orNull(form.emergency_contact_secondary),
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

        <div className="mb-6">
          <h1 className="font-heading text-xl font-bold text-slate-900 sm:text-2xl">
            Register new patient
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter the patient&apos;s details to create their record.
          </p>
        </div>

        {error && (
          <div className="mb-4 whitespace-pre-line rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <SectionHeader title="Personal Information" />
            <div className="mt-4 space-y-5">
              <Input
                label="Full name"
                id="fullName"
                type="text"
                required
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
              />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  label="NRC"
                  id="nrc"
                  type="text"
                  required
                  hint="Format: 123456/78/1"
                  value={form.nrc}
                  onChange={(e) => set("nrc", e.target.value)}
                />
                <Input
                  label="Phone"
                  id="phone"
                  type="text"
                  required
                  hint="Format: +260977123456 or 0977123456"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  label="Date of birth"
                  id="dateOfBirth"
                  type="date"
                  required
                  value={form.date_of_birth}
                  onChange={(e) => set("date_of_birth", e.target.value)}
                />
                <Select
                  label="Gender"
                  id="gender"
                  required
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                >
                  <option value="" disabled>
                    Select gender
                  </option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Select
                  label="Marital status"
                  id="maritalStatus"
                  value={form.marital_status}
                  onChange={(e) => set("marital_status", e.target.value)}
                >
                  <option value="">Not specified</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </Select>
                <Input
                  label="Occupation"
                  id="occupation"
                  type="text"
                  value={form.occupation}
                  onChange={(e) => set("occupation", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Select
                  label="Preferred language"
                  id="preferredLanguage"
                  value={form.preferred_language}
                  onChange={(e) => set("preferred_language", e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="ny">Nyanja</option>
                  <option value="bem">Bemba</option>
                  <option value="toi">Tonga</option>
                  <option value="loz">Lozi</option>
                  <option value="other">Other</option>
                </Select>
              </div>
            </div>
          </Card>

          {/* Next of Kin */}
          <Card>
            <SectionHeader title="Next of Kin" />
            <div className="mt-4 space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  label="Full name"
                  id="nokName"
                  type="text"
                  value={form.next_of_kin_name}
                  onChange={(e) => set("next_of_kin_name", e.target.value)}
                />
                <Input
                  label="Relationship"
                  id="nokRelationship"
                  type="text"
                  placeholder="e.g. spouse, parent"
                  value={form.next_of_kin_relationship}
                  onChange={(e) => set("next_of_kin_relationship", e.target.value)}
                />
              </div>
              <Input
                label="Phone"
                id="nokPhone"
                type="text"
                hint="Format: +260977123456 or 0977123456"
                value={form.next_of_kin_phone}
                onChange={(e) => set("next_of_kin_phone", e.target.value)}
              />
            </div>
          </Card>

          {/* Medical Aid / Insurance */}
          <Card>
            <SectionHeader title="Medical Aid / Insurance" />
            <div className="mt-4 space-y-5">
              <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.has_insurance}
                  onChange={(e) => set("has_insurance", e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Patient has medical aid / insurance
                </span>
              </label>

              {form.has_insurance && (
                <div className="space-y-5 border-t border-slate-100 pt-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Input
                      label="Provider"
                      id="insProvider"
                      type="text"
                      placeholder="e.g. NHIMA, Madison"
                      value={form.insurance_provider}
                      onChange={(e) => set("insurance_provider", e.target.value)}
                    />
                    <Input
                      label="Member number"
                      id="insMember"
                      type="text"
                      value={form.insurance_member_number}
                      onChange={(e) => set("insurance_member_number", e.target.value)}
                    />
                  </div>
                  <Input
                    label="Plan type"
                    id="insPlan"
                    type="text"
                    placeholder="e.g. standard, executive"
                    value={form.insurance_plan_type}
                    onChange={(e) => set("insurance_plan_type", e.target.value)}
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Clinical Background */}
          <Card>
            <SectionHeader
              title="Clinical Background"
              subtitle="Optional — clinical history known at registration."
            />
            <div className="mt-4 space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Select
                  label="Blood group"
                  id="bloodGroup"
                  value={form.blood_group}
                  onChange={(e) => set("blood_group", e.target.value)}
                >
                  <option value="">Unknown</option>
                  <option value="A+">A+</option>
                  <option value="A-">A−</option>
                  <option value="B+">B+</option>
                  <option value="B-">B−</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB−</option>
                  <option value="O+">O+</option>
                  <option value="O-">O−</option>
                </Select>
              </div>
              <Textarea
                label="Known allergies"
                value={form.known_allergies}
                onChange={(e) => set("known_allergies", e.target.value)}
                hint="Drug, food or environmental allergies"
              />
              <Textarea
                label="Chronic conditions"
                value={form.chronic_conditions}
                onChange={(e) => set("chronic_conditions", e.target.value)}
                hint="e.g. hypertension, diabetes, asthma"
              />
              <Textarea
                label="Current medications"
                value={form.current_medications}
                onChange={(e) => set("current_medications", e.target.value)}
              />
              <Textarea
                label="Family history"
                value={form.family_history}
                onChange={(e) => set("family_history", e.target.value)}
              />
              <Textarea
                label="Social history"
                value={form.social_history}
                onChange={(e) => set("social_history", e.target.value)}
                hint="e.g. smoking, alcohol, occupation-related"
              />
              <Textarea
                label="Immunization record"
                value={form.immunization_record}
                onChange={(e) => set("immunization_record", e.target.value)}
              />
            </div>
          </Card>

          {/* Emergency Information */}
          <Card>
            <SectionHeader
              title="Emergency Information"
              subtitle="Shown prominently on the patient's profile."
            />
            <div className="mt-4 space-y-5">
              <Textarea
                label="Critical allergies"
                value={form.emergency_critical_allergies}
                onChange={(e) => set("emergency_critical_allergies", e.target.value)}
                hint="Life-threatening allergies (e.g. penicillin anaphylaxis)"
              />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  label="Primary emergency contact"
                  id="emgPrimary"
                  type="text"
                  placeholder="Name and phone"
                  value={form.emergency_contact_primary}
                  onChange={(e) => set("emergency_contact_primary", e.target.value)}
                />
                <Input
                  label="Secondary emergency contact"
                  id="emgSecondary"
                  type="text"
                  placeholder="Name and phone"
                  value={form.emergency_contact_secondary}
                  onChange={(e) => set("emergency_contact_secondary", e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Actions */}
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
      </main>
    </div>
  );
}
