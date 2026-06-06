"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-center">MediSync Zambia</h1>
        <p className="text-gray-600 text-center mt-2">Create your account</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Role
            </label>
            <select
              id="role"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="hpczNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              HPCZ number
            </label>
            <input
              id="hpczNumber"
              type="text"
              value={hpczNumber}
              onChange={(e) => setHpczNumber(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional — leave blank if not registered
            </p>
          </div>

          <div>
            <label
              htmlFor="facilityName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Facility name
            </label>
            <input
              id="facilityName"
              type="text"
              required
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center min-h-[44px] bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
