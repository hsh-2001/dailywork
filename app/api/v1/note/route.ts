import db from "@/db/db";
import { notesTable } from "@/db/tables/notes";
import { ApiResponse } from "@/shares/types/apiResponse";
import { asc, desc } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { parseNoteRequest } from "./validation";

export async function GET() {
  try {
    const notes = await db
      .select()
      .from(notesTable)
      .orderBy(desc(notesTable.pinned), desc(notesTable.updatedAt), asc(notesTable.title));

    return ApiResponse.success(notes, "Notes retrieved successfully");
  } catch (error) {
    console.error("Error fetching notes:", error);
    return ApiResponse.failed("Failed to retrieve notes", "DB_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const note = parseNoteRequest(await request.json());
    if (!note) {
      return ApiResponse.failed(
        "A title of up to 200 characters and note content are required",
        "INVALID_INPUT",
        400,
      );
    }

    const [created] = await db
      .insert(notesTable)
      .values(note)
      .returning();

    return ApiResponse.success(created, "Note created successfully");
  } catch (error) {
    console.error("Error creating note:", error);
    return ApiResponse.failed("Failed to create note", "DB_ERROR", 500);
  }
}
