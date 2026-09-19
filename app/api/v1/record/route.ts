"use server";

import db from "@/db/db";
import { otRecordTable } from "@/db/tables/ot_records";
import {
  ApiPageResponse,
  ApiResponse,
  Pagination,
} from "../../../../shares/types/apiResponse";
import { count, desc, eq } from "drizzle-orm";
import { getPagination } from "../../utils/pagination";
import { NextRequest } from "next/server";
import { id } from "zod/v4/locales/index.js";

export async function GET(req: NextRequest) {
  try {
    const { page, pageSize, offset } = getPagination(req);

    const records = await db
      .select()
      .from(otRecordTable)
      .orderBy(desc(otRecordTable.workDate))
      .limit(pageSize)
      .offset(offset);

    const [{ total }] = await db
      .select({
        total: count(),
      })
      .from(otRecordTable);

    const totalPages = Math.ceil(total / pageSize);

    const pagination: Pagination = {
      page,
      pageSize,
      total,
      totalPages,
    };

    return ApiPageResponse.success(
      records,
      pagination,
      "Records retrieved successfully",
    );
  } catch (error) {
    console.error("Error fetching records:", error);

    return ApiResponse.failed("Failed to retrieve records", "DB_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { workDate, startTime, endTime, project, task, note } = body;
    console.log(body);

    if (!workDate || !startTime || !endTime) {
      return ApiResponse.failed(
        "Work date, start time and end time are required",
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
      .insert(otRecordTable)
      .values({
        workDate: workDate,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        totalMinutes: totalMinutes,
        project: project ?? null,
        task: task ?? null,
        note: note ?? null,
      })
      .returning();

    return ApiResponse.success(result[0], "Record created successfully");
  } catch (error) {
    console.error("Error creating record:", error);

    return ApiResponse.failed("Failed to create record", "DB_ERROR", 500);
  }
}