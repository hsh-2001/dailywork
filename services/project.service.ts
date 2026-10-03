import { ICreateProjectRequest, IUpdateProjectRequest } from "@/shares/dtos/project/createRequest";
import api from "./api";

const getProjects = async () => {
  const response = await api.get("/project");
  return response.data;
};

const create = async (request: ICreateProjectRequest) => {
  const response = await api.post("/project", request);
  return response.data;
};

const update = async (id: number, request: IUpdateProjectRequest) => {
  const response = await api.put(`/project/${id}`, request);
  return response.data;
};

const projectService = { getProjects, create, update };

export default projectService;
