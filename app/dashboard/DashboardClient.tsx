"use client";

import Link from "next/link";
import { useRecords } from "@/hooks/record.hook";
import { useSalarySettings } from "@/hooks/salary-settings.hook";
import { useBonusCalculationSettings } from "@/hooks/bonus-calculation-settings.hook";
import { APP_TZ, formatTime } from "@/utils/datetime";
import { calculateRecordBonus, formatBonusMoney } from "@/utils/bonus-estimate";
import type {
  IRecordResponse,
} from "@/shares/dtos/record/recordResponse";
import {
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  ClipboardList,
  Eye,
  EyeOff,
  FolderKanban,
  LoaderCircle,
  Plus,
} from "lucide-react";
import { Button, Skeleton } from "antd";
import { useState } from "react";

function getCurrentMonthRange() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0));
  return {
    from: firstDay.toISOString().slice(0, 10),
    to: lastDay.toISOString().slice(0, 10),
    label: new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: APP_TZ }).format(new Date()),
  };
}

const formatTotal = (minutes: number | null) => {
  if (minutes == null) return "—";
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

const shortcuts = [
  {
    title: "Projects",
    description: "Manage your project list",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    title: "Bonus",
    description: "Review time and estimate overtime bonus hours",
    href: "/reports",
    icon: ChartNoAxesCombined,
  },
];

export default function DashboardClient() {
  const [amountVisible, setAmountVisible] = useState(false);
  const month = getCurrentMonthRange();
  const { data, isLoading, isFetching, isError, refetch } = useRecords(
    {
      page: 1,
      pageSize: 5,
    },
  );
  const bonusQuery = useRecords({ page: 1, pageSize: 100, dateFrom: month.from, dateTo: month.to });
  const salaryQuery = useSalarySettings();
  const calculationQuery = useBonusCalculationSettings();
  const recentRecords: IRecordResponse[] = data?.data ?? [];
  const recordCount = data?.pagination?.total ?? 0;
  const latestRecord = recentRecords[0];
  const salary = salaryQuery.data?.data.find((setting) => setting.currency === "USD");
  const calculationSettings = calculationQuery.data?.data;
  const rates = {
    weekday: calculationSettings?.weekdayMultiplier ?? 1,
    normalHoliday: calculationSettings?.normalHolidayMultiplier ?? 2,
    weekend: calculationSettings?.weekendMultiplier ?? 2,
    specialDay: calculationSettings?.specialDayMultiplier ?? 2,
  };
  const weightedMinutes = (bonusQuery.data?.data ?? []).reduce(
    (total, record) => total + calculateRecordBonus(record, rates).multiplied,
    0,
  );
  const hourlyRate = salary && (calculationSettings?.workingDaysPerMonth ?? 22) > 0 && (calculationSettings?.hoursPerWorkday ?? 8) > 0
    ? salary.monthlySalary / (calculationSettings?.workingDaysPerMonth ?? 22) / (calculationSettings?.hoursPerWorkday ?? 8)
    : 0;
  const grossBonus = (weightedMinutes * hourlyRate) / 60;
  const netBonus = grossBonus * (1 - (salary?.taxRate ?? 0) / 100);
  const bonusLoading = bonusQuery.isLoading || salaryQuery.isLoading || calculationQuery.isLoading;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <header className="mb-5">
          <div className="flex items-center justify-between gap-3">
            <div>
            <p className="text-xs font-medium text-slate-500">Your workspace</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Dashboard</h1>
            </div>
            <Link href="/ot-record/add" className="shrink-0">
              <Button type="primary" icon={<Plus size={16} />} className="h-9! rounded-lg! px-3! text-sm!">Add work log</Button>
            </Link>
          </div>
          <p className="mt-2 text-sm text-slate-500">Recent work and monthly bonus estimate.</p>
        </header>

        {isError && (
          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-700">
              Couldn&apos;t load your latest work logs.
            </p>
            <Button size="small" danger onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        )}

        <section aria-label="Work overview" className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <article className="col-span-2 rounded-xl border border-slate-200 bg-white p-4 lg:col-span-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><ChartNoAxesCombined size={17} aria-hidden="true" /></span>
                <p className="text-xs font-medium text-slate-500">Bonus · {month.label}</p>
              </div>
              <button type="button" aria-label={amountVisible ? "Hide bonus amount" : "Show bonus amount"} aria-pressed={amountVisible} onClick={() => setAmountVisible((visible) => !visible)} className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500">
                {amountVisible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
            {bonusLoading ? <Skeleton.Input active size="small" className="mt-3!" /> : <p className="mt-3 truncate text-lg font-semibold tabular-nums text-slate-950">{bonusQuery.isError || salaryQuery.isError || calculationQuery.isError ? "Unavailable" : !salary || salary.monthlySalary <= 0 ? <Link href="/settings/salary" className="text-sm text-slate-600 underline underline-offset-2">Set salary</Link> : amountVisible ? formatBonusMoney(netBonus, "USD") : "••••••"}</p>}
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
            <p className="text-xs font-medium text-slate-500">Work logs</p>
            {isLoading ? <Skeleton.Input active size="small" className="mt-2!" /> : <p className="mt-2 text-xl font-semibold tabular-nums text-slate-950">{recordCount}<span className="ml-1 text-xs font-normal text-slate-500">total</span></p>}
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
            <p className="text-xs font-medium text-slate-500">Latest log</p>
            {isLoading ? <Skeleton.Input active size="small" className="mt-2!" /> : latestRecord ? <><p className="mt-2 truncate text-sm font-semibold text-slate-950">{latestRecord.workDate}</p><p className="mt-0.5 text-xs text-slate-500">{formatTotal(latestRecord.totalMinutes)}</p></> : <p className="mt-2 text-xs text-slate-500">No entries yet</p>}
          </article>
        </section>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(16rem,0.8fr)]">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Recent work logs
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Your latest entries
                </p>
              </div>
              <Link
                href="/ot-record"
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-950"
              >
                {isFetching && <span role="status" className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500"><LoaderCircle size={13} className="animate-spin" aria-hidden="true" />Loading</span>}
                View all <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
            {isLoading ? (
              <ul aria-label="Loading work logs" className="divide-y divide-slate-100">
                {[0, 1, 2].map((item) => (
                  <li key={item} className="px-4 py-4 sm:px-5">
                    <Skeleton active title={false} paragraph={{ rows: 1 }} />
                  </li>
                ))}
              </ul>
            ) : recentRecords.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {recentRecords.slice(0, 4).map((record) => (
                  <li
                    key={record.id}
                    className="flex items-center gap-3 px-4 py-3.5 sm:px-5"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                      <ClipboardList size={17} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {record.project || record.task || "Work log"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {record.workDate} · {formatTime(record.startTime)}–
                        {record.endTime ? formatTime(record.endTime) : (
                          <span className="ml-1 inline-flex rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                            In progress
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums text-slate-700">
                      {formatTotal(record.totalMinutes)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium text-slate-800">
                  No work logs yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Add your first entry to start tracking your work.
                </p>
                <Link
                  href="/ot-record/add"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-950"
                >
                  Add work log <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
              <h2 className="text-sm font-semibold text-slate-900">Workspace</h2>
              <p className="mt-0.5 text-xs text-slate-500">Projects and reports</p>
            </div>
            <ul className="divide-y divide-slate-100">
              {shortcuts.map(({ title, description, href, icon: Icon }) => (
                <li key={href}>
                  <Link href={href} className="group flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-slate-500 sm:px-5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Icon size={18} aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-800">{title}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">{description}</span>
                    </span>
                    <ArrowRight size={16} className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
