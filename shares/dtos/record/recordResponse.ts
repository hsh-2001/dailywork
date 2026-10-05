import type { Pagination } from "@/shares/types/apiResponse";

export type BookingStatus = "PENDING" | "BOOKED" | "CANCELLED";
export type SubmitStatus = "NOT_SUBMITTED" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface IRecordResponse {
  id: number;
  workDate: string;
  startTime: string;
  endTime: string;
  totalMinutes: number | null;
  project: string | null;
  task: string | null;
  note: string | null;
  bookingStatus: BookingStatus;
  submitStatus: SubmitStatus;
}

export interface IRecordPageResponse {
  data: IRecordResponse[];
  pagination: Pagination;
}
