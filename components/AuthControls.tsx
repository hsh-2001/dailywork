"use client";

import { Button } from "antd";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type User = { name: string | null; email: string };

export default function AuthControls() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/session").then(async (response) => {
      if (response.ok) {
        const result = await response.json() as { data: User | null };
        setUser(result.data);
      }
    });
  }, []);

  if (!user) return null;
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      router.replace("/auth/sign-in");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  return <div className="flex shrink-0 items-center gap-2">
    <span className="hidden max-w-40 truncate text-xs text-slate-500 sm:block">{user.name || user.email}</span>
    <Button type="text" size="small" icon={<LogOut size={16} />} onClick={handleSignOut} loading={isSigningOut} aria-label="Sign out" title="Sign out" className="text-slate-500! hover:text-slate-900!" />
  </div>;
}
