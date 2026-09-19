import { NextRequest } from "next/server";

export interface PaginationParams {
  page: number;
  pageSize: number;
  offset: number;
}

export function getPagination(
  req: NextRequest,
  defaultPageSize = 10,
  maxPageSize = 100,
): PaginationParams {
  const { searchParams } = new URL(req.url);

  const page = Math.max(Number(searchParams.get("page")) || 1, 1);

  const pageSize = Math.min(
    Math.max(Number(searchParams.get("pageSize")) || defaultPageSize, 1),
    maxPageSize,
  );

  const offset = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    offset,
  };
}
