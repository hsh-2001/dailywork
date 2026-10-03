import Link from "next/link";
import { ArrowRight, FolderKanban } from "lucide-react";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold text-blue-700">Daily Work</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Manage your Daily Work preferences and account options.
        </p>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Workspace</h2>
          <Link
            href="/projects"
            className="mt-5 flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/50"
          >
            <span className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <FolderKanban size={20} aria-hidden="true" />
              </span>
              <span>
                <span className="block font-semibold text-slate-900">Projects</span>
                <span className="mt-0.5 block text-sm text-slate-500">
                  Create and update the projects available in work logs.
                </span>
              </span>
            </span>
            <ArrowRight size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </main>
  );
}
