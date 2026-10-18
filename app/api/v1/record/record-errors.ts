import { ApiResponse } from "@/shares/types/apiResponse";

interface DatabaseError {
  code?: unknown;
  constraint?: unknown;
  cause?: unknown;
}

const isDatabaseError = (error: unknown): error is DatabaseError =>
  typeof error === "object" && error !== null;

export const isDuplicateWorkDateError = (error: unknown): boolean => {
  const seen = new Set<unknown>();
  let current: unknown = error;

  while (isDatabaseError(current) && !seen.has(current)) {
    seen.add(current);
    if (
      current.code === "23505" &&
      current.constraint === "ot_records_user_work_date_unique"
    ) {
      return true;
    }
    current = current.cause;
  }

  return false;
};

export const duplicateWorkDateResponse = () =>
  ApiResponse.failed(
    "A work log already exists for this date.",
    "DUPLICATE_WORK_DATE",
    409,
  );

export const isValidWorkDate = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
};

export const parseBreakInterval = (
  breakStartValue: unknown,
  breakEndValue: unknown,
  start: Date,
  end: Date | null,
) => {
  if ((breakStartValue == null || breakStartValue === "") && (breakEndValue == null || breakEndValue === "")) {
    return { breakStart: null, breakEnd: null, breakMinutes: 0, error: null };
  }
  if (typeof breakStartValue !== "string" || typeof breakEndValue !== "string") {
    return { breakStart: null, breakEnd: null, breakMinutes: 0, error: "Enter both break start and break end times" };
  }
  const breakStart = new Date(breakStartValue);
  const breakEnd = new Date(breakEndValue);
  if (Number.isNaN(breakStart.getTime()) || Number.isNaN(breakEnd.getTime())) {
    return { breakStart: null, breakEnd: null, breakMinutes: 0, error: "Enter valid break start and end times" };
  }
  if (breakStart < start || breakEnd <= breakStart || (end && breakEnd > end)) {
    return { breakStart: null, breakEnd: null, breakMinutes: 0, error: "Break time must fall within the work period" };
  }
  return {
    breakStart,
    breakEnd,
    breakMinutes: Math.floor((breakEnd.getTime() - breakStart.getTime()) / 60_000),
    error: null,
  };
};
