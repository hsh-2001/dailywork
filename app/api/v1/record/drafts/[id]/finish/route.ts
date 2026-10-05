import db from "@/db/db";
import { otRecordTable } from "@/db/tables/ot_records";
import { getCurrentAuthUser } from "@/lib/auth/current-user";
import {
  deleteOTRecordDraft,
  getOTRecordDraft,
  getOTRecordDrafts,
} from "@/services/ot-record-cache.server";
import { invalidateOTRecordCache } from "@/services/ot-record-cache.server";
import { notifyRecordChange } from "@/services/record-notification.server";
import type { IRecordDraft } from "@/shares/dtos/record/recordDraft";
import type { BookingStatus, SubmitStatus } from "@/shares/dtos/record/recordResponse";
import { ApiResponse } from "@/shares/types/apiResponse";
import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import {
  isValidWorkDate,
  isDuplicateWorkDateError,
  duplicateWorkDateResponse,
} from "../../../record-errors";

const bookingStatuses: BookingStatus[] = ["PENDING", "BOOKED", "CANCELLED"];
const submitStatuses: SubmitStatus[] = ["NOT_SUBMITTED", "SUBMITTED", "APPROVED", "REJECTED"];

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return ApiResponse.failed("Authentication required", "UNAUTHORIZED", 401);

    const draftId = req.nextUrl.pathname.split("/").at(-2);
    if (!draftId) return ApiResponse.failed("Draft ID is required", "INVALID_INPUT", 400);
    let draftValue: string | null;
    try {
      draftValue = await getOTRecordDraft(user.id, draftId);
    } catch (error) {
      console.error("Unable to read OT draft from Redis", error);
      return ApiResponse.failed("Unable to access OT drafts in Redis", "REDIS_ERROR", 503);
    }
    if (!draftValue) return ApiResponse.failed("OT draft not found", "NOT_FOUND", 404);
    const draft = JSON.parse(draftValue) as IRecordDraft;

    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return ApiResponse.failed("A completed work log object is required", "INVALID_INPUT", 400);
    }
    const values = body as Record<string, unknown>;
    const workDate = typeof values.workDate === "string" ? values.workDate : draft.workDate;
    const startTime = typeof values.startTime === "string" ? values.startTime : draft.startTime;
    const endTime = values.endTime;
    const bookingStatus = values.bookingStatus ?? draft.bookingStatus;
    const submitStatus = values.submitStatus ?? draft.submitStatus;

    if (!isValidWorkDate(workDate) || Number.isNaN(Date.parse(startTime))) {
      return ApiResponse.failed("A valid work date and start time are required", "INVALID_INPUT", 400);
    }
    if (typeof endTime !== "string" || Number.isNaN(Date.parse(endTime))) {
      return ApiResponse.failed("A valid end time is required to finish an OT draft", "INVALID_INPUT", 400);
    }
    if (
      typeof bookingStatus !== "string" ||
      !bookingStatuses.includes(bookingStatus as BookingStatus) ||
      typeof submitStatus !== "string" ||
      !submitStatuses.includes(submitStatus as SubmitStatus)
    ) {
      return ApiResponse.failed("Invalid booking or submit status", "INVALID_INPUT", 400);
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      return ApiResponse.failed("End time must be after start time", "INVALID_TIME_RANGE", 400);
    }

    const duplicate = await db
      .select({ id: otRecordTable.id })
      .from(otRecordTable)
      .where(and(eq(otRecordTable.userId, user.id), eq(otRecordTable.workDate, workDate)))
      .limit(1);
    if (duplicate.length > 0) {
      return ApiResponse.failed("A work log already exists for this date.", "DUPLICATE_WORK_DATE", 409);
    }

    let otherDrafts: Record<string, string>;
    try {
      otherDrafts = await getOTRecordDrafts(user.id);
    } catch (error) {
      console.error("Unable to check other OT drafts in Redis", error);
      return ApiResponse.failed("Unable to access OT drafts in Redis", "REDIS_ERROR", 503);
    }
    if (Object.entries(otherDrafts).some(([id, value]) => {
      if (id === draftId) return false;
      const otherDraft = JSON.parse(value) as IRecordDraft;
      return otherDraft.workDate === workDate;
    })) {
      return ApiResponse.failed("Another unfinished OT draft already uses this date.", "DUPLICATE_WORK_DATE", 409);
    }

    const result = await db
      .insert(otRecordTable)
      .values({
        userId: user.id,
        workDate,
        startTime: start,
        endTime: end,
        totalMinutes: Math.floor((end.getTime() - start.getTime()) / 60_000),
        project: values.project === undefined
          ? draft.project
          : typeof values.project === "string" ? values.project : null,
        task: values.task === undefined
          ? draft.task
          : typeof values.task === "string" ? values.task : null,
        note: values.note === undefined
          ? draft.note
          : typeof values.note === "string" ? values.note : null,
        bookingStatus: bookingStatus as BookingStatus,
        submitStatus: submitStatus as SubmitStatus,
      })
      .returning();

    try {
      await deleteOTRecordDraft(user.id, draftId);
    } catch (error) {
      console.error("Unable to remove completed OT draft from Redis", error);
    }
    await invalidateOTRecordCache(user.id);
    notifyRecordChange(result[0], "created");
    return ApiResponse.success(result[0], "OT draft completed successfully");
  } catch (error) {
    if (isDuplicateWorkDateError(error)) return duplicateWorkDateResponse();
    console.error("Unable to finish OT record draft", error);
    return ApiResponse.failed("Unable to finish OT draft", "DB_ERROR", 500);
  }
}
