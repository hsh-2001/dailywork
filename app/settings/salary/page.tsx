import Link from "next/link";
import { ArrowLeft, CircleDollarSign } from "lucide-react";
import SalarySettingsClient from "@/app/settings/salary/SalarySettingsClient";

export default function SalarySettingsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={14} aria-hidden="true" /> Settings
        </Link>
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Your workspace
          </p>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            Salary &amp; tax
          </h1>
          <p className="mt-0.5 max-w-2xl text-xs text-slate-500 sm:text-sm">
            Set your USD salary and overtime tax rate, plus the KHR exchange rate.
          </p>
        </div>

        <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-2.5 sm:px-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <CircleDollarSign size={16} className="text-slate-500" aria-hidden="true" />
              Salary &amp; tax defaults
            </div>
          </div>
          <SalarySettingsClient />
        </section>
      </div>
    </main>
  );
}
