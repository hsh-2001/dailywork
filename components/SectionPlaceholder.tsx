import Link from "next/link";
import { ArrowRight, Construction } from "lucide-react";

interface SectionPlaceholderProps {
  title: string;
  description: string;
}

export default function SectionPlaceholder({ title, description }: SectionPlaceholderProps) {
  return (
    <main className="min-h-[calc(100vh-4.75rem)] bg-slate-50 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold text-blue-700">Daily Work</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 max-w-2xl text-slate-600">{description}</p>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <Construction size={23} aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-slate-900">This section is getting ready</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            This destination is part of the Daily Work workspace. You can continue managing your work logs while this section is being built.
          </p>
          <Link
            href="/ot-record"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Go to work logs <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </main>
  );
}
