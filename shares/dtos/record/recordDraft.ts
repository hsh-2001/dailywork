import type { BookingStatus, SubmitStatus } from "@/shares/dtos/record/recordResponse";

export interface IRecordDraft {
  id: string;
  workDate: string;
  startTime: string;
  project: string | null;
  task: string | null;
  note: string | null;
  bookingStatus: BookingStatus;
  submitStatus: SubmitStatus;
  createdAt: string;
}
