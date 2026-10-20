import "server-only";

import db from "@/db/db";
import { otRecordTable } from "@/db/tables/ot_records";
import type { IRecordPageResponse } from "@/shares/dtos/record/recordResponse";
import type { RecordFilters } from "@/shares/dtos/record/recordFilters";
import type { PaginationRequest } from "@/shares/types/paginationRquest";
import { and, count, desc, eq, gte, ilike, lte, sum } from "drizzle-orm";
import {
  getCachedOTRecordPage,
  getOTRecordCacheVersion,
  setCachedOTRecordPage,
} from "@/services/ot-record-cache.server";

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

  const query = JSON.stringify({
    page,
    pageSize,
    dateFrom: request.dateFrom ?? "",
    dateTo: request.dateTo ?? "",
    project: request.project?.trim() ?? "",
    bookingStatus: request.bookingStatus ?? "",
    submitStatus: request.submitStatus ?? "",
  });

  let cacheVersion: string | undefined;
  try {
    cacheVersion = await getOTRecordCacheVersion(userId);
    const cached = await getCachedOTRecordPage<IRecordPageResponse>(userId, cacheVersion, query);
    if (cached) return cached;
  } catch (error) {
    console.error("Unable to read OT record Redis cache", error);
  }

  const where = and(...filters);
  const records = await db
    .select()
    .from(otRecordTable)
    .where(where)
    .orderBy(desc(otRecordTable.workDate))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const [{ total, totalMinutes }] = await db
    .select({ total: count(), totalMinutes: sum(otRecordTable.totalMinutes) })
    .from(otRecordTable)
    .where(where);
  const datedDurations = await db
    .select({
      workDate: otRecordTable.workDate,
      totalMinutes: otRecordTable.totalMinutes,
      breakStartTime: otRecordTable.breakStartTime,
      breakEndTime: otRecordTable.breakEndTime,
    })
    .from(otRecordTable)
    .where(where)
    .orderBy(desc(otRecordTable.workDate));
  const weekdayMinutes = Array.from({ length: 7 }, () => 0);
  const weekdayBreakMinutes = Array.from({ length: 7 }, () => 0);
  for (const record of datedDurations) {
    const date = new Date(`${record.workDate}T00:00:00Z`);
    const mondayIndex = (date.getUTCDay() + 6) % 7;
    if (record.totalMinutes !== null) weekdayMinutes[mondayIndex] += record.totalMinutes;
    if (record.breakStartTime && record.breakEndTime) {
      weekdayBreakMinutes[mondayIndex] += Math.max(
        0,
        Math.floor((record.breakEndTime.getTime() - record.breakStartTime.getTime()) / 60_000),
      );
    }
  }

  const result: IRecordPageResponse = {
    data: records.map((record) => ({
      id: record.id,
      workDate: record.workDate,
      startTime: record.startTime.toISOString(),
      endTime: record.endTime?.toISOString() ?? null,
      totalMinutes: record.totalMinutes,
      breakStartTime: record.breakStartTime?.toISOString() ?? null,
      breakEndTime: record.breakEndTime?.toISOString() ?? null,
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
    summary: {
      totalMinutes: totalMinutes === null ? 0 : Number(totalMinutes),
      weekdays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        .map((day, index) => ({
          day,
          totalMinutes: weekdayMinutes[index],
          breakMinutes: weekdayBreakMinutes[index],
        })),
    },
  };

  if (cacheVersion !== undefined) {
    try {
      await setCachedOTRecordPage(userId, cacheVersion, query, result);
    } catch (error) {
      console.error("Unable to write OT record Redis cache", error);
    }
  }

  return result;
}
