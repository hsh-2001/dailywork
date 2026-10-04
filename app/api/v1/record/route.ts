import db from "@/db/db";
import { otRecordTable } from "@/db/tables/ot_records";
import {
  getCurrentAuthUser,
  syncAuthUserRecord,
} from "@/lib/auth/current-user";
import {
  ApiPageResponse,
  ApiResponse,
  Pagination,
} from "../../../../shares/types/apiResponse";
import { and, count, desc, eq, gte, ilike, lte } from "drizzle-orm";
import { getPagination } from "../../utils/pagination";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return ApiResponse.failed("Authentication required", "UNAUTHORIZED", 401);

    const { page, pageSize, offset } = getPagination(req);
    const params = req.nextUrl.searchParams;
    const dateFrom = params.get("dateFrom") || "";
    const dateTo = params.get("dateTo") || "";
    const project = params.get("project")?.trim() ?? "";
    const bookingStatus = params.get("bookingStatus") ?? "";
    const submitStatus = params.get("submitStatus") ?? "";

    if ((dateFrom && !/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) ||
      (dateTo && !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) ||
      (dateFrom && Number.isNaN(Date.parse(`${dateFrom}T00:00:00Z`))) ||
      (dateTo && Number.isNaN(Date.parse(`${dateTo}T00:00:00Z`))) ||
      (dateFrom && dateTo && dateFrom > dateTo)) {
      return ApiResponse.failed("Invalid work date range", "INVALID_INPUT", 400);
    }
    if ((bookingStatus && !["PENDING", "BOOKED", "CANCELLED"].includes(bookingStatus)) ||
      (submitStatus && !["NOT_SUBMITTED", "SUBMITTED", "APPROVED", "REJECTED"].includes(submitStatus))) {
      return ApiResponse.failed("Invalid work log status filter", "INVALID_INPUT", 400);
    }

    const filters = [eq(otRecordTable.userId, user.id)];
    if (dateFrom) filters.push(gte(otRecordTable.workDate, dateFrom));
    if (dateTo) filters.push(lte(otRecordTable.workDate, dateTo));
    if (project) filters.push(ilike(otRecordTable.project, `%${project}%`));
    if (bookingStatus) filters.push(eq(otRecordTable.bookingStatus, bookingStatus));
    if (submitStatus) filters.push(eq(otRecordTable.submitStatus, submitStatus));
    const where = and(...filters);

    const records = await db
      .select()
      .from(otRecordTable)
      .where(where)
      .orderBy(desc(otRecordTable.workDate))
      .limit(pageSize)
      .offset(offset);

    const [{ total }] = await db
      .select({
        total: count(),
      })
      .from(otRecordTable)
      .where(where);

    const totalPages = Math.ceil(total / pageSize);

    const pagination: Pagination = {
      page,
      pageSize,
      total,
      totalPages,
    };

    return ApiPageResponse.success(
      records,
      pagination,
      "Records retrieved successfully",
    );
  } catch (error) {
    console.error("Error fetching records:", error);

    return ApiResponse.failed("Failed to retrieve records", "DB_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return ApiResponse.failed("Authentication required", "UNAUTHORIZED", 401);

    const body = await req.json();

    const { workDate, startTime, endTime, project, task, note } = body;
    const bookingStatus = body.bookingStatus ?? "PENDING";
    const submitStatus = body.submitStatus ?? "NOT_SUBMITTED";

    if (!workDate || !startTime || !endTime) {
      return ApiResponse.failed(
        "Work date, start time and end time are required",
        "INVALID_INPUT",
        400,
      );
    }
    if (!["PENDING", "BOOKED", "CANCELLED"].includes(bookingStatus) ||
      !["NOT_SUBMITTED", "SUBMITTED", "APPROVED", "REJECTED"].includes(submitStatus)) {
      return ApiResponse.failed("Invalid booking or submit status", "INVALID_INPUT", 400);
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return ApiResponse.failed(
        "Invalid start time or end time",
        "INVALID_DATE",
        400,
      );
    }

    if (end <= start) {
      return ApiResponse.failed(
        "End time must be after start time",
        "INVALID_TIME_RANGE",
        400,
      );
    }

    const totalMinutes = Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60),
    );

    await syncAuthUserRecord(user);

    const result = await db
      .insert(otRecordTable)
      .values({
        userId: user.id,
        workDate: workDate,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        totalMinutes: totalMinutes,
        project: project ?? null,
        task: task ?? null,
        note: note ?? null,
        bookingStatus,
        submitStatus,
      })
      .returning();

    return ApiResponse.success(result[0], "Record created successfully");
  } catch (error) {
    console.error("Error creating record:", error);

    return ApiResponse.failed("Failed to create record", "DB_ERROR", 500);
  }
}
