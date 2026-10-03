export interface INoteResponse {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface INoteRequest {
  title: string;
  content: string;
}
