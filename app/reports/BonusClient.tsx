"use client";

import { useId, useState } from "react";
import { Alert, Button, DatePicker, InputNumber, Select, Skeleton, Space } from "antd";
import { ArrowUpRight, CalendarDays, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRecords } from "@/hooks/record.hook";
import { useSalarySettings } from "@/hooks/salary-settings.hook";
import type { IRecordResponse } from "@/shares/dtos/record/recordResponse";
import type { SalarySettings } from "@/shares/dtos/salary-settings/salarySettings";
import dayjs from "dayjs";
import { APP_TZ, formatTime } from "@/utils/datetime";

type Rates = {
  weekdayBefore: number;
  weekdayAfter: number;
  weekend: number;
  cutoff: string;
};
type Parts = { before: number; after: number; weekend: number };
const EMPTY_PARTS: Parts = { before: 0, after: 0, weekend: 0 };

const intersectsMinutes = (
  start: number,
  end: number,
  clipStart: number,
  clipEnd: number,
) => Math.max(0, Math.min(end, clipEnd) - Math.max(start, clipStart)) / 60_000;

function calculateRecord(record: IRecordResponse, rates: Rates) {
  const none = { minutes: 0, multiplied: 0, parts: EMPTY_PARTS };
  if (!record.endTime || record.totalMinutes === null) return none;
  const start = dayjs(record.startTime).tz(APP_TZ).valueOf();
  const end = dayjs(record.endTime).tz(APP_TZ).valueOf();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
    return none;

  const breakStart = record.breakStartTime
    ? dayjs(record.breakStartTime).tz(APP_TZ).valueOf()
    : null;
  const breakEnd = record.breakEndTime
    ? dayjs(record.breakEndTime).tz(APP_TZ).valueOf()
    : null;
  const unpaid = (a: number, b: number) =>
    breakStart !== null && breakEnd !== null
      ? intersectsMinutes(
          start,
          end,
          Math.max(a, breakStart),
          Math.min(b, breakEnd),
        )
      : 0;

  const date = dayjs.tz(`${record.workDate} 00:00`, APP_TZ);
  const weekday = date.day() >= 1 && date.day() <= 5;
  if (!weekday) {
    const minutes = Math.max(
      0,
      intersectsMinutes(start, end, start, end) - unpaid(start, end),
    );
    return {
      minutes,
      multiplied: minutes * rates.weekend,
      parts: { before: 0, after: 0, weekend: minutes },
    };
  }

  const [h, m] = rates.cutoff.split(":").map(Number);
  const cutoff = dayjs
    .tz(
      `${record.workDate} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      APP_TZ,
    )
    .valueOf();
  const beforeEnd = Math.min(end, cutoff);
  const before = Math.max(
    0,
    intersectsMinutes(start, beforeEnd, start, beforeEnd) -
      unpaid(start, beforeEnd),
  );
  const afterStart = Math.max(start, cutoff);
  const after = Math.max(
    0,
    intersectsMinutes(afterStart, end, afterStart, end) -
      unpaid(afterStart, end),
  );
  return {
    minutes: before + after,
    multiplied: before * rates.weekdayBefore + after * rates.weekdayAfter,
    parts: { before, after, weekend: 0 },
  };
}

const prettyDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));

const weekdayShort = (value: string) =>
  new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remaining = Math.round(minutes % 60);
  if (!hours && !remaining) return "0h";
  if (!hours) return `${remaining}m`;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
};

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const ymd = (d: dayjs.Dayjs) => d.format("YYYY-MM-DD");

function getPresets() {
  const now = dayjs().tz(APP_TZ);
  const last = now.subtract(1, "month");
  return [
    {
      key: "this",
      label: "This month",
      from: ymd(now.startOf("month")),
      to: ymd(now.endOf("month")),
    },
    {
      key: "last",
      label: "Last month",
      from: ymd(last.startOf("month")),
      to: ymd(last.endOf("month")),
    },
    {
      key: "7d",
      label: "Last 7 days",
      from: ymd(now.subtract(6, "day")),
      to: ymd(now),
    },
    { key: "all", label: "All time", from: "", to: "" },
  ];
}

const dateInput =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

export default function BonusClient() {
  const [dateFrom, setDateFrom] = useState(() => getPresets()[0].from);
  const [dateTo, setDateTo] = useState(() => getPresets()[0].to);
  const [bookingStatus, setBookingStatus] = useState("");
  const [submitStatus, setSubmitStatus] = useState("");
  const [monthlySalaryOverride, setMonthlySalaryOverride] = useState<number | null>(null);
  const [currencyOverride, setCurrencyOverride] = useState<SalarySettings["currency"] | null>(null);
  const [taxRateOverride, setTaxRateOverride] = useState<number | null>(null);
  const [workingDays, setWorkingDays] = useState<number>(22);
  const [dailyHours, setDailyHours] = useState<number>(8);
  const [cutoff, setCutoff] = useState("16:30");
  const [weekdayBefore, setWeekdayBefore] = useState<number>(1);
  const [weekdayAfter, setWeekdayAfter] = useState<number>(1.5);
  const [weekendRate, setWeekendRate] = useState<number>(2);
  const salarySettingsQuery = useSalarySettings();
  const savedSalarySettings = salarySettingsQuery.data?.data;
  const monthlySalary = monthlySalaryOverride ?? savedSalarySettings?.monthlySalary ?? 0;
  const currency = currencyOverride ?? savedSalarySettings?.currency ?? "USD";
  const taxRate = taxRateOverride ?? savedSalarySettings?.taxRate ?? 0;

  const { data, isLoading, isError, isFetching, refetch } = useRecords({
    page: 1,
    pageSize: 100,
    dateFrom,
    dateTo,
    bookingStatus,
    submitStatus,
  });

  const records = data?.data ?? [];
  const rates: Rates = {
    weekdayBefore,
    weekdayAfter,
    weekend: weekendRate,
    cutoff,
  };
  const hourly =
    workingDays > 0 && dailyHours > 0
      ? monthlySalary / workingDays / dailyHours
      : 0;
  const rows = records.map((record) => ({
    record,
    ...calculateRecord(record, rates),
  }));

  const totals = rows.reduce(
    (acc, r) => ({
      minutes: acc.minutes + r.minutes,
      multiplied: acc.multiplied + r.multiplied,
      before: acc.before + r.parts.before,
      after: acc.after + r.parts.after,
      weekend: acc.weekend + r.parts.weekend,
    }),
    { minutes: 0, multiplied: 0, before: 0, after: 0, weekend: 0 },
  );
  const payOf = (minutes: number, multiplier: number) =>
    (minutes * multiplier * hourly) / 60;
  const totalPay = (totals.multiplied * hourly) / 60;
  const estimatedTax = (totalPay * taxRate) / 100;
  const netPay = totalPay - estimatedTax;
  const completedDays = records.filter((r) => r.totalMinutes !== null).length;

  const presets = getPresets();
  const activePreset = presets.find(
    (p) => p.from === dateFrom && p.to === dateTo,
  )?.key;
  const rangeLabel =
    dateFrom && dateTo
      ? `${prettyDate(dateFrom)} – ${prettyDate(dateTo)}`
      : dateFrom
        ? `From ${prettyDate(dateFrom)}`
        : dateTo
          ? `Through ${prettyDate(dateTo)}`
          : "All dates";

  const bands = [
    {
      key: "before",
      label: "Weekday",
      sub: `${weekdayBefore}×`,
      minutes: totals.before,
      pay: payOf(totals.before, weekdayBefore),
      color: "bg-slate-300",
      dot: "bg-slate-300",
    },
    {
      key: "after",
      label: `After ${cutoff}`,
      sub: `${weekdayAfter}×`,
      minutes: totals.after,
      pay: payOf(totals.after, weekdayAfter),
      color: "bg-slate-500",
      dot: "bg-slate-500",
    },
    {
      key: "weekend",
      label: "Weekend",
      sub: `${weekendRate}×`,
      minutes: totals.weekend,
      pay: payOf(totals.weekend, weekendRate),
      color: "bg-slate-700",
      dot: "bg-slate-700",
    },
  ];
  const barBasis = totalPay > 0 ? "pay" : "minutes";
  const barTotal = bands.reduce(
    (s, b) => s + (barBasis === "pay" ? b.pay : b.minutes),
    0,
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Work summary
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Bonus calculator
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Estimate overtime pay from your logged hours.
            </p>
          </div>
          <Link
            href="/ot-record"
            className="inline-flex h-10 w-fit shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Work logs <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </header>

        {isError && (
          <Alert
            className="mb-5"
            type="error"
            showIcon
            message="Couldn’t load work logs"
            description="Check your connection and try again."
            action={
              <Button
                size="small"
                icon={<RotateCcw size={14} />}
                onClick={() => refetch()}
              >
                Retry
              </Button>
            }
          />
        )}
        {salarySettingsQuery.isError && (
          <Alert
            className="mb-5"
            type="error"
            showIcon
            message="Couldn't load your saved salary and tax defaults"
            description="The estimate may not reflect your saved settings."
            action={
              <Button
                size="small"
                icon={<RotateCcw size={14} />}
                onClick={() => salarySettingsQuery.refetch()}
              >
                Retry
              </Button>
            }
          />
        )}

        <div className="grid gap-5 lg:grid-cols-[360px_1fr] lg:items-start">
          <section
            aria-label="Estimated overtime pay"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 sm:p-6 lg:col-start-1"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Estimated OT pay after tax
              </p>
              {isFetching && !isLoading && (
                <span role="status" className="text-xs text-slate-500">
                  Updating…
                </span>
              )}
            </div>
            {isLoading || salarySettingsQuery.isLoading ? (
              <Skeleton.Input active className="mt-3!" />
            ) : (
              <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-slate-950 sm:text-5xl">
                {formatMoney(netPay, currency)}
              </p>
            )}
            <p className="mt-1.5 text-sm text-slate-500">{rangeLabel}</p>

            <dl className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Gross overtime pay</dt>
                <dd className="font-medium tabular-nums text-slate-800">
                  {salarySettingsQuery.isLoading ? "—" : formatMoney(totalPay, currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Estimated tax ({taxRate}%)</dt>
                <dd className="font-medium tabular-nums text-slate-800">
                  {salarySettingsQuery.isLoading ? "—" : `−${formatMoney(estimatedTax, currency)}`}
                </dd>
              </div>
            </dl>

            {monthlySalary <= 0 && !isLoading && !salarySettingsQuery.isLoading && (
              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Enter your monthly salary below to see an amount.
              </p>
            )}

            <div className="mt-6 rounded-xl bg-slate-50 p-4">
              <div
                className="flex h-2 overflow-hidden rounded-full bg-slate-200"
                role="img"
                aria-label="Share of overtime by rate band"
              >
                {barTotal > 0 &&
                  bands.map((b) => {
                    const value = barBasis === "pay" ? b.pay : b.minutes;
                    return value > 0 ? (
                      <span
                        key={b.key}
                        className={`${b.color} h-full`}
                        style={{ width: `${(value / barTotal) * 100}%` }}
                      />
                    ) : null;
                  })}
              </div>
              <ul className="mt-4 space-y-3">
                {bands.map((b) => (
                  <li
                    key={b.key}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={`size-2.5 shrink-0 rounded-full ${b.dot}`}
                        aria-hidden="true"
                      />
                      <span className="truncate text-slate-700">{b.label}</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-slate-600">
                        {b.sub}
                      </span>
                    </span>
                    <span className="shrink-0 text-right tabular-nums">
                      <span className="text-slate-500">
                        {formatDuration(b.minutes)}
                      </span>
                      <span className="ml-3 inline-block min-w-[5.5rem] font-semibold text-slate-900">
                        {formatMoney(b.pay, currency)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <dl className="mt-5 grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white py-3 text-center">
              <Stat
                label="Days"
                value={isLoading ? "–" : String(completedDays)}
              />
              <Stat
                label="Logged"
                value={isLoading ? "–" : formatDuration(totals.minutes)}
              />
              <Stat
                label="Base / hr"
                value={salarySettingsQuery.isLoading ? "—" : formatMoney(hourly, currency)}
              />
            </dl>
          </section>

          <section
            aria-label="Daily breakdown"
            className="rounded-2xl border border-slate-200 bg-white lg:col-start-2 lg:row-span-2 lg:row-start-1"
          >
            <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Daily breakdown
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Review hours and estimated pay for each work log.
                  </p>
                </div>
                {isFetching && !isLoading && (
                  <span
                    role="status"
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                  >
                    <span className="size-1.5 animate-pulse rounded-full bg-slate-500" />
                    Updating
                  </span>
                )}
              </div>
              <div
                className="flex flex-wrap items-center gap-2"
                role="group"
                aria-label="Date range presets"
              >
                {presets.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    aria-pressed={activePreset === p.key}
                    onClick={() => {
                      setDateFrom(p.from);
                      setDateTo(p.to);
                    }}
                    className={`h-9 rounded-full px-3.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 ${
                      activePreset === p.key
                        ? "bg-slate-800 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <DatePicker
                  aria-label="From date"
                  allowClear
                  value={dateFrom ? dayjs(dateFrom) : null}
                  maxDate={dateTo ? dayjs(dateTo) : undefined}
                  onChange={(value) => setDateFrom(value?.format("YYYY-MM-DD") ?? "")}
                  placeholder="From date"
                  size="large"
                  suffixIcon={<CalendarDays size={15} />}
                  className="w-full!"
                />
                <DatePicker
                  aria-label="To date"
                  allowClear
                  value={dateTo ? dayjs(dateTo) : null}
                  minDate={dateFrom ? dayjs(dateFrom) : undefined}
                  onChange={(value) => setDateTo(value?.format("YYYY-MM-DD") ?? "")}
                  placeholder="To date"
                  size="large"
                  suffixIcon={<CalendarDays size={15} />}
                  className="w-full!"
                />
                <Select
                  aria-label="Booking status filter"
                  value={bookingStatus || undefined}
                  onChange={(v) => setBookingStatus(v ?? "")}
                  allowClear
                  placeholder="Booking status"
                  size="large"
                  options={[
                    { value: "PENDING", label: "Pending" },
                    { value: "BOOKED", label: "Booked" },
                    { value: "CANCELLED", label: "Cancelled" },
                  ]}
                />
                <Select
                  aria-label="Submission status filter"
                  value={submitStatus || undefined}
                  onChange={(v) => setSubmitStatus(v ?? "")}
                  allowClear
                  placeholder="Submission status"
                  size="large"
                  options={[
                    { value: "NOT_SUBMITTED", label: "Not submitted" },
                    { value: "SUBMITTED", label: "Submitted" },
                    { value: "APPROVED", label: "Approved" },
                    { value: "REJECTED", label: "Rejected" },
                  ]}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4 p-5">
                <Skeleton active avatar paragraph={{ rows: 1 }} />
                <Skeleton active avatar paragraph={{ rows: 1 }} />
                <Skeleton active avatar paragraph={{ rows: 1 }} />
              </div>
            ) : records.length ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                  <span>
                    {records.length} {records.length === 1 ? "work log" : "work logs"}
                  </span>
                  <span className="pr-0.5">Estimated pay</span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {rows.map(({ record, minutes, multiplied }) => (
                    <LogRow
                      key={record.id}
                      record={record}
                      minutes={minutes}
                      pay={(multiplied * hourly) / 60}
                      weekdayBefore={weekdayBefore}
                      weekdayAfter={weekdayAfter}
                      weekendRate={weekendRate}
                      cutoff={cutoff}
                      currency={currency}
                    />
                  ))}
                </ul>
              </>
            ) : (
              <div className="px-5 py-16 text-center">
                <p className="text-sm font-semibold text-slate-800">
                  No work logs in this range
                </p>
                <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
                  Try another period or clear the status filters.
                </p>
                <div className="mt-5 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDateFrom("");
                      setDateTo("");
                      setBookingStatus("");
                      setSubmitStatus("");
                    }}
                    className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Show all time
                  </button>
                  <Link
                    href="/ot-record/add"
                    className="inline-flex h-9 items-center rounded-lg bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-700"
                  >
                    Add work log
                  </Link>
                </div>
              </div>
            )}

            {data && data.pagination.total > 100 && (
              <p className="m-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 sm:m-5">
                Showing the first 100 entries. Narrow the date range to include
                every log.
              </p>
            )}
          </section>

          <section
            aria-label="Salary and rate settings"
            className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-start-1"
          >
            <h2 className="text-base font-semibold text-slate-900">
              Calculation settings
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Adjust your base pay and overtime rates.
            </p>

            <FormGroup title="Salary">
              <Field label="Monthly salary">
                <Space.Compact block>
                  <InputNumber
                    aria-label="Monthly base salary"
                    min={0}
                    step={100}
                    value={monthlySalary}
                    onChange={(v) => setMonthlySalaryOverride(v ?? 0)}
                    className="min-w-0 flex-1"
                  />
                  <Select
                    aria-label="Salary currency"
                    value={currency}
                    onChange={(value: SalarySettings["currency"]) => setCurrencyOverride(value)}
                    className="w-[82px]"
                    options={[
                      { value: "USD", label: "USD" },
                      { value: "KHR", label: "KHR" },
                    ]}
                  />
                </Space.Compact>
              </Field>
              <Field label="Workdays / month">
                <Space.Compact block>
                  <InputNumber
                    aria-label="Workdays per month"
                    min={1}
                    max={31}
                    value={workingDays}
                    onChange={(v) => setWorkingDays(v ?? 0)}
                    className="min-w-0 flex-1"
                  />
                  <span className="flex items-center border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                    days
                  </span>
                </Space.Compact>
              </Field>
              <Field label="Hours / workday">
                <Space.Compact block>
                  <InputNumber
                    aria-label="Hours per workday"
                    min={1}
                    max={24}
                    step={0.5}
                    value={dailyHours}
                    onChange={(v) => setDailyHours(v ?? 0)}
                    className="min-w-0 flex-1"
                  />
                  <span className="flex items-center border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                    hrs
                  </span>
                </Space.Compact>
              </Field>
            </FormGroup>

            <FormGroup title="Tax">
              <Field label="Tax rate">
                <Space.Compact block>
                  <InputNumber
                    aria-label="Overtime tax rate"
                    min={0}
                    max={100}
                    step={0.5}
                    value={taxRate}
                    onChange={(v) => setTaxRateOverride(v ?? 0)}
                    className="min-w-0 flex-1"
                  />
                  <span className="flex items-center border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                    %
                  </span>
                </Space.Compact>
              </Field>
              <p className="text-xs leading-5 text-slate-500">
                Applied to estimated overtime pay only.
              </p>
            </FormGroup>

            <FormGroup title="Overtime multipliers">
              <Field label="Weekday before cutoff">
                <Space.Compact block>
                  <InputNumber
                    aria-label="Weekday before cutoff multiplier"
                    min={0}
                    max={10}
                    step={0.25}
                    value={weekdayBefore}
                    onChange={(v) => setWeekdayBefore(v ?? 0)}
                    className="min-w-0 flex-1"
                  />
                  <span className="flex items-center border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                    ×
                  </span>
                </Space.Compact>
              </Field>
              <Field label="Cutoff time">
                <input
                  type="time"
                  aria-label="Weekday overtime cutoff time"
                  value={cutoff}
                  onChange={(e) => setCutoff(e.target.value || "16:30")}
                  className={`${dateInput} w-full`}
                />
              </Field>
              <Field label="Weekday after cutoff">
                <Space.Compact block>
                  <InputNumber
                    aria-label="Weekday after cutoff multiplier"
                    min={0}
                    max={10}
                    step={0.25}
                    value={weekdayAfter}
                    onChange={(v) => setWeekdayAfter(v ?? 0)}
                    className="min-w-0 flex-1"
                  />
                  <span className="flex items-center border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                    ×
                  </span>
                </Space.Compact>
              </Field>
              <Field label="Weekend (Sat–Sun)">
                <Space.Compact block>
                  <InputNumber
                    aria-label="Weekend multiplier"
                    min={0}
                    max={10}
                    step={0.25}
                    value={weekendRate}
                    onChange={(v) => setWeekendRate(v ?? 0)}
                    className="min-w-0 flex-1"
                  />
                  <span className="flex items-center border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                    ×
                  </span>
                </Space.Compact>
              </Field>
            </FormGroup>

            <p className="mt-5 text-xs leading-5 text-slate-500">
              Base hourly = salary ÷ workdays ÷ hours. Pay = logged minutes ×
              multiplier × base hourly. Phnom Penh time; recorded breaks are
              excluded.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
        {value}
      </dd>
    </div>
  );
}

function FormGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="mt-5 border-t border-slate-100 pt-4">
      <legend className="sr-only">{title}</legend>
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="grid grid-cols-[1fr_150px] items-center gap-3">
      <span id={id} className="text-sm text-slate-700">
        {label}
      </span>
      <div aria-labelledby={id}>{children}</div>
    </div>
  );
}

function Chip({
  tone,
  children,
}: {
  tone: "base" | "high" | "weekend" | "muted";
  children: React.ReactNode;
}) {
  const tones = {
    base: "bg-slate-50 text-slate-700 ring-slate-200",
    high: "bg-slate-100 text-slate-800 ring-slate-300",
    weekend: "bg-slate-200/70 text-slate-700 ring-slate-300",
    muted: "bg-slate-50 text-slate-600 ring-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function LogRow({
  record,
  minutes,
  pay,
  weekdayBefore,
  weekdayAfter,
  weekendRate,
  cutoff,
  currency,
}: {
  record: IRecordResponse;
  minutes: number;
  pay: number;
  weekdayBefore: number;
  weekdayAfter: number;
  weekendRate: number;
  cutoff: string;
  currency: string;
}) {
  const inProgress = record.totalMinutes === null;
  const weekend = [0, 6].includes(
    dayjs.tz(`${record.workDate} 00:00`, APP_TZ).day(),
  );
  const startClock = dayjs(record.startTime).tz(APP_TZ).format("HH:mm");
  const endClock = record.endTime
    ? dayjs(record.endTime).tz(APP_TZ).format("HH:mm")
    : startClock;
  const crossesCutoff = startClock < cutoff && endClock > cutoff;

  const chips = inProgress ? (
    <Chip tone="muted">In progress</Chip>
  ) : weekend ? (
    <Chip tone="weekend">Weekend {weekendRate}×</Chip>
  ) : crossesCutoff ? (
    <>
      <Chip tone="base">{weekdayBefore}×</Chip>
      <span aria-hidden="true" className="text-xs text-slate-400">
        →
      </span>
      <Chip tone="high">{weekdayAfter}×</Chip>
    </>
  ) : endClock >= cutoff ? (
    <Chip tone="high">{weekdayAfter}×</Chip>
  ) : (
    <Chip tone="base">{weekdayBefore}×</Chip>
  );

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-4 transition-colors hover:bg-slate-50 sm:px-5">
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">
          {weekdayShort(record.workDate)}, {prettyDate(record.workDate)}
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-slate-900">
          {record.project || record.task || "Work log"}
        </p>
        <p className="mt-0.5 text-xs tabular-nums text-slate-500">
          {formatTime(record.startTime)} –{" "}
          {formatTime(record.endTime ?? record.startTime)}
          {!inProgress && <span className="text-slate-300"> · </span>}
          {!inProgress && formatDuration(minutes)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {chips}
        </div>
      </div>

      <div className="shrink-0 self-start pt-0.5 text-right">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:hidden">
          Est. pay
        </p>
        <p
          className={`mt-0.5 text-sm font-semibold tabular-nums sm:text-base ${inProgress ? "text-slate-400" : "text-slate-900"}`}
        >
          {inProgress ? "—" : formatMoney(pay, currency)}
        </p>
      </div>
    </li>
  );
}
