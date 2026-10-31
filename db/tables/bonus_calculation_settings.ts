import { usersTable } from "@/db/tables/users";
import { numeric, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const bonusCalculationSettingsTable = pgTable("bonus_calculation_settings", {
  userId: varchar("user_id", { length: 255 })
    .primaryKey()
    .references(() => usersTable.userId, { onDelete: "cascade" }),
  workingDaysPerMonth: numeric("working_days_per_month", {
    precision: 2,
    scale: 0,
    mode: "number",
  })
    .notNull()
    .default(22),
  hoursPerWorkday: numeric("hours_per_workday", {
    precision: 4,
    scale: 2,
    mode: "number",
  })
    .notNull()
    .default(8),
  weekdayMultiplier: numeric("weekday_multiplier", {
    precision: 4,
    scale: 2,
    mode: "number",
  })
    .notNull()
    .default(1),
  normalHolidayMultiplier: numeric("normal_holiday_multiplier", {
    precision: 4,
    scale: 2,
    mode: "number",
  })
    .notNull()
    .default(2),
  weekendMultiplier: numeric("weekend_multiplier", {
    precision: 4,
    scale: 2,
    mode: "number",
  })
    .notNull()
    .default(2),
  specialDayMultiplier: numeric("special_day_multiplier", {
    precision: 4,
    scale: 2,
    mode: "number",
  })
    .notNull()
    .default(2),
  khrPerUsd: numeric("khr_per_usd", {
    precision: 12,
    scale: 4,
    mode: "number",
  })
    .notNull()
    .default(4000),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
