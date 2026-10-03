import db from "@/db/db";
import { notesTable } from "@/db/tables/notes";
import {
  getCurrentAuthUser,
  syncAuthUserRecord,
} from "@/lib/auth/current-user";
import { ApiResponse } from "@/shares/types/apiResponse";
import { asc, desc, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { parseNoteRequest } from "./validation";

export async function GET() {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return ApiResponse.failed("Authentication required", "UNAUTHORIZED", 401);

    const notes = await db
      .select()
      .from(notesTable)
      .where(eq(notesTable.userId, user.id))
      .orderBy(desc(notesTable.pinned), desc(notesTable.updatedAt), asc(notesTable.title));

    return ApiResponse.success(notes, "Notes retrieved successfully");
  } catch (error) {
    console.error("Error fetching notes:", error);
    return ApiResponse.failed("Failed to retrieve notes", "DB_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return ApiResponse.failed("Authentication required", "UNAUTHORIZED", 401);

    const note = parseNoteRequest(await request.json());
    if (!note) {
      return ApiResponse.failed(
        "A title of up to 200 characters and note content are required",
        "INVALID_INPUT",
        400,
      );
    }

    await syncAuthUserRecord(user);

    const [created] = await db
      .insert(notesTable)
      .values({ ...note, userId: user.id })
      .returning();

    return ApiResponse.success(created, "Note created successfully");
  } catch (error) {
    console.error("Error creating note:", error);
    return ApiResponse.failed("Failed to create note", "DB_ERROR", 500);
  }
}
