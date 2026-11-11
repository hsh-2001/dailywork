"use client";

import { Button } from "antd";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { authSessionQueryKey, useAuthSession } from "@/hooks/auth-session.hook";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/auth/firebase";

export default function AuthControls() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useAuthSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  if (!user) return null;
  const handleSignOut = async () => {
    setIsSigningOut(true);
    setSignOutError("");
    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST" });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(result?.message || "Unable to sign out. Please try again.");
      }
      await signOut(getFirebaseAuth()).catch(() => undefined);
      queryClient.setQueryData(authSessionQueryKey, null);
      router.replace("/auth/sign-in");
      router.refresh();
    } catch (cause) {
      setSignOutError(cause instanceof Error ? cause.message : "Unable to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return <div className="flex shrink-0 items-center gap-2">
    {signOutError && <span role="alert" className="text-xs text-red-600">{signOutError}</span>}
    <span className="hidden max-w-40 truncate text-xs text-slate-500 sm:block">{user.name || user.email}</span>
    <Button type="text" size="small" icon={<LogOut size={16} />} onClick={handleSignOut} loading={isSigningOut} aria-label="Sign out" title="Sign out" className="text-slate-500! hover:text-slate-900!" />
  </div>;
}
