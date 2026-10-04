export interface INoteResponse {
  id: number;
  title: string;
  content: string;
  deadline: string | null;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface INoteRequest {
  title: string;
  content: string;
  deadline?: string | null;
}
