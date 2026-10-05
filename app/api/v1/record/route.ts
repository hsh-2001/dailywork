import db from "@/db/db";
import { otRecordTable } from "@/db/tables/ot_records";
import { getCurrentAuthUser } from "@/lib/auth/current-user";
import { getUserRecordPage } from "@/services/record.server";
import { notifyRecordChange } from "@/services/record-notification.server";
import { invalidateOTRecordCache } from "@/services/ot-record-cache.server";
import {
  ApiPageResponse,
  ApiResponse,
} from "../../../../shares/types/apiResponse";
import { and, eq, inArray } from "drizzle-orm";
import { getPagination } from "../../utils/pagination";
import { NextRequest } from "next/server";
import {
  duplicateWorkDateResponse,
  isDuplicateWorkDateError,
  isValidWorkDate,
} from "./record-errors";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return ApiResponse.failed("Authentication required", "UNAUTHORIZED", 401);

    const { page, pageSize } = getPagination(req);
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

    const recordPage = await getUserRecordPage(user.id, {
      page,
      pageSize,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      project,
      bookingStatus,
      submitStatus,
    });

    return ApiPageResponse.success(
      recordPage.data,
      recordPage.pagination,
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

    if (!workDate || !startTime) {
      return ApiResponse.failed(
        "Work date and start time are required",
        "INVALID_INPUT",
        400,
      );
    }
    if (!isValidWorkDate(workDate)) {
      return ApiResponse.failed("Invalid work date", "INVALID_DATE", 400);
    }

    if (!["PENDING", "BOOKED", "CANCELLED"].includes(bookingStatus) ||
      !["NOT_SUBMITTED", "SUBMITTED", "APPROVED", "REJECTED"].includes(submitStatus)) {
      return ApiResponse.failed("Invalid booking or submit status", "INVALID_INPUT", 400);
    }

    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : null;

    if (isNaN(start.getTime()) || (end && isNaN(end.getTime()))) {
      return ApiResponse.failed(
        "Invalid start time or end time",
        "INVALID_DATE",
        400,
      );
    }

    if (end && end <= start) {
      return ApiResponse.failed(
        "End time must be after start time",
        "INVALID_TIME_RANGE",
        400,
      );
    }

    const totalMinutes = end
      ? Math.floor((end.getTime() - start.getTime()) / (1000 * 60))
      : null;

    const existingRecord = await db
      .select({ id: otRecordTable.id })
      .from(otRecordTable)
      .where(and(eq(otRecordTable.userId, user.id), eq(otRecordTable.workDate, workDate)))
      .limit(1);
    if (existingRecord.length > 0) return duplicateWorkDateResponse();

    const result = await db
      .insert(otRecordTable)
      .values({
        userId: user.id,
        workDate: workDate,
        startTime: new Date(startTime),
        endTime: end,
        totalMinutes: totalMinutes,
        project: project ?? null,
        task: task ?? null,
        note: note ?? null,
        bookingStatus,
        submitStatus,
      })
      .returning();

    await invalidateOTRecordCache(user.id);
    notifyRecordChange(result[0], "created");

    return ApiResponse.success(result[0], "Record created successfully");
  } catch (error) {
    if (isDuplicateWorkDateError(error)) return duplicateWorkDateResponse();
    console.error("Error creating record:", error);

    return ApiResponse.failed("Failed to create record", "DB_ERROR", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return ApiResponse.failed("Authentication required", "UNAUTHORIZED", 401);

    const body = await req.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return ApiResponse.failed("A record status update object is required", "INVALID_INPUT", 400);
    }
    const { ids, bookingStatus, submitStatus } = body;
    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      ids.length > 100 ||
      ids.some((id: unknown) => typeof id !== "number" || !Number.isInteger(id) || id <= 0) ||
      new Set(ids).size !== ids.length
    ) {
      return ApiResponse.failed("Record IDs must be a unique list of 1 to 100 positive integers", "INVALID_INPUT", 400);
    }
    if (bookingStatus === undefined && submitStatus === undefined) {
      return ApiResponse.failed("At least one status must be provided", "INVALID_INPUT", 400);
    }
    if (
      (bookingStatus !== undefined && !["PENDING", "BOOKED", "CANCELLED"].includes(bookingStatus)) ||
      (submitStatus !== undefined && !["NOT_SUBMITTED", "SUBMITTED", "APPROVED", "REJECTED"].includes(submitStatus))
    ) {
      return ApiResponse.failed("Invalid booking or submit status", "INVALID_INPUT", 400);
    }

    const statuses: {
      bookingStatus?: "PENDING" | "BOOKED" | "CANCELLED";
      submitStatus?: "NOT_SUBMITTED" | "SUBMITTED" | "APPROVED" | "REJECTED";
    } = {};
    if (bookingStatus !== undefined) statuses.bookingStatus = bookingStatus;
    if (submitStatus !== undefined) statuses.submitStatus = submitStatus;

    const records = await db
      .update(otRecordTable)
      .set(statuses)
      .where(and(eq(otRecordTable.userId, user.id), inArray(otRecordTable.id, ids)))
      .returning({ id: otRecordTable.id });

    if (records.length > 0) await invalidateOTRecordCache(user.id);

    return ApiResponse.success(
      { updatedCount: records.length },
      "Record statuses updated successfully",
    );
  } catch (error) {
    console.error("Error updating record statuses:", error);
    return ApiResponse.failed("Failed to update record statuses", "DB_ERROR", 500);
  }
}
