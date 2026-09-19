export interface IRecordResponse {
  id: number;
  workDate: string;
  startTime: string;
  endTime: string;
  totalMinutes: number | null;
  project: string | null;
  task: string | null;
  note: string | null;
}
