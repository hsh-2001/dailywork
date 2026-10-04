import type { BookingStatus, SubmitStatus } from "./recordResponse";

export interface UpdateRecordStatusesRequest {
  ids: number[];
  bookingStatus?: BookingStatus;
  submitStatus?: SubmitStatus;
}
