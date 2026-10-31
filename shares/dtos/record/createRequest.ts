import type { WorkDaySelection } from "@/shares/dtos/record/recordResponse";

export interface ICreateRecordRequest {
  workDate: string;
  startTime: string;
  endTime?: string | null;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  project?: string;
  task?: string;
  note?: string;
  dayType?: WorkDaySelection;
  bookingStatus?: "PENDING" | "BOOKED" | "CANCELLED";
  submitStatus?: "NOT_SUBMITTED" | "SUBMITTED" | "APPROVED" | "REJECTED";
}
