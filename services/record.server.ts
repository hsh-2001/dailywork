import "server-only";

import db from "@/db/db";
import { otRecordTable } from "@/db/tables/ot_records";
import { getCurrentAuthUser } from "@/lib/auth/current-user";
import type { IRecordPageResponse } from "@/shares/dtos/record/recordResponse";
import type { RecordFilters } from "@/shares/dtos/record/recordFilters";
import type { PaginationRequest } from "@/shares/types/paginationRquest";
import { and, count, desc, eq, gte, ilike, lte } from "drizzle-orm";
import { unstable_rethrow } from "next/navigation";

export async function getUserRecordPage(
  userId: string,
  request: PaginationRequest & RecordFilters,
): Promise<IRecordPageResponse> {
  const page = Math.max(request.page, 1);
  const pageSize = Math.min(Math.max(request.pageSize, 1), 100);
  const filters = [eq(otRecordTable.userId, userId)];

  if (request.dateFrom) filters.push(gte(otRecordTable.workDate, request.dateFrom));
  if (request.dateTo) filters.push(lte(otRecordTable.workDate, request.dateTo));
  if (request.project) filters.push(ilike(otRecordTable.project, `%${request.project.trim()}%`));
  if (request.bookingStatus) {
    filters.push(eq(otRecordTable.bookingStatus, request.bookingStatus));
  }
  if (request.submitStatus) {
    filters.push(eq(otRecordTable.submitStatus, request.submitStatus));
  }

  const where = and(...filters);
  const records = await db
    .select()
    .from(otRecordTable)
    .where(where)
    .orderBy(desc(otRecordTable.workDate))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const [{ total }] = await db
    .select({ total: count() })
    .from(otRecordTable)
    .where(where);

  return {
    data: records.map((record) => ({
      id: record.id,
      workDate: record.workDate,
      startTime: record.startTime.toISOString(),
      endTime: record.endTime?.toISOString() ?? null,
      totalMinutes: record.totalMinutes,
      project: record.project,
      task: record.task,
      note: record.note,
      bookingStatus: record.bookingStatus as IRecordPageResponse["data"][number]["bookingStatus"],
      submitStatus: record.submitStatus as IRecordPageResponse["data"][number]["submitStatus"],
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getInitialUserRecordPage(
  pageSize: number,
): Promise<IRecordPageResponse | undefined> {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return undefined;
    return await getUserRecordPage(user.id, { page: 1, pageSize });
  } catch (error) {
    unstable_rethrow(error);
    console.error("Unable to load initial work logs", error);
    return undefined;
  }
}
