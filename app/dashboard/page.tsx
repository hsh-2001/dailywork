"use client";

import Link from "next/link";
import { useRecords } from "@/hooks/record.hook";
import { formatTime } from "@/utils/datetime";
import type { IRecordResponse } from "@/shares/dtos/record/recordResponse";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  ChartNoAxesCombined,
  ClipboardList,
  FolderKanban,
  Plus,
  StickyNote,
} from "lucide-react";
import { Button, Skeleton } from "antd";

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
    title: "Notes",
    description: "Keep useful thoughts close at hand",
    href: "/notes",
    icon: StickyNote,
  },
  {
    title: "Reports",
    description: "View work summaries",
    href: "/reports",
    icon: ChartNoAxesCombined,
  },
];

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useRecords({
    page: 1,
    pageSize: 5,
  });
  const recentRecords: IRecordResponse[] = data?.data ?? [];
  const recordCount = data?.pagination?.total ?? 0;
  const latestRecord = recentRecords[0];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700">Your workspace</p>
            <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
              Dashboard
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              A quick look at your recent work.
            </p>
          </div>
          <Link href="/ot-record/add" className="shrink-0">
            <Button
              type="primary"
              size="small"
              icon={<Plus size={16} />}
              aria-label="Add work log"
              title="Add work log"
              className="!h-8 !w-8 !px-0"
            />
          </Link>
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

        <section
          aria-label="Work overview"
          className="grid gap-2 sm:grid-cols-2"
        >
          <article className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <ClipboardList size={16} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs text-slate-500">Work logs</p>
                {isLoading ? (
                  <Skeleton.Input active size="small" className="!mt-1" />
                ) : (
                  <p className="text-base font-semibold tabular-nums text-slate-900">
                    {recordCount}
                    <span className="ml-1.5 text-sm font-normal text-slate-500">
                      total
                    </span>
                  </p>
                )}
              </div>
            </div>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <CalendarClock size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Latest work log</p>
                {isLoading ? (
                  <Skeleton.Input active size="small" className="!mt-1" />
                ) : latestRecord ? (
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {latestRecord.workDate}
                    <span className="ml-2 text-sm font-medium text-slate-500">
                      {formatTotal(latestRecord.totalMinutes)}
                    </span>
                  </p>
                ) : (
                  <p className="mt-0.5 text-sm font-medium text-slate-700">
                    No entries yet
                  </p>
                )}
              </div>
            </div>
          </article>
        </section>

        <div className="mt-5 grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(16rem,0.8fr)]">
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
                className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800"
              >
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
                        {formatTime(record.endTime)}
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
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  Add work log <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
              <h2 className="text-sm font-semibold text-slate-900">
                Workspace
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Tools to organize your work
              </p>
            </div>
            <ul className="divide-y divide-slate-100">
              {shortcuts.map(({ title, description, href, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-blue-600 sm:px-5"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-800">
                        {title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {description}
                      </span>
                    </span>
                    <ArrowRight
                      size={16}
                      className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-700"
                      aria-hidden="true"
                    />
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
