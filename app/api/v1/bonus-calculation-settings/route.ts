import db from "@/db/db";
import { bonusCalculationSettingsTable } from "@/db/tables/bonus_calculation_settings";
import { getCurrentAuthUser } from "@/lib/auth/current-user";
import { ApiResponse } from "@/shares/types/apiResponse";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

const defaults = {
  workingDaysPerMonth: 22,
  hoursPerWorkday: 8,
  weekdayMultiplier: 1,
  normalHolidayMultiplier: 2,
  weekendMultiplier: 2,
  specialDayMultiplier: 2,
  khrPerUsd: 4000,
};

const isRate = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 10 &&
  Number(value.toFixed(2)) === value;

export async function GET() {
  try {
    const user = await getCurrentAuthUser();
    if (!user) {
      return ApiResponse.failed("Authentication required", "UNAUTHORIZED", 401);
    }

    const [settings] = await db
      .select({
        workingDaysPerMonth: bonusCalculationSettingsTable.workingDaysPerMonth,
        hoursPerWorkday: bonusCalculationSettingsTable.hoursPerWorkday,
        weekdayMultiplier: bonusCalculationSettingsTable.weekdayMultiplier,
        normalHolidayMultiplier: bonusCalculationSettingsTable.normalHolidayMultiplier,
        weekendMultiplier: bonusCalculationSettingsTable.weekendMultiplier,
        specialDayMultiplier: bonusCalculationSettingsTable.specialDayMultiplier,
        khrPerUsd: bonusCalculationSettingsTable.khrPerUsd,
      })
      .from(bonusCalculationSettingsTable)
      .where(eq(bonusCalculationSettingsTable.userId, user.id))
      .limit(1);

    return ApiResponse.success(
      settings ?? defaults,
      "Bonus calculation settings retrieved successfully",
    );
  } catch (error) {
    console.error("Error fetching bonus calculation settings:", error);
    return ApiResponse.failed(
      "Failed to retrieve bonus calculation settings",
      "DB_ERROR",
      500,
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) {
      return ApiResponse.failed("Authentication required", "UNAUTHORIZED", 401);
    }

    const body: unknown = await req.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return ApiResponse.failed(
        "Bonus calculation settings are required",
        "INVALID_INPUT",
        400,
      );
    }

    const {
      workingDaysPerMonth,
      hoursPerWorkday,
      weekdayMultiplier,
      normalHolidayMultiplier,
      weekendMultiplier,
      specialDayMultiplier,
      khrPerUsd,
    } = body as {
      workingDaysPerMonth?: unknown;
      hoursPerWorkday?: unknown;
      weekdayMultiplier?: unknown;
      normalHolidayMultiplier?: unknown;
      weekendMultiplier?: unknown;
      specialDayMultiplier?: unknown;
      khrPerUsd?: unknown;
    };

    if (
      typeof workingDaysPerMonth !== "number" ||
      !Number.isInteger(workingDaysPerMonth) ||
      workingDaysPerMonth < 1 ||
      workingDaysPerMonth > 31
    ) {
      return ApiResponse.failed(
        "Workdays per month must be a whole number between 1 and 31",
        "INVALID_INPUT",
        400,
      );
    }
    if (
      typeof hoursPerWorkday !== "number" ||
      !Number.isFinite(hoursPerWorkday) ||
      hoursPerWorkday < 1 ||
      hoursPerWorkday > 24 ||
      Number(hoursPerWorkday.toFixed(2)) !== hoursPerWorkday
    ) {
      return ApiResponse.failed(
        "Hours per workday must be between 1 and 24 with up to two decimal places",
        "INVALID_INPUT",
        400,
      );
    }
    if (
      !isRate(weekdayMultiplier) ||
      !isRate(normalHolidayMultiplier) ||
      !isRate(weekendMultiplier) ||
      !isRate(specialDayMultiplier)
    ) {
      return ApiResponse.failed(
        "Overtime multipliers must be between 0 and 10 with up to two decimal places",
        "INVALID_INPUT",
        400,
      );
    }
    if (
      typeof khrPerUsd !== "number" ||
      !Number.isFinite(khrPerUsd) ||
      khrPerUsd <= 0 ||
      khrPerUsd > 99999999.9999 ||
      Number(khrPerUsd.toFixed(4)) !== khrPerUsd
    ) {
      return ApiResponse.failed(
        "Exchange rate must be greater than 0 and have up to four decimal places",
        "INVALID_INPUT",
        400,
      );
    }
    const [settings] = await db
      .insert(bonusCalculationSettingsTable)
      .values({
        userId: user.id,
        workingDaysPerMonth,
        hoursPerWorkday,
        weekdayMultiplier,
        normalHolidayMultiplier,
        weekendMultiplier,
        specialDayMultiplier,
        khrPerUsd,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: bonusCalculationSettingsTable.userId,
        set: {
          workingDaysPerMonth,
          hoursPerWorkday,
          weekdayMultiplier,
          normalHolidayMultiplier,
          weekendMultiplier,
          specialDayMultiplier,
          khrPerUsd,
          updatedAt: new Date(),
        },
      })
      .returning({
        workingDaysPerMonth: bonusCalculationSettingsTable.workingDaysPerMonth,
        hoursPerWorkday: bonusCalculationSettingsTable.hoursPerWorkday,
        weekdayMultiplier: bonusCalculationSettingsTable.weekdayMultiplier,
        normalHolidayMultiplier: bonusCalculationSettingsTable.normalHolidayMultiplier,
        weekendMultiplier: bonusCalculationSettingsTable.weekendMultiplier,
        specialDayMultiplier: bonusCalculationSettingsTable.specialDayMultiplier,
        khrPerUsd: bonusCalculationSettingsTable.khrPerUsd,
      });

    return ApiResponse.success(settings, "Bonus calculation settings saved successfully");
  } catch (error) {
    console.error("Error saving bonus calculation settings:", error);
    return ApiResponse.failed(
      "Failed to save bonus calculation settings",
      "DB_ERROR",
      500,
    );
  }
}
