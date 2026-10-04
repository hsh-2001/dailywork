"use client";

import { Button, Input } from "antd";
import { useState } from "react";

export default function ProfileSettings({ name, email }: { name: string; email: string }) {
  const [displayName, setDisplayName] = useState(name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveProfile(payload: { name?: string; currentPassword?: string; newPassword?: string }) {
    const response = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json() as { message?: string };
    if (!response.ok) throw new Error(result.message || "Unable to update profile.");
  }

  async function submitName(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage(""); setSavingName(true);
    try { await saveProfile({ name: displayName }); setMessage("Name updated."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update name."); }
    finally { setSavingName(false); }
  }

  async function submitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage("");
    if (newPassword !== confirmPassword) { setError("New passwords do not match."); return; }
    setSavingPassword(true);
    try {
      await saveProfile({ currentPassword, newPassword });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setMessage("Password updated.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update password."); }
    finally { setSavingPassword(false); }
  }

  return <div className="grid gap-6 px-4 py-4 sm:grid-cols-2 sm:px-5">
    <form onSubmit={submitName} className="space-y-3">
      <div><h2 className="text-sm font-semibold text-slate-900">Profile details</h2><p className="text-xs text-slate-500">Update the name shown in your workspace.</p></div>
      <label className="block text-xs font-medium text-slate-700" htmlFor="profile-email">Email</label>
      <Input id="profile-email" value={email} disabled />
      <label className="block text-xs font-medium text-slate-700" htmlFor="profile-name">Name</label>
      <Input id="profile-name" value={displayName} maxLength={255} onChange={(event) => setDisplayName(event.target.value)} required />
      <Button htmlType="submit" type="primary" loading={savingName} className="!mt-2">Save name</Button>
    </form>
    <form onSubmit={submitPassword} className="space-y-3">
      <div><h2 className="text-sm font-semibold text-slate-900">Change password</h2><p className="text-xs text-slate-500">Use at least 8 characters for your new password.</p></div>
      <Input.Password aria-label="Current password" placeholder="Current password (if set)" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
      <Input.Password aria-label="New password" placeholder="New password" autoComplete="new-password" minLength={8} maxLength={1024} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
      <Input.Password aria-label="Confirm new password" placeholder="Confirm new password" autoComplete="new-password" minLength={8} maxLength={1024} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
      <Button htmlType="submit" loading={savingPassword}>Update password</Button>
    </form>
    {(message || error) && <p role={error ? "alert" : "status"} className={`text-sm sm:col-span-2 ${error ? "text-red-600" : "text-emerald-700"}`}>{error || message}</p>}
  </div>;
}
