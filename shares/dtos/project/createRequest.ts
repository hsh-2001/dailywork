export interface ICreateProjectRequest {
  name: string;
  description?: string | null;
}

export interface IUpdateProjectRequest extends ICreateProjectRequest {
  status: "ACTIVE" | "INACTIVE";
}
