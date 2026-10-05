"use client";

import recordService from "@/services/record.service";
import { ICreateRecordRequest } from "@/shares/dtos/record/createRequest";
import type { RecordFilters } from "@/shares/dtos/record/recordFilters";
import type { UpdateRecordStatusesRequest } from "@/shares/dtos/record/updateRecordStatusesRequest";
import { PaginationRequest } from "@/shares/types/paginationRquest";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export const useRecords = (request: PaginationRequest & RecordFilters) => {
  return useQuery({
    queryKey: ["ot-records", request],
    queryFn: () => recordService.getRecords(request),
    placeholderData: keepPreviousData,
  });
};

export const useCreateRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ICreateRecordRequest) => recordService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ot-records"] });
    },
  });
};

export const useRecordDrafts = () => {
  return useQuery({
    queryKey: ["ot-record-drafts"],
    queryFn: () => recordService.getDrafts(),
  });
};

export const useRecordDraft = (id?: string) => {
  return useQuery({
    queryKey: ["ot-record-drafts", id],
    queryFn: () => {
      if (!id) throw new Error("A draft ID is required");
      return recordService.getDraft(id);
    },
    enabled: Boolean(id),
  });
};

export const useCreateRecordDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ICreateRecordRequest) => recordService.createDraft(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ot-record-drafts"] }),
  });
};

export const useDeleteRecordDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recordService.deleteDraft(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ot-record-drafts"] }),
  });
};

export const useFinishRecordDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ICreateRecordRequest }) =>
      recordService.finishDraft(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ot-record-drafts"] });
      queryClient.invalidateQueries({ queryKey: ["ot-records"] });
    },
  });
};

export const useUpdateRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ICreateRecordRequest }) =>
      recordService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ot-records"] });
    },
  });
};

export const useUpdateRecordStatuses = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: UpdateRecordStatusesRequest) =>
      recordService.updateStatuses(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ot-records"] });
    },
  });
};

export const useDeleteRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => recordService.deleteRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ot-records"] });
    },
  });
};
