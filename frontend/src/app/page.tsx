"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { isLoggedIn } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(isLoggedIn() ? "/dashboard" : "/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-600 text-sm">Loading MediSync Zambia...</p>
    </div>
  );
}
