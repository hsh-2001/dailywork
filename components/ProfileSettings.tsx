"use client";

import { Button, Input } from "antd";
import { useState } from "react";

export default function ProfileSettings({ name, email }: { name: string; email: string }) {
  const [displayName, setDisplayName] = useState(name);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "Unable to update profile.");
      setMessage("Name updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="px-4 py-4 sm:px-5">
    <form onSubmit={submit} className="max-w-md space-y-3">
      <div><h2 className="text-sm font-semibold text-slate-900">Profile details</h2><p className="text-xs text-slate-500">Sign-in links are sent to your email.</p></div>
      <label className="block text-xs font-medium text-slate-700" htmlFor="profile-email">Email</label>
      <Input id="profile-email" value={email} disabled />
      <label className="block text-xs font-medium text-slate-700" htmlFor="profile-name">Name</label>
      <Input id="profile-name" value={displayName} maxLength={255} onChange={(event) => setDisplayName(event.target.value)} required />
      <Button htmlType="submit" type="primary" loading={saving} className="!mt-2">Save name</Button>
    </form>
    {(message || error) && <p role={error ? "alert" : "status"} className={`mt-4 text-sm ${error ? "text-red-600" : "text-slate-600"}`}>{error || message}</p>}
  </div>;
}
