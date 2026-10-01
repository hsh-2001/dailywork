"use client";

import Link from "next/link";
import { useRecords } from "@/hooks/record.hook";
import { formatTime } from "@/utils/datetime";
import type { IRecordResponse } from "@/shares/dtos/record/recordResponse";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  ChartNoAxesCombined,
  ClipboardList,
  FolderKanban,
  Plus,
  Sparkles,
} from "lucide-react";

const formatTotal = (minutes: number | null) => {
  if (minutes == null) return "—";
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

const shortcuts = [
  {
    title: "Projects",
    description: "Keep your work organized",
    href: "/projects",
    icon: FolderKanban,
    tone: "bg-violet-50 text-violet-700",
  },
  {
    title: "Reports",
    description: "Understand your work patterns",
    href: "/reports",
    icon: ChartNoAxesCombined,
    tone: "bg-amber-50 text-amber-700",
  },
];

export default function DashboardPage() {
  const { data, isLoading } = useRecords({ page: 1, pageSize: 5 });
  const recentRecords: IRecordResponse[] = data?.data ?? [];
  const recordCount = data?.pagination?.total ?? 0;
  const latestRecord = recentRecords[0];

  return (
    <main className="min-h-[calc(100vh-4.75rem)] bg-slate-50 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 px-6 py-8 text-white shadow-xl shadow-blue-900/10 sm:px-10 sm:py-11">
          <div className="absolute -right-16 -top-24 -z-10 size-80 rounded-full border-[40px] border-white/10" />
          <div className="absolute -bottom-28 right-28 -z-10 size-56 rounded-full bg-cyan-300/15 blur-2xl" />
          <div className="flex max-w-2xl items-center gap-2 text-sm font-semibold text-blue-100">
            <Sparkles size={16} aria-hidden="true" /> Your workday, at a glance
          </div>
          <h1 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Make every work hour count.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-blue-50 sm:text-base">
            Keep your work logs in one place and stay on top of the details that move your day forward.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/ot-record"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-blue-700 shadow-lg shadow-blue-950/10 transition hover:bg-blue-50"
            >
              <Plus size={17} aria-hidden="true" /> Add a work log
            </Link>
            <Link
              href="/ot-record"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              View work logs <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section aria-label="Work overview" className="mt-5 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between">
              <span className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <ClipboardList size={21} aria-hidden="true" />
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">All time</span>
            </div>
            <p className="mt-5 text-sm font-medium text-slate-500">Work logs</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{isLoading ? "—" : recordCount}</p>
          </article>

          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between">
              <span className="flex size-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <CalendarClock size={21} aria-hidden="true" />
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Latest entry</span>
            </div>
            <p className="mt-5 text-sm font-medium text-slate-500">{latestRecord?.workDate ?? "Your next work log"}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {latestRecord ? formatTotal(latestRecord.totalMinutes) : "Ready when you are"}
            </p>
          </article>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-semibold text-slate-900">Recent work logs</h2>
                <p className="mt-0.5 text-sm text-slate-500">Your latest overtime entries</p>
              </div>
              <Link href="/ot-record" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800">
                See all <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
            {recentRecords.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {recentRecords.slice(0, 4).map((record) => (
                  <li key={record.id} className="flex items-center gap-3 px-5 py-4 sm:px-6">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                      <BriefcaseBusiness size={18} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{record.project || record.task || "Work log"}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{record.workDate} · {formatTime(record.startTime)}–{formatTime(record.endTime)}</p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold tabular-nums text-blue-700">{formatTotal(record.totalMinutes)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-6 py-10 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                  <ClipboardList size={22} aria-hidden="true" />
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-800">No work logs yet</p>
                <p className="mt-1 text-sm text-slate-500">Your latest entries will show up here.</p>
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 px-1">
              <h2 className="font-semibold text-slate-900">Explore Daily Work</h2>
              <p className="mt-0.5 text-sm text-slate-500">More tools for your workflow</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {shortcuts.map(({ title, description, href, icon: Icon, tone }) => (
                <Link key={href} href={href} className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                  <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900">{title}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-500">{description}</span>
                  </span>
                  <ArrowRight size={17} className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
