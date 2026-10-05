export interface ICreateRecordRequest {
  workDate: string;
  startTime: string;
  endTime?: string | null;
  project?: string;
  task?: string;
  note?: string;
  bookingStatus?: "PENDING" | "BOOKED" | "CANCELLED";
  submitStatus?: "NOT_SUBMITTED" | "SUBMITTED" | "APPROVED" | "REJECTED";
}
