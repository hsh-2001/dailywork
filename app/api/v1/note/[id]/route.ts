import db from "@/db/db";
import { notesTable } from "@/db/tables/notes";
import { ApiResponse } from "@/shares/types/apiResponse";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { parseNoteRequest } from "../validation";

type RouteContext = { params: Promise<{ id: string }> };

async function getNoteId(context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const id = await getNoteId(context);
    if (id === null) {
      return ApiResponse.failed("Invalid note ID", "INVALID_INPUT", 400);
    }

    const [note] = await db
      .select()
      .from(notesTable)
      .where(eq(notesTable.id, id))
      .limit(1);

    if (!note) return ApiResponse.failed("Note not found", "NOT_FOUND", 404);
    return ApiResponse.success(note, "Note retrieved successfully");
  } catch (error) {
    console.error("Error fetching note:", error);
    return ApiResponse.failed("Failed to retrieve note", "DB_ERROR", 500);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const id = await getNoteId(context);
    if (id === null) {
      return ApiResponse.failed("Invalid note ID", "INVALID_INPUT", 400);
    }

    const note = parseNoteRequest(await request.json());
    if (!note) {
      return ApiResponse.failed(
        "A title of up to 200 characters and note content are required",
        "INVALID_INPUT",
        400,
      );
    }

    const [updated] = await db
      .update(notesTable)
      .set({ ...note, updatedAt: new Date() })
      .where(eq(notesTable.id, id))
      .returning();

    if (!updated) return ApiResponse.failed("Note not found", "NOT_FOUND", 404);
    return ApiResponse.success(updated, "Note updated successfully");
  } catch (error) {
    console.error("Error updating note:", error);
    return ApiResponse.failed("Failed to update note", "DB_ERROR", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const id = await getNoteId(context);
    if (id === null) {
      return ApiResponse.failed("Invalid note ID", "INVALID_INPUT", 400);
    }

    const [deleted] = await db
      .delete(notesTable)
      .where(eq(notesTable.id, id))
      .returning();

    if (!deleted) return ApiResponse.failed("Note not found", "NOT_FOUND", 404);
    return ApiResponse.success(deleted, "Note deleted successfully");
  } catch (error) {
    console.error("Error deleting note:", error);
    return ApiResponse.failed("Failed to delete note", "DB_ERROR", 500);
  }
}
