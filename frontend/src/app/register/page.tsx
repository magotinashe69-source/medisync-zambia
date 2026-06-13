"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { apiPost } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("doctor");
  const [hpczNumber, setHpczNumber] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiPost("/auth/register", {
        full_name: fullName,
        email,
        password,
        role,
        hpcz_number: hpczNumber.trim() || null,
        facility_name: facilityName,
      });
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary-50 to-slate-50 px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-2xl font-bold text-white shadow-sm">
            M
          </div>
          <h1 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
            MediSync <span className="text-primary-600">Africa</span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Create your account to get started
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Create account</h2>
          <p className="mt-1 text-sm text-slate-500">
            Tell us a little about you and your facility
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Full name"
              id="fullName"
              type="text"
              required
              autoComplete="name"
              hint="Your name as it should appear on records"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <Input
              label="Email"
              id="email"
              type="email"
              required
              autoComplete="email"
              hint="You'll use this to sign in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              hint="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Role"
                id="role"
                required
                hint="Your role at the facility"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="admin">Admin</option>
              </Select>

              <Input
                label="HPCZ number"
                id="hpczNumber"
                type="text"
                hint="Optional — leave blank if not registered"
                value={hpczNumber}
                onChange={(e) => setHpczNumber(e.target.value)}
              />
            </div>

            <Input
              label="Facility name"
              id="facilityName"
              type="text"
              required
              hint="The clinic or hospital where you work"
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
            />

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth loading={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary-600 hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
