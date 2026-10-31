"use client";

import { useId, useState } from "react";
import { Alert, Button, DatePicker, InputNumber, Select, Skeleton, Space } from "antd";
import { ArrowUpRight, CalendarDays, Eye, EyeOff, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRecords } from "@/hooks/record.hook";
import { useSalarySettings } from "@/hooks/salary-settings.hook";
import { useBonusCalculationSettings } from "@/hooks/bonus-calculation-settings.hook";
import type { IRecordResponse } from "@/shares/dtos/record/recordResponse";
import type { SalarySettings } from "@/shares/dtos/salary-settings/salarySettings";
import dayjs from "dayjs";
import { APP_TZ, formatTime } from "@/utils/datetime";
import { getRecordDayType } from "@/utils/workday-type";

type Rates = {
  weekday: number;
  normalHoliday: number;
  weekend: number;
  specialDay: number;
};
type Parts = {
  weekday: number;
  normalHoliday: number;
  weekend: number;
  specialDay: number;
};
const EMPTY_PARTS: Parts = {
  weekday: 0,
  normalHoliday: 0,
  weekend: 0,
  specialDay: 0,
};

const intersectsMinutes = (
  start: number,
  end: number,
  clipStart: number,
  clipEnd: number,
) => Math.max(0, Math.min(end, clipEnd) - Math.max(start, clipStart)) / 60_000;

