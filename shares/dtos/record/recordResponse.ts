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
