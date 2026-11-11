"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  updateProfile,
} from "firebase/auth";
import { authSessionQueryKey } from "@/hooks/auth-session.hook";
import { getFirebaseAuth } from "@/lib/auth/firebase";

const EMAIL_STORAGE_KEY = "daily-work-email-link-address";
const NAME_STORAGE_KEY = "daily-work-email-link-name";

export default function AuthPage({ isSignUp }: { isSignUp: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [isCompletingLink, setIsCompletingLink] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const auth = getFirebaseAuth();
      if (!isSignInWithEmailLink(auth, window.location.href)) return;
      setIsCompletingLink(true);
      setEmail(window.localStorage.getItem(EMAIL_STORAGE_KEY) || "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to initialize Firebase Authentication.");
    }
  }, []);

  function getReturnPath() {
    const requestedPath = new URLSearchParams(window.location.search).get("next");
    if (requestedPath?.startsWith("/") && !requestedPath.startsWith("//")) {
      const nextUrl = new URL(requestedPath, window.location.origin);
      if (nextUrl.origin === window.location.origin && !nextUrl.pathname.startsWith("/auth/")) {
        return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
      }
    }
    return "/dashboard";
  }

  async function establishAppSession(idToken: string) {
    const response = await fetch("/api/auth/firebase-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    const responseText = await response.text();
    let result: { message?: string } | null = null;
    try {
      result = JSON.parse(responseText) as { message?: string };
    } catch {
      // A platform error page may be returned as HTML rather than JSON.
    }
    if (!response.ok) throw new Error(result?.message || `Unable to start your session (${response.status}).`);
    await queryClient.invalidateQueries({ queryKey: authSessionQueryKey });
    router.replace(getReturnPath());
    router.refresh();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    const enteredEmail = String(form.get("email") || "").trim().toLowerCase();

    try {
      const auth = getFirebaseAuth();
      if (isCompletingLink) {
        if (!isSignInWithEmailLink(auth, window.location.href)) {
          throw new Error("This sign-in link is invalid or has expired. Request a new link.");
        }
        const credential = await signInWithEmailLink(auth, enteredEmail, window.location.href);
        const savedName = window.localStorage.getItem(NAME_STORAGE_KEY)?.trim();
        if (savedName && !credential.user.displayName) {
          await updateProfile(credential.user, { displayName: savedName });
        }
        window.localStorage.removeItem(EMAIL_STORAGE_KEY);
        window.localStorage.removeItem(NAME_STORAGE_KEY);
        await establishAppSession(await credential.user.getIdToken(true));
        return;
      }

      const name = String(form.get("name") || "").trim();
      if (isSignUp && (!name || name.length > 255)) throw new Error("Enter a name of 1 to 255 characters.");
      if (!enteredEmail) throw new Error("Enter a valid email address.");

      const continueUrl = new URL("/auth/sign-in", window.location.origin);
      const next = new URLSearchParams(window.location.search).get("next");
      if (next?.startsWith("/") && !next.startsWith("//")) continueUrl.searchParams.set("next", next);
      window.localStorage.setItem(EMAIL_STORAGE_KEY, enteredEmail);
      if (isSignUp) window.localStorage.setItem(NAME_STORAGE_KEY, name);
      else window.localStorage.removeItem(NAME_STORAGE_KEY);

      await sendSignInLinkToEmail(auth, enteredEmail, {
        url: continueUrl.toString(),
        handleCodeInApp: true,
      });
      setEmail(enteredEmail);
      setNotice(`We sent a sign-in link to ${enteredEmail}. Open it to ${isSignUp ? "verify your email and finish creating your account" : "sign in"}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send or complete the sign-in link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-[100svh] items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <Link href="/" className="text-sm font-semibold text-slate-800">Daily Work</Link>
        <h1 className="mt-7 text-2xl font-bold tracking-tight text-slate-900">
          {isCompletingLink ? "Complete sign-in" : isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {isCompletingLink ? "Enter the same email address that received this link." : "We’ll email you a one-time sign-in link. No password needed."}
        </p>
        <form className="mt-7 space-y-4" onSubmit={submit}>
          {!isCompletingLink && isSignUp && <label className="block text-sm font-medium text-slate-700">Name<input name="name" required autoComplete="name" maxLength={255} className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>}
          <label className="block text-sm font-medium text-slate-700">Email<input name="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60">
            {busy ? "Please wait…" : isCompletingLink ? "Complete sign-in" : isSignUp ? "Email me a sign-up link" : "Email me a sign-in link"}
          </button>
        </form>
        {!isCompletingLink && <p className="mt-6 text-center text-sm text-slate-500">{isSignUp ? "Already have an account? " : "New to Daily Work? "}<Link className="font-semibold text-slate-700 hover:text-slate-950" href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"}>{isSignUp ? "Sign in" : "Create an account"}</Link></p>}
      </section>
    </main>
  );
}
