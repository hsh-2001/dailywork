import Link from "next/link";
import { ArrowLeft, UserRound } from "lucide-react";
import ProfileSettings from "@/components/ProfileSettings";
import { getCurrentAuthUser } from "@/lib/auth/current-user";

export default async function ProfilePage() {
  const user = await getCurrentAuthUser();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/settings" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-700">
          <ArrowLeft size={14} aria-hidden="true" /> Settings
        </Link>
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700">Your account</p>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">Profile</h1>
          <p className="mt-0.5 max-w-2xl text-xs text-slate-500 sm:text-sm">Manage your profile details and password.</p>
        </div>

        {user ? (
          <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-2.5 sm:px-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <UserRound size={16} className="text-slate-500" aria-hidden="true" />
                Account details
              </div>
            </div>
            <ProfileSettings name={user.name ?? ""} email={user.email} />
          </section>
        ) : (
          <p className="mt-4 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            Please sign in to manage your profile.
          </p>
        )}
      </div>
    </main>
  );
}
