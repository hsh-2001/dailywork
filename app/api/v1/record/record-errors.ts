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
