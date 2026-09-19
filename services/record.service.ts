import { PaginationRequest } from "@/shares/types/paginationRquest";
import api from "./api";
import { ICreateRecordRequest } from "@/shares/dtos/record/createRequest";

const getRecords = async (request: PaginationRequest) => {
  const response = await api.get("/record", {
    params: {
      page: request.page,
      pageSize: request.pageSize,
    },
  });

  return response.data;
};

const create = async (request: ICreateRecordRequest) => {
  const response = await api.post("/record", request);
  return response.data;
};

const recordService = {
  getRecords,
  create,
};

export default recordService;
