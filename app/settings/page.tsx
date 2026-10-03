import Link from "next/link";
import { ArrowRight, FolderKanban, Settings2 } from "lucide-react";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700">Your workspace</p>
        <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
          Settings
        </h1>
        <p className="mt-0.5 max-w-2xl text-xs text-slate-500 sm:text-sm">
          Manage your Daily Work preferences and account options.
        </p>

        <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-2.5 sm:px-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Settings2 size={16} className="text-slate-500" aria-hidden="true" />
              Workspace
            </div>
          </div>
          <Link
            href="/projects"
            className="group flex min-h-14 items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-blue-600 sm:px-5"
          >
            <span className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <FolderKanban size={18} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-medium text-slate-800">Projects</span>
                <span className="mt-0.5 block text-xs text-slate-500 sm:text-sm">
                  Create and update the projects available in work logs.
                </span>
              </span>
            </span>
            <ArrowRight size={18} className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-700" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </main>
  );
}
