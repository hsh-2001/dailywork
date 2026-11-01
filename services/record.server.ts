import "server-only";

import db from "@/db/db";
import { otRecordTable } from "@/db/tables/ot_records";
import type { IRecordPageResponse } from "@/shares/dtos/record/recordResponse";
import type { RecordFilters } from "@/shares/dtos/record/recordFilters";
import type { PaginationRequest } from "@/shares/types/paginationRquest";
import { and, count, desc, eq, gte, ilike, lte, sql, sum } from "drizzle-orm";

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
  const weekdayExpression = sql<number>`extract(dow from ${otRecordTable.workDate})`;
  const [records, [{ total, totalMinutes }], weekdayTotals] = await Promise.all([
    db
      .select()
      .from(otRecordTable)
      .where(where)
      .orderBy(desc(otRecordTable.workDate))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ total: count(), totalMinutes: sum(otRecordTable.totalMinutes) })
      .from(otRecordTable)
      .where(where),
    db
      .select({
        weekday: weekdayExpression,
        totalMinutes: sum(otRecordTable.totalMinutes),
        breakMinutes: sql<string>`coalesce(sum(greatest(floor(extract(epoch from (${otRecordTable.breakEndTime} - ${otRecordTable.breakStartTime})) / 60), 0)), 0)`,
      })
      .from(otRecordTable)
      .where(where)
      .groupBy(weekdayExpression),
  ]);
  const weekdayValues = new Map(
    weekdayTotals.map(({ weekday, totalMinutes, breakMinutes }) => [
      (Number(weekday) + 6) % 7,
      {
        totalMinutes: Number(totalMinutes ?? 0),
        breakMinutes: Number(breakMinutes ?? 0),
      },
    ]),
  );

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
      dayType: record.dayType as IRecordPageResponse["data"][number]["dayType"],
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
          ...(weekdayValues.get(index) ?? { totalMinutes: 0, breakMinutes: 0 }),
        })),
    },
  };

  return result;
}