function calculateRecord(record: IRecordResponse, rates: Rates) {
  const none = { minutes: 0, multiplied: 0, parts: EMPTY_PARTS };
  if (!record.endTime || record.totalMinutes === null) return none;
  const start = dayjs(record.startTime).valueOf();
  const end = dayjs(record.endTime).valueOf();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
    return none;

  const breakStart = record.breakStartTime
    ? dayjs(record.breakStartTime).valueOf()
    : null;
  const breakEnd = record.breakEndTime
    ? dayjs(record.breakEndTime).valueOf()
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

  const minutes = Math.max(
    0,
    intersectsMinutes(start, end, start, end) - unpaid(start, end),
  );
  const dayType = getRecordDayType(record);
  const multiplier = rates[dayType === "normalHoliday" ? "normalHoliday" : dayType];
  return {
    minutes,
    multiplied: minutes * multiplier,
    parts: {
      weekday: dayType === "weekday" ? minutes : 0,
      normalHoliday: dayType === "normalHoliday" ? minutes : 0,
      weekend: dayType === "weekend" ? minutes : 0,
      specialDay: dayType === "specialDay" ? minutes : 0,
    },
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

const formatMoney = (amount: number, currency: string) => {
  if (currency === "KHR") {
    const formattedAmount = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    return `៛${formattedAmount}`;
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const ymd = (date: Date) => date.toISOString().slice(0, 10);

function getPresets() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value);
  const now = new Date(Date.UTC(part("year"), part("month") - 1, part("day")));
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const lastMonth = new Date(Date.UTC(year, month - 1, 1));
  return [
    {
      key: "this",
      label: "This month",
      from: ymd(new Date(Date.UTC(year, month, 1))),
      to: ymd(new Date(Date.UTC(year, month + 1, 0))),
    },
    {
      key: "last",
      label: "Last month",
      from: ymd(new Date(Date.UTC(
        lastMonth.getUTCFullYear(),
        lastMonth.getUTCMonth(),
        1,
      ))),
      to: ymd(new Date(Date.UTC(
        lastMonth.getUTCFullYear(),
        lastMonth.getUTCMonth() + 1,
        0,
      ))),
    },
    {
      key: "7d",
      label: "Last 7 days",
      from: ymd(new Date(Date.UTC(year, month, now.getUTCDate() - 6))),
      to: ymd(now),
    },
    { key: "all", label: "All time", from: "", to: "" },
  ];
}

export default function BonusClient() {
  const [amountsVisible, setAmountsVisible] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => getPresets()[0].from);
  const [dateTo, setDateTo] = useState(() => getPresets()[0].to);
  const [bookingStatus, setBookingStatus] = useState("");
  const [submitStatus, setSubmitStatus] = useState("");
  const [monthlySalaryOverride, setMonthlySalaryOverride] = useState<number | null>(null);
  const [currencyOverride, setCurrencyOverride] = useState<SalarySettings["currency"] | null>(null);
  const [salaryConversionBasis, setSalaryConversionBasis] = useState<{
    amount: number;
    currency: SalarySettings["currency"];
  } | null>(null);
  const [taxRateOverride, setTaxRateOverride] = useState<number | null>(null);
  const [workingDaysOverride, setWorkingDaysOverride] = useState<number | null>(null);
  const [dailyHoursOverride, setDailyHoursOverride] = useState<number | null>(null);
  const [weekdayRateOverride, setWeekdayRateOverride] = useState<number | null>(null);
  const [normalHolidayRateOverride, setNormalHolidayRateOverride] = useState<number | null>(null);
  const [weekendRateOverride, setWeekendRateOverride] = useState<number | null>(null);
  const [specialDayRateOverride, setSpecialDayRateOverride] = useState<number | null>(null);
  const salarySettingsQuery = useSalarySettings();
  const calculationSettingsQuery = useBonusCalculationSettings();
  const savedSalarySettings = salarySettingsQuery.data?.data ?? [];
  const savedCalculationSettings = calculationSettingsQuery.data?.data;
  const currency = currencyOverride ?? "USD";
  const selectedSalarySettings = savedSalarySettings.find(
    (settings) => settings.currency === "USD",
  );
  const monthlySalary = monthlySalaryOverride ?? selectedSalarySettings?.monthlySalary ?? 0;
  const taxRate = taxRateOverride ?? selectedSalarySettings?.taxRate ?? 0;
  const workingDays = workingDaysOverride ?? savedCalculationSettings?.workingDaysPerMonth ?? 22;
  const dailyHours = dailyHoursOverride ?? savedCalculationSettings?.hoursPerWorkday ?? 8;
  const weekdayRate = weekdayRateOverride ?? savedCalculationSettings?.weekdayMultiplier ?? 1;
  const normalHolidayRate = normalHolidayRateOverride ?? savedCalculationSettings?.normalHolidayMultiplier ?? 2;
  const weekendRate = weekendRateOverride ?? savedCalculationSettings?.weekendMultiplier ?? 2;
  const specialDayRate = specialDayRateOverride ?? savedCalculationSettings?.specialDayMultiplier ?? 2;

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
    weekday: weekdayRate,
    normalHoliday: normalHolidayRate,
    weekend: weekendRate,
    specialDay: specialDayRate,
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
      weekday: acc.weekday + r.parts.weekday,
      normalHoliday: acc.normalHoliday + r.parts.normalHoliday,
      weekend: acc.weekend + r.parts.weekend,
      specialDay: acc.specialDay + r.parts.specialDay,
    }),
    { minutes: 0, multiplied: 0, weekday: 0, normalHoliday: 0, weekend: 0, specialDay: 0 },
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
      key: "weekday",
      label: "Weekday",
      sub: `${weekdayRate}×`,
      minutes: totals.weekday,
      pay: payOf(totals.weekday, weekdayRate),
      color: "bg-slate-300",
      dot: "bg-slate-300",
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
    {
      key: "normalHoliday",
      label: "Normal holiday",
      sub: `${normalHolidayRate}×`,
      minutes: totals.normalHoliday,
      pay: payOf(totals.normalHoliday, normalHolidayRate),
      color: "bg-slate-500",
      dot: "bg-slate-500",
    },
    {
      key: "specialDay",
      label: "Special day",
      sub: `${specialDayRate}×`,
      minutes: totals.specialDay,
      pay: payOf(totals.specialDay, specialDayRate),
      color: "bg-slate-600",
      dot: "bg-slate-600",
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
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/ot-record"
              className="inline-flex h-10 w-fit shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Work logs <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
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
        {calculationSettingsQuery.isError && (
          <Alert
            className="mb-5"
            type="error"
            showIcon
            message="Couldn't load your saved overtime calculation defaults"
            description="The estimate may not reflect your saved calculation settings."
            action={
              <Button
                size="small"
                icon={<RotateCcw size={14} />}
                onClick={() => calculationSettingsQuery.refetch()}
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
              <div className="flex items-center gap-2">
                {isFetching && !isLoading && (
                  <span role="status" className="text-xs text-slate-500">
                    Updating…
                  </span>
                )}
                <button
                  type="button"
                  aria-label={amountsVisible ? "Hide amounts" : "Show amounts"}
                  aria-pressed={amountsVisible}
                  onClick={() => setAmountsVisible((visible) => !visible)}
                  className="inline-flex size-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                >
                  {amountsVisible ? (
                    <EyeOff size={16} aria-hidden="true" />
                  ) : (
                    <Eye size={16} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            {isLoading ||
            salarySettingsQuery.isLoading ||
            calculationSettingsQuery.isLoading ? (
              <Skeleton.Input active className="mt-3!" />
            ) : (
              <p className="mt-2 min-w-0 text-[clamp(1.75rem,8vw,3rem)] font-bold leading-tight tabular-nums tracking-tight text-slate-950 [overflow-wrap:anywhere]">
                <AmountMask visible={amountsVisible}>
                  {formatMoney(netPay, currency)}
                </AmountMask>
              </p>
            )}
            <p className="mt-1.5 text-sm text-slate-500">{rangeLabel}</p>

            <dl className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-slate-500">Gross overtime pay</dt>
                <dd className="max-w-[55%] text-right font-medium tabular-nums text-slate-800 [overflow-wrap:anywhere]">
                  {salarySettingsQuery.isLoading || calculationSettingsQuery.isLoading
                    ? "—"
                    : (
                      <AmountMask visible={amountsVisible}>
                        {formatMoney(totalPay, currency)}
                      </AmountMask>
                    )}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-slate-500">Estimated tax ({taxRate}%)</dt>
                <dd className="max-w-[55%] text-right font-medium tabular-nums text-slate-800 [overflow-wrap:anywhere]">
                  {salarySettingsQuery.isLoading || calculationSettingsQuery.isLoading
                    ? "—"
                    : (
                      <AmountMask visible={amountsVisible}>
                        −{formatMoney(estimatedTax, currency)}
                      </AmountMask>
                    )}
                </dd>
              </div>
            </dl>

            {monthlySalary <= 0 &&
              !isLoading &&
              !salarySettingsQuery.isLoading &&
              !calculationSettingsQuery.isLoading && (
              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Enter your base salary below to see an amount.
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
                    className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-2 gap-y-1 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(7rem,auto)]"
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
                    <span className="min-w-0 text-right text-xs font-semibold tabular-nums text-slate-900 [overflow-wrap:anywhere] sm:text-sm">
                      <AmountMask visible={amountsVisible}>
                        {formatMoney(b.pay, currency)}
                      </AmountMask>
                    </span>
                    <span className="text-xs tabular-nums text-slate-500">
                      {formatDuration(b.minutes)}
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
                value={
                  salarySettingsQuery.isLoading || calculationSettingsQuery.isLoading
                    ? "—"
                    : formatMoney(hourly, currency)
                }
                blurred={!amountsVisible}
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
                      weekdayRate={weekdayRate}
                      normalHolidayRate={normalHolidayRate}
                      weekendRate={weekendRate}
                      specialDayRate={specialDayRate}
                      currency={currency}
                      amountsVisible={amountsVisible}
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
              <Field
                label="Base salary"
                className="grid-cols-[minmax(0,1fr)_minmax(0,210px)]"
              >
                <Space.Compact block>
                  <InputNumber
                    aria-label="Monthly base salary"
                    min={0}
                    step={100}
                    value={monthlySalary}
                    onChange={(v) => {
                      setMonthlySalaryOverride(v ?? 0);
                      setSalaryConversionBasis(null);
                    }}
                    className={`min-w-0 flex-1 [&_.ant-input-number-input]:px-1 [&_.ant-input-number-input]:text-xs ${amountsVisible ? "" : "[&_.ant-input-number-input]:select-none [&_.ant-input-number-input]:!text-slate-600 [&_.ant-input-number-input]:blur-[10px] [&_.ant-input-number-input]:transition-all [&_.ant-input-number-input]:duration-200"}`}
                  />
                  <Select
                    aria-label="Salary currency"
                    value={currency}
                    onChange={(value: SalarySettings["currency"]) => {
                      if (currency === value) {
                        return;
                      }
                      const exchangeRate = savedCalculationSettings?.khrPerUsd ?? 4000;
                      const conversionBasis = salaryConversionBasis ?? {
                        amount: monthlySalary,
                        currency,
                      };
                      const convertedSalary =
                        conversionBasis.currency === value
                          ? conversionBasis.amount
                          : conversionBasis.currency === "USD"
                            ? conversionBasis.amount * exchangeRate
                            : conversionBasis.amount / exchangeRate;
                      setCurrencyOverride(value);
                      setSalaryConversionBasis(conversionBasis);
                      setMonthlySalaryOverride(
                        Number(
                          convertedSalary.toFixed(value === "KHR" ? 0 : 2),
                        ),
                      );
                      setTaxRateOverride(taxRate);
                    }}
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
                    onChange={(v) => setWorkingDaysOverride(v ?? 1)}
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
                    onChange={(v) => setDailyHoursOverride(v ?? 1)}
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
              <Field label="Weekday">
                <Space.Compact block>
                  <InputNumber
                    aria-label="Weekday multiplier"
                    min={0}
                    max={10}
                    step={0.25}
                    value={weekdayRate}
                    onChange={(v) => setWeekdayRateOverride(v ?? 0)}
                    className="min-w-0 flex-1"
                  />
                  <span className="flex items-center border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                    ×
                  </span>
                </Space.Compact>
              </Field>
              <Field label="Normal holiday">
                <Space.Compact block>
                  <InputNumber
                    aria-label="Normal holiday multiplier"
                    min={0}
                    max={10}
                    step={0.25}
                    value={normalHolidayRate}
                    onChange={(v) => setNormalHolidayRateOverride(v ?? 0)}
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
                    onChange={(v) => setWeekendRateOverride(v ?? 0)}
                    className="min-w-0 flex-1"
                  />
                  <span className="flex items-center border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                    ×
                  </span>
                </Space.Compact>
              </Field>
              <Field label="Special day">
                <Space.Compact block>
                  <InputNumber
                    aria-label="Special day multiplier"
                    min={0}
                    max={10}
                    step={0.25}
                    value={specialDayRate}
                    onChange={(v) => setSpecialDayRateOverride(v ?? 0)}
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
              the matching weekday, weekend, normal-holiday, or special-day
              multiplier. Remarks determine holiday rates; recorded breaks are
              excluded.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  blurred = false,
}: {
  label: string;
  value: string;
  blurred?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 min-w-0 text-[clamp(0.7rem,2.8vw,0.875rem)] font-semibold tabular-nums text-slate-900 [overflow-wrap:anywhere]">
        <AmountMask visible={!blurred}>{value}</AmountMask>
      </dd>
    </div>
  );
}

function AmountMask({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      aria-hidden={!visible}
      className={
        visible
          ? "transition-all duration-200"
          : "inline-block select-none rounded bg-slate-100 px-1 text-slate-600 blur-[10px] transition-all duration-200"
      }
    >
      {children}
    </span>
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
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={`grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,150px)] items-center gap-3 ${className ?? ""}`}>
      <span id={id} className="text-sm text-slate-700">
        {label}
      </span>
      <div aria-labelledby={id} className="min-w-0">{children}</div>
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
  weekdayRate,
  normalHolidayRate,
  weekendRate,
  specialDayRate,
  currency,
  amountsVisible,
}: {
  record: IRecordResponse;
  minutes: number;
  pay: number;
  weekdayRate: number;
  normalHolidayRate: number;
  weekendRate: number;
  specialDayRate: number;
  currency: string;
  amountsVisible: boolean;
}) {
  const inProgress = record.totalMinutes === null;
  const dayType = getRecordDayType(record);

  const chips = dayType === "specialDay" ? (
    <>
      <Chip tone="high">Special day {specialDayRate}×</Chip>
      {inProgress && <Chip tone="muted">In progress</Chip>}
    </>
  ) : dayType === "normalHoliday" ? (
    <>
      <Chip tone="high">Normal holiday {normalHolidayRate}×</Chip>
      {inProgress && <Chip tone="muted">In progress</Chip>}
    </>
  ) : inProgress ? (
    <Chip tone="muted">In progress</Chip>
  ) : dayType === "weekend" ? (
    <Chip tone="weekend">Weekend {weekendRate}×</Chip>
  ) : (
    <Chip tone="base">Weekday {weekdayRate}×</Chip>
  );

  return (
    <li className="grid min-w-0 grid-cols-1 items-start gap-x-4 gap-y-2 px-4 py-4 transition-colors hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_minmax(0,40%)] sm:px-5">
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

      <div className="flex min-w-0 items-baseline justify-between gap-2 border-t border-slate-100 pt-2 text-right sm:block sm:border-0 sm:pt-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:hidden">
          Estimated pay
        </p>
        <p
          className={`min-w-0 text-xs font-semibold tabular-nums [overflow-wrap:anywhere] sm:text-sm ${inProgress ? "text-slate-400" : "text-slate-900"}`}
        >
          <AmountMask visible={amountsVisible}>
            {inProgress ? "—" : formatMoney(pay, currency)}
          </AmountMask>
        </p>
      </div>
    </li>
  );
}
