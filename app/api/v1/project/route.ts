import db from "@/db/db";
import { projectTable } from "@/db/tables/projects";
import {
  getCurrentAuthUser,
  syncAuthUserRecord,
} from "@/lib/auth/current-user";
import { ApiResponse } from "@/shares/types/apiResponse";
import { asc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return ApiResponse.failed("Authentication required", "UNAUTHORIZED", 401);

    const projects = await db
      .select()
      .from(projectTable)
      .where(eq(projectTable.userId, user.id))
      .orderBy(asc(projectTable.name));

    return ApiResponse.success(projects, "Projects retrieved successfully");
  } catch (error) {
    console.error("Error fetching projects:", error);
    return ApiResponse.failed("Failed to retrieve projects", "DB_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return ApiResponse.failed("Authentication required", "UNAUTHORIZED", 401);

    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || !("name" in body)) {
      return ApiResponse.failed("Project name is required", "INVALID_INPUT", 400);
    }

    const { name, description } = body as {
      name: unknown;
      description?: unknown;
    };
    if (typeof name !== "string" || !name.trim() || name.trim().length > 150) {
      return ApiResponse.failed(
        "Project name must be between 1 and 150 characters",
        "INVALID_INPUT",
        400,
      );
    }
    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      return ApiResponse.failed(
        "Project description must be text",
        "INVALID_INPUT",
        400,
      );
    }

    await syncAuthUserRecord(user);

    const [project] = await db
      .insert(projectTable)
      .values({
        userId: user.id,
        name: name.trim(),
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
      })
      .returning();

    return ApiResponse.success(project, "Project created successfully");
  } catch (error) {
    console.error("Error creating project:", error);
    return ApiResponse.failed("Failed to create project", "DB_ERROR", 500);
  }
}
