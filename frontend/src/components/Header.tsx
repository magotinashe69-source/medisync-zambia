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
    <header className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4">
      <div className="font-bold text-lg">MediSync Zambia</div>
      <button
        type="button"
        onClick={handleLogout}
        className="text-red-600 hover:text-red-700 font-medium"
      >
        Logout
      </button>
    </header>
  );
}
