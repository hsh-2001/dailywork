import db from "@/db/db";
import { salarySettingsTable } from "@/db/tables/salary_settings";
import { getCurrentAuthUser } from "@/lib/auth/current-user";
import { SalaryCurrency } from "@/shares/dtos/salary-settings/salarySettings";
import { ApiResponse } from "@/shares/types/apiResponse";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

const currencies: SalaryCurrency[] = ["USD", "KHR"];
export async function GET() {
  try {
    const user = await getCurrentAuthUser();
    if (!user) {
      return ApiResponse.failed("Authentication required", "UNAUTHORIZED", 401);
    }

    const savedSettings = await db
      .select({
        monthlySalary: salarySettingsTable.monthlySalary,
        currency: salarySettingsTable.currency,
        taxRate: salarySettingsTable.taxRate,
      })
      .from(salarySettingsTable)
      .where(eq(salarySettingsTable.userId, user.id));

    const settingsByCurrency = new Map(
      savedSettings.map((settings) => [settings.currency, settings]),
    );
    const settings = currencies.map(
      (currency) =>
        settingsByCurrency.get(currency) ?? {
          monthlySalary: 0,
          currency,
          taxRate: 0,
        },
    );

    return ApiResponse.success(settings, "Salary settings retrieved successfully");
  } catch (error) {
    console.error("Error fetching salary settings:", error);
    return ApiResponse.failed("Failed to retrieve salary settings", "DB_ERROR", 500);
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
      return ApiResponse.failed("Salary settings are required", "INVALID_INPUT", 400);
    }

    const {
      monthlySalary,
      currency,
      taxRate,
    } = body as {
      monthlySalary?: unknown;
      currency?: unknown;
      taxRate?: unknown;
    };
    if (
      typeof monthlySalary !== "number" ||
      !Number.isFinite(monthlySalary) ||
      monthlySalary < 0 ||
      monthlySalary > 999999999999.99 ||
      Number(monthlySalary.toFixed(2)) !== monthlySalary
    ) {
      return ApiResponse.failed(
        "Base salary must be a non-negative amount with up to two decimal places",
        "INVALID_INPUT",
        400,
      );
    }
    if (typeof currency !== "string" || !currencies.some((supported) => supported === currency)) {
      return ApiResponse.failed("Unsupported salary currency", "INVALID_INPUT", 400);
    }
    if (
      typeof taxRate !== "number" ||
      !Number.isFinite(taxRate) ||
      taxRate < 0 ||
      taxRate > 100 ||
      Number(taxRate.toFixed(2)) !== taxRate
    ) {
      return ApiResponse.failed(
        "Tax rate must be between 0 and 100 with up to two decimal places",
        "INVALID_INPUT",
        400,
      );
    }
    const [settings] = await db
      .insert(salarySettingsTable)
      .values({
        userId: user.id,
        monthlySalary,
        currency,
        taxRate,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [salarySettingsTable.userId, salarySettingsTable.currency],
        set: {
          monthlySalary,
          currency,
          taxRate,
          updatedAt: new Date(),
        },
      })
      .returning({
        monthlySalary: salarySettingsTable.monthlySalary,
        currency: salarySettingsTable.currency,
        taxRate: salarySettingsTable.taxRate,
      });

    return ApiResponse.success(settings, "Salary settings saved successfully");
  } catch (error) {
    console.error("Error saving salary settings:", error);
    return ApiResponse.failed("Failed to save salary settings", "DB_ERROR", 500);
  }
}
