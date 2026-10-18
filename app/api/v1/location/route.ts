import { getCurrentAuthUser } from "@/lib/auth/current-user";
import { ApiResponse } from "@/shares/types/apiResponse";
import type { NextRequest } from "next/server";

type UserCoordinates = {
  latitude: number;
  longitude: number;
};

function isUserCoordinates(value: unknown): value is UserCoordinates {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const coordinates = value as Record<string, unknown>;
  return (
    typeof coordinates.latitude === "number" &&
    Number.isFinite(coordinates.latitude) &&
    coordinates.latitude >= -90 &&
    coordinates.latitude <= 90 &&
    typeof coordinates.longitude === "number" &&
    Number.isFinite(coordinates.longitude) &&
    coordinates.longitude >= -180 &&
    coordinates.longitude <= 180
  );
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) {
      return ApiResponse.failed("Authentication required", "UNAUTHORIZED", 401);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return ApiResponse.failed("A valid JSON body is required", "INVALID_INPUT", 400);
    }

    if (!isUserCoordinates(body)) {
      return ApiResponse.failed(
        "Latitude and longitude must be valid numeric coordinates",
        "INVALID_INPUT",
        400,
      );
    }

    return ApiResponse.success(body, "Location retrieved successfully");
  } catch (error) {
    console.error("Error retrieving user location:", error);
    return ApiResponse.failed("Failed to retrieve user location", "SERVER_ERROR", 500);
  }
}