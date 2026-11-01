"use client";

import { useQuery } from "@tanstack/react-query";

export type AuthSessionUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

export const authSessionQueryKey = ["auth", "session"] as const;

async function getAuthSession() {
  const response = await fetch("/api/auth/session");
  if (!response.ok) throw new Error("Unable to load your session.");
  const result = await response.json() as { data: AuthSessionUser | null };
  return result.data;
}

export function useAuthSession() {
  return useQuery({
    queryKey: authSessionQueryKey,
    queryFn: getAuthSession,
  });
}
