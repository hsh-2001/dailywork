export interface ICreateRecordRequest {
  workDate: string;
  startTime: string;
  endTime: string;
  project?: string;
  task?: string;
  note?: string;
}
