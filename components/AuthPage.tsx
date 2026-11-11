"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/auth/firebase";
import { authSessionQueryKey } from "@/hooks/auth-session.hook";

export default function AuthPage({ isSignUp }: { isSignUp: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signInWithGoogle() {
    setBusy(true);
    setError("");
    try {
      const credential = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
      const idToken = await credential.user.getIdToken();
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "Google sign-in failed.");
      await queryClient.invalidateQueries({ queryKey: authSessionQueryKey });
      const requestedPath = new URLSearchParams(window.location.search).get("next");
      let returnPath = "/dashboard";
      if (requestedPath?.startsWith("/") && !requestedPath.startsWith("//")) {
        const nextUrl = new URL(requestedPath, window.location.origin);
        if (nextUrl.origin === window.location.origin && !nextUrl.pathname.startsWith("/auth/")) returnPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
      }
      router.replace(returnPath);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Google sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

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
      await queryClient.invalidateQueries({ queryKey: authSessionQueryKey });
      const requestedPath = new URLSearchParams(window.location.search).get("next");
      let returnPath = "/dashboard";
      if (requestedPath?.startsWith("/") && !requestedPath.startsWith("//")) {
        const nextUrl = new URL(requestedPath, window.location.origin);
        if (nextUrl.origin === window.location.origin && !nextUrl.pathname.startsWith("/auth/")) {
          returnPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
        }
      }
      router.replace(returnPath);
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
        <Link href="/" className="text-sm font-semibold text-slate-800">Daily Work</Link>
        <h1 className="mt-7 text-2xl font-bold tracking-tight text-slate-900">{isSignUp ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-2 text-sm text-slate-500">{isSignUp ? "Organize your work in one place." : "Sign in to continue to your workspace."}</p>
        <form className="mt-7 space-y-4" onSubmit={submit}>
          {isSignUp && <label className="block text-sm font-medium text-slate-700">Name<input name="name" required autoComplete="name" className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>}
          <label className="block text-sm font-medium text-slate-700">Email<input name="email" type="email" required autoComplete="email" className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
          <label className="block text-sm font-medium text-slate-700">Password<input name="password" type="password" required minLength={8} autoComplete={isSignUp ? "new-password" : "current-password"} className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
          {isSignUp && <label className="block text-sm font-medium text-slate-700">Confirm password<input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60">{busy ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}</button>
        </form>
        <div className="mt-5 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />or<span className="h-px flex-1 bg-slate-200" /></div>
        <button type="button" disabled={busy} onClick={signInWithGoogle} className="mt-5 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Continue with Google</button>
        <p className="mt-6 text-center text-sm text-slate-500">{isSignUp ? "Already have an account? " : "New to Daily Work? "}<Link className="font-semibold text-slate-700 hover:text-slate-950" href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"}>{isSignUp ? "Sign in" : "Create an account"}</Link></p>
      </section>
    </main>
  );
}
