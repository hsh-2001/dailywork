import dayjs from "dayjs";
import type { IRecordResponse } from "@/shares/dtos/record/recordResponse";
import { getRecordDayType } from "@/utils/workday-type";

export type BonusRates = {
  weekday: number;
  normalHoliday: number;
  weekend: number;
  specialDay: number;
};

type BonusParts = {
  weekday: number;
  normalHoliday: number;
  weekend: number;
  specialDay: number;
};

const EMPTY_PARTS: BonusParts = {
  weekday: 0,
  normalHoliday: 0,
  weekend: 0,
  specialDay: 0,
};

const intersectsMinutes = (start: number, end: number, clipStart: number, clipEnd: number) =>
  Math.max(0, Math.min(end, clipEnd) - Math.max(start, clipStart)) / 60_000;

export function calculateRecordBonus(record: IRecordResponse, rates: BonusRates) {
  const none = { minutes: 0, multiplied: 0, parts: EMPTY_PARTS };
  if (!record.endTime || record.totalMinutes === null) return none;
  const start = dayjs(record.startTime).valueOf();
  const end = dayjs(record.endTime).valueOf();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return none;

  const breakStart = record.breakStartTime ? dayjs(record.breakStartTime).valueOf() : null;
  const breakEnd = record.breakEndTime ? dayjs(record.breakEndTime).valueOf() : null;
  const unpaid = (a: number, b: number) =>
    breakStart !== null && breakEnd !== null
      ? intersectsMinutes(start, end, Math.max(a, breakStart), Math.min(b, breakEnd))
      : 0;

  const minutes = Math.max(0, intersectsMinutes(start, end, start, end) - unpaid(start, end));
  const dayType = getRecordDayType(record);
  const multiplier = rates[dayType];
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

export function formatBonusMoney(amount: number, currency: string) {
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
}
