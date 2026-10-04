"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function AuthPage() {
  const { path } = useParams<{ path: string }>();
  const isSignUp = path === "sign-up";
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const password = form.get("password");
    const confirmPassword = form.get("confirmPassword");
    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match.");
      setBusy(false);
      return;
    }
    try {
      const response = await fetch(isSignUp ? "/api/auth/signup" : "/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password, confirmPassword }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "Authentication failed.");
      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-[100svh] items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <Link href="/" className="text-sm font-semibold text-blue-700">Daily Work</Link>
        <h1 className="mt-7 text-2xl font-bold tracking-tight text-slate-900">{isSignUp ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-2 text-sm text-slate-500">{isSignUp ? "Organize your work in one place." : "Sign in to continue to your workspace."}</p>
        <form className="mt-7 space-y-4" onSubmit={submit}>
          {isSignUp && <label className="block text-sm font-medium text-slate-700">Name<input name="name" required autoComplete="name" className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>}
          <label className="block text-sm font-medium text-slate-700">Email<input name="email" type="email" required autoComplete="email" className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
          <label className="block text-sm font-medium text-slate-700">Password<input name="password" type="password" required minLength={8} autoComplete={isSignUp ? "new-password" : "current-password"} className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
          {isSignUp && <label className="block text-sm font-medium text-slate-700">Confirm password<input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{busy ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">{isSignUp ? "Already have an account? " : "New to Daily Work? "}<Link className="font-semibold text-blue-700 hover:text-blue-800" href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"}>{isSignUp ? "Sign in" : "Create an account"}</Link></p>
      </section>
    </main>
  );
}
