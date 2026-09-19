"use client";

import recordService from "@/services/record.service";
import { PaginationRequest } from "@/shares/types/paginationRquest";
import { useQuery } from "@tanstack/react-query";

export const useRecords = (request: PaginationRequest) => {
  return useQuery({
    queryKey: ["ot-records", request.page, request.pageSize],
    queryFn: () => recordService.getRecords(request),
  });
};
