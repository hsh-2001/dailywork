import db from "@/db/db";
import { otRecordTable } from "@/db/tables/ot_records";
import { getCurrentAuthUser } from "@/lib/auth/current-user";
import {
  getOTRecordDrafts,
  saveOTRecordDraft,
} from "@/services/ot-record-cache.server";
import type { IRecordDraft } from "@/shares/dtos/record/recordDraft";
import { ApiResponse } from "@/shares/types/apiResponse";
import type { BookingStatus, SubmitStatus } from "@/shares/dtos/record/recordResponse";
import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { isValidWorkDate } from "../record-errors";

const bookingStatuses: BookingStatus[] = ["PENDING", "BOOKED", "CANCELLED"];
const submitStatuses: SubmitStatus[] = ["NOT_SUBMITTED", "SUBMITTED", "APPROVED", "REJECTED"];

export async function GET() {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return ApiResponse.failed("Authentication required", "UNAUTHORIZED", 401);

    const drafts = await getOTRecordDrafts(user.id);
    const data = Object.values(drafts)
      .map((value) => JSON.parse(value) as IRecordDraft)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    return ApiResponse.success(data, "Work log drafts retrieved successfully");
  } catch (error) {
    console.error("Unable to retrieve OT record drafts", error);
    return ApiResponse.failed("Unable to access OT drafts in Redis", "REDIS_ERROR", 503);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return ApiResponse.failed("Authentication required", "UNAUTHORIZED", 401);

    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return ApiResponse.failed("A work log draft object is required", "INVALID_INPUT", 400);
    }

    const draftInput = body as Record<string, unknown>;
    const { workDate, startTime } = draftInput;
    const bookingStatus = draftInput.bookingStatus ?? "PENDING";
    const submitStatus = draftInput.submitStatus ?? "NOT_SUBMITTED";
    if (
      typeof workDate !== "string" ||
      !isValidWorkDate(workDate) ||
      typeof startTime !== "string" ||
      Number.isNaN(Date.parse(startTime))
    ) {
      return ApiResponse.failed("A valid work date and start time are required", "INVALID_INPUT", 400);
    }
    if (
      typeof bookingStatus !== "string" ||
      !bookingStatuses.includes(bookingStatus as BookingStatus) ||
      typeof submitStatus !== "string" ||
      !submitStatuses.includes(submitStatus as SubmitStatus)
    ) {
      return ApiResponse.failed("Invalid booking or submit status", "INVALID_INPUT", 400);
    }

    let existingRecord: { id: number }[];
    try {
      existingRecord = await db
        .select({ id: otRecordTable.id })
        .from(otRecordTable)
        .where(and(eq(otRecordTable.userId, user.id), eq(otRecordTable.workDate, workDate)))
        .limit(1);
    } catch (error) {
      console.error("Unable to check existing work logs before creating draft", error);
      return ApiResponse.failed("Unable to check existing work logs", "DB_ERROR", 500);
    }
    if (existingRecord.length > 0) {
      return ApiResponse.failed("A work log already exists for this date.", "DUPLICATE_WORK_DATE", 409);
    }

    const draft: IRecordDraft = {
      id: randomUUID(),
      workDate,
      startTime: new Date(startTime).toISOString(),
      project: typeof draftInput.project === "string" ? draftInput.project : null,
      task: typeof draftInput.task === "string" ? draftInput.task : null,
      note: typeof draftInput.note === "string" ? draftInput.note : null,
      bookingStatus: bookingStatus as BookingStatus,
      submitStatus: submitStatus as SubmitStatus,
      createdAt: new Date().toISOString(),
    };

    try {
      const existingDrafts = await getOTRecordDrafts(user.id);
      if (Object.values(existingDrafts).some((value) => {
        const existingDraft = JSON.parse(value) as IRecordDraft;
        return existingDraft.workDate === workDate;
      })) {
        return ApiResponse.failed("An unfinished OT draft already exists for this date.", "DUPLICATE_WORK_DATE", 409);
      }

      await saveOTRecordDraft(user.id, draft.id, JSON.stringify(draft));
      return ApiResponse.success(draft, "OT draft started successfully");
    } catch (error) {
      console.error("Unable to store OT record draft in Redis", error);
      return ApiResponse.failed("Unable to save OT draft in Redis", "REDIS_ERROR", 503);
    }
  } catch (error) {
    console.error("Unable to process OT record draft request", error);
    return ApiResponse.failed("Unable to process OT draft request", "INVALID_INPUT", 400);
  }
}
