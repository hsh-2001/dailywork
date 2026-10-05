import { getCurrentAuthUser } from "@/lib/auth/current-user";
import {
  deleteOTRecordDraft,
  getOTRecordDraft,
} from "@/services/ot-record-cache.server";
import type { IRecordDraft } from "@/shares/dtos/record/recordDraft";
import { ApiResponse } from "@/shares/types/apiResponse";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return ApiResponse.failed("Authentication required", "UNAUTHORIZED", 401);
    const draftId = req.nextUrl.pathname.split("/").at(-1);
    if (!draftId) return ApiResponse.failed("Draft ID is required", "INVALID_INPUT", 400);

    const draft = await getOTRecordDraft(user.id, draftId);
    if (!draft) return ApiResponse.failed("OT draft not found", "NOT_FOUND", 404);
    return ApiResponse.success(JSON.parse(draft) as IRecordDraft, "OT draft retrieved successfully");
  } catch (error) {
    console.error("Unable to retrieve OT record draft", error);
    return ApiResponse.failed("Unable to access OT drafts in Redis", "REDIS_ERROR", 503);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return ApiResponse.failed("Authentication required", "UNAUTHORIZED", 401);
    const draftId = req.nextUrl.pathname.split("/").at(-1);
    if (!draftId) return ApiResponse.failed("Draft ID is required", "INVALID_INPUT", 400);

    const draft = await getOTRecordDraft(user.id, draftId);
    if (!draft) return ApiResponse.failed("OT draft not found", "NOT_FOUND", 404);
    await deleteOTRecordDraft(user.id, draftId);
    return ApiResponse.success({ id: draftId }, "OT draft deleted successfully");
  } catch (error) {
    console.error("Unable to delete OT record draft", error);
    return ApiResponse.failed("Unable to update OT drafts in Redis", "REDIS_ERROR", 503);
  }
}
