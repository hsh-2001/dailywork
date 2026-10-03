import Link from "next/link";
import { ArrowRight, ChartNoAxesCombined } from "lucide-react";

interface SectionPlaceholderProps {
  title: string;
  description: string;
}

export default function SectionPlaceholder({ title, description }: SectionPlaceholderProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700">Your workspace</p>
        <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
          {title}
        </h1>
        <p className="mt-0.5 max-w-2xl text-xs text-slate-500 sm:text-sm">{description}</p>

        <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid gap-5 p-4 sm:grid-cols-[minmax(0,1fr)_13rem] sm:items-center sm:p-5">
            <div>
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <ChartNoAxesCombined size={18} aria-hidden="true" />
              </span>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700">
                In progress
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                {title} are on the way
              </h2>
              <p className="mt-1.5 max-w-xl text-xs leading-5 text-slate-600 sm:text-sm">
                {description} This section is still being developed. Your work
                logs are ready to manage in the meantime.
              </p>
              <Link
                href="/ot-record"
                className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg bg-blue-700 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:text-sm"
              >
                Go to work logs <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
            <div className="hidden rounded-xl bg-slate-50 p-4 sm:block">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="size-2 rounded-full bg-blue-600" />
                Daily Work
              </div>
              <div className="mt-3 space-y-2" aria-hidden="true">
                <div className="h-2 w-3/4 rounded-full bg-slate-200" />
                <div className="h-2 w-full rounded-full bg-slate-200" />
                <div className="h-2 w-2/3 rounded-full bg-blue-100" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
