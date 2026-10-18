import db from "@/db/db";
import { notesTable } from "@/db/tables/notes";
import { getCurrentAuthUser } from "@/lib/auth/current-user";
import { ApiResponse } from "@/shares/types/apiResponse";
import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return ApiResponse.failed("Authentication required", "UNAUTHORIZED", 401);

    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return ApiResponse.failed("Invalid note ID", "INVALID_INPUT", 400);
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || !("status" in body) ||
      (body.status !== "ACTIVE" && body.status !== "COMPLETED")) {
      return ApiResponse.failed("Status must be ACTIVE or COMPLETED", "INVALID_INPUT", 400);
    }

    const [updated] = await db
      .update(notesTable)
      .set({ status: body.status, updatedAt: new Date() })
      .where(and(eq(notesTable.id, id), eq(notesTable.userId, user.id)))
      .returning();

    if (!updated) return ApiResponse.failed("Note not found", "NOT_FOUND", 404);
    return ApiResponse.success(updated, "Note status updated successfully");
  } catch (error) {
    console.error("Error updating note status:", error);
    return ApiResponse.failed("Failed to update note status", "DB_ERROR", 500);
  }
}
