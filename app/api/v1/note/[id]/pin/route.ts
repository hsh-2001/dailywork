import db from "@/db/db";
import { notesTable } from "@/db/tables/notes";
import { ApiResponse } from "@/shares/types/apiResponse";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return ApiResponse.failed("Invalid note ID", "INVALID_INPUT", 400);
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || !("pinned" in body) || typeof body.pinned !== "boolean") {
      return ApiResponse.failed("Pinned must be a boolean", "INVALID_INPUT", 400);
    }

    const [updated] = await db
      .update(notesTable)
      .set({ pinned: body.pinned, updatedAt: new Date() })
      .where(eq(notesTable.id, id))
      .returning();

    if (!updated) return ApiResponse.failed("Note not found", "NOT_FOUND", 404);
    return ApiResponse.success(updated, "Note pin updated successfully");
  } catch (error) {
    console.error("Error updating note pin:", error);
    return ApiResponse.failed("Failed to update note pin", "DB_ERROR", 500);
  }
}
