"use client";

import { authClient } from "@/lib/auth/client";
import { Button } from "antd";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthControls() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!session) return null;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      router.replace("/auth/sign-in");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="hidden max-w-40 truncate text-xs text-slate-500 sm:block">
        {session.user.name || session.user.email}
      </span>
      <Button
        type="text"
        size="small"
        icon={<LogOut size={16} />}
        onClick={handleSignOut}
        loading={isSigningOut}
        aria-label="Sign out"
        title="Sign out"
        className="text-slate-500! hover:text-slate-900!"
      />
    </div>
  );
}
