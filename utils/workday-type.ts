import type {
  IRecordResponse,
  WorkDaySelection,
} from "@/shares/dtos/record/recordResponse";

export type RemarkDayType = "normalHoliday" | "specialDay";

export const getRemarkDayType = (
  note: string | null | undefined,
): RemarkDayType | null => {
  if (/\bspecial[\s_-]+day\b/i.test(note ?? "")) return "specialDay";
  if (/\bnormal[\s_-]+holiday\b/i.test(note ?? "")) return "normalHoliday";
  return null;
};

export const getRecordDayType = (
  record: Pick<IRecordResponse, "note" | "workDate"> &
    Partial<Pick<IRecordResponse, "dayType">>,
): RemarkDayType | "weekend" | "weekday" => {
  const remarkType = getRemarkDayType(record.note);
  if (remarkType) return remarkType;

  const dayType: WorkDaySelection = record.dayType ?? "NORMAL";
  if (dayType === "SPECIAL_DAY") return "specialDay";
  if (dayType === "NORMAL_HOLIDAY") return "normalHoliday";

  const weekday = new Date(`${record.workDate}T00:00:00Z`).getUTCDay();
  return weekday === 0 || weekday === 6 ? "weekend" : "weekday";
};
