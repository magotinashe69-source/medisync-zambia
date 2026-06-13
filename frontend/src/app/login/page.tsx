"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { apiPost } from "@/lib/api";
import { saveToken } from "@/lib/auth";

type LoginResponse = {
  access_token: string;
  token_type: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { access_token } = await apiPost<LoginResponse>("/auth/login", {
        email,
        password,
      });
      saveToken(access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail("demo@onpoint.zm");
    setPassword("Demo2026");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary-50 to-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-2xl font-bold text-white shadow-sm">
            M
          </div>
          <h1 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
            MediSync <span className="text-primary-600">Africa</span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Healthcare infrastructure for Africa
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Welcome back — sign in to continue</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Email"
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div>
              <Input
                label="Password"
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={fillDemo}
                className="mt-1 inline-flex min-h-[44px] items-center text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
              >
                Try demo account
              </button>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth loading={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary-600 hover:underline">
              Register here
            </Link>
          </p>
        </Card>

        {/* Reassurance */}
        <p className="mt-5 text-center text-xs text-slate-400">
          🔒 Sample data only — no real patient information
        </p>
      </div>
    </div>
  );
}
