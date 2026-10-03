import db from "@/db/db";
import { projectTable } from "@/db/tables/projects";
import { getCurrentAuthUser } from "@/lib/auth/current-user";
import { ApiResponse } from "@/shares/types/apiResponse";
import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return ApiResponse.failed("Authentication required", "UNAUTHORIZED", 401);

    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return ApiResponse.failed("Invalid project ID", "INVALID_INPUT", 400);
    }

    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || !("name" in body)) {
      return ApiResponse.failed("Project name is required", "INVALID_INPUT", 400);
    }

    const { name, description, status } = body as {
      name: unknown;
      description?: unknown;
      status?: unknown;
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
    if (status !== "ACTIVE" && status !== "INACTIVE") {
      return ApiResponse.failed(
        "Project status must be ACTIVE or INACTIVE",
        "INVALID_INPUT",
        400,
      );
    }

    const [project] = await db
      .update(projectTable)
      .set({
        name: name.trim(),
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
        status,
        updatedAt: new Date(),
      })
      .where(and(eq(projectTable.id, id), eq(projectTable.userId, user.id)))
      .returning();

    if (!project) {
      return ApiResponse.failed("Project not found", "NOT_FOUND", 404);
    }
    return ApiResponse.success(project, "Project updated successfully");
  } catch (error) {
    console.error("Error updating project:", error);
    return ApiResponse.failed("Failed to update project", "DB_ERROR", 500);
  }
}
