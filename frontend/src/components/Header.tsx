"use client";

import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";

export default function Header() {
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
      <div className="font-bold text-base sm:text-lg">MediSync Zambia</div>
      <button
        type="button"
        onClick={handleLogout}
        className="inline-flex items-center min-h-[44px] px-2 -mr-2 text-red-600 hover:text-red-700 font-medium"
      >
        Logout
      </button>
    </header>
  );
}
