import Link from "next/link";
import { ArrowLeft, Calculator } from "lucide-react";
import BonusCalculationSettingsClient from "@/app/settings/salary/BonusCalculationSettingsClient";

export default function BonusCalculationSettingsPage() {
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
            Bonus calculation
          </h1>
          <p className="mt-0.5 max-w-2xl text-xs text-slate-500 sm:text-sm">
            Set the defaults used to calculate estimates from your work logs.
          </p>
        </div>

        <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-2.5 sm:px-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Calculator size={16} className="text-slate-500" aria-hidden="true" />
              Overtime calculation defaults
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Remarks containing “normal holiday” or “special day” apply their matching rate.
              Special day takes priority if both phrases are present.
            </p>
          </div>
          <BonusCalculationSettingsClient />
        </section>
      </div>
    </main>
  );
}
