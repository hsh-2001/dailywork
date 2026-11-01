"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return <main className="p-6 text-sm text-slate-500">Redirecting to your dashboard…</main>;
}
