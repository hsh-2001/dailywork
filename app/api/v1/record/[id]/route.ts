import db from "@/db/db";
import { otRecordTable } from "@/db/tables/ot_records";
import { ApiResponse } from "@/shares/types/apiResponse";
import { eq } from "drizzle-orm/sql/expressions/conditions";
import { NextRequest } from "next/dist/server/web/spec-extension/request";

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split("/").pop();
    const body = await req.json();
    const { workDate, startTime, endTime, project, task, note } = body;

    if (!id || !workDate || !startTime || !endTime) {
      return ApiResponse.failed(
        "Record ID, work date, start time and end time are required",
        "INVALID_INPUT",
        400,
      );
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

    const result = await db
      .update(otRecordTable)
      .set({
        workDate: workDate,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        totalMinutes: totalMinutes,
        project: project ?? null,
        task: task ?? null,
        note: note ?? null,
      })
      .where(eq(otRecordTable.id, Number(id)))
      .returning();

    if (result.length === 0) {
      return ApiResponse.failed("Record not found", "NOT_FOUND", 404);
    }

    return ApiResponse.success(result[0], "Record updated successfully");
  } catch (error) {
    console.error("Error updating record:", error);

    return ApiResponse.failed("Failed to update record", "DB_ERROR", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split("/").pop();
    if (!id) {
      return ApiResponse.failed("Record ID is required", "INVALID_INPUT", 400);
    }

    const result = await db
      .delete(otRecordTable)
      .where(eq(otRecordTable.id, Number(id)))
      .returning();

    if (result.length === 0) {
      return ApiResponse.failed("Record not found", "NOT_FOUND", 404);
    }

    return ApiResponse.success(result[0], "Record deleted successfully");
  } catch (error) {
    console.error("Error deleting record:", error);

    return ApiResponse.failed("Failed to delete record", "DB_ERROR", 500);
  }
}
