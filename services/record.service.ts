import { PaginationRequest } from "@/shares/types/paginationRquest";
import api from "./api";
import { ICreateRecordRequest } from "@/shares/dtos/record/createRequest";
import type { RecordFilters } from "@/shares/dtos/record/recordFilters";
import type { UpdateRecordStatusesRequest } from "@/shares/dtos/record/updateRecordStatusesRequest";
import type { IRecordPageResponse } from "@/shares/dtos/record/recordResponse";
import type { IRecordDraft } from "@/shares/dtos/record/recordDraft";

const getRecords = async (
  request: PaginationRequest & RecordFilters,
): Promise<IRecordPageResponse> => {
  const response = await api.get("/record", {
    params: {
      page: request.page,
      pageSize: request.pageSize,
      dateFrom: request.dateFrom,
      dateTo: request.dateTo,
      project: request.project,
      bookingStatus: request.bookingStatus,
      submitStatus: request.submitStatus,
    },
  });

  return response.data;
};

const create = async (request: ICreateRecordRequest) => {
  const response = await api.post("/record", request);
  return response.data;
};

const getDrafts = async (): Promise<IRecordDraft[]> => {
  const response = await api.get("/record/drafts");
  return response.data.data;
};

const getDraft = async (id: string): Promise<IRecordDraft> => {
  const response = await api.get(`/record/drafts/${id}`);
  return response.data.data;
};

const createDraft = async (request: ICreateRecordRequest) => {
  const response = await api.post("/record/drafts", request);
  return response.data;
};

const deleteDraft = async (id: string) => {
  const response = await api.delete(`/record/drafts/${id}`);
  return response.data;
};

const finishDraft = async (id: string, request: ICreateRecordRequest) => {
  const response = await api.post(`/record/drafts/${id}/finish`, request);
  return response.data;
};

const deleteRecord = async (id: number) => {
  const response = await api.delete("/record" + `/${id}`);
  return response.data;
};

const update = async (id: number, request: ICreateRecordRequest) => {
  const response = await api.put(`/record/${id}`, request);
  return response.data;
};

const updateStatuses = async (request: UpdateRecordStatusesRequest) => {
  const response = await api.patch("/record", request);
  return response.data;
};

const recordService = {
  getRecords,
  create,
  getDrafts,
  getDraft,
  createDraft,
  deleteDraft,
  finishDraft,
  deleteRecord,
  update,
  updateStatuses,
};

export default recordService;
