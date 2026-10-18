export interface INoteResponse {
  id: number;
  title: string;
  content: string;
  deadline: string | null;
  status: NoteStatus;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NoteStatus = "ACTIVE" | "COMPLETED";

export interface INoteRequest {
  title: string;
  content: string;
  deadline?: string | null;
}
