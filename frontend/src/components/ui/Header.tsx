"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { clearToken } from "@/lib/auth";

type HeaderProps = { userName?: string; facilityName?: string };

export default function Header({ userName, facilityName }: HeaderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
            M
          </span>
          <span className="font-heading text-base font-bold text-slate-900 sm:text-lg">
            MediSync <span className="text-primary-600">Zambia</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-4 sm:flex">
          {userName && (
            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-slate-900">{userName}</p>
              {facilityName && <p className="text-xs text-slate-500">{facilityName}</p>}
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Logout
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 sm:hidden"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 sm:hidden">
          {userName && (
            <div className="mb-2">
              <p className="text-sm font-medium text-slate-900">{userName}</p>
              {facilityName && <p className="text-xs text-slate-500">{facilityName}</p>}
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex min-h-[44px] w-full items-center rounded-lg px-3 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
