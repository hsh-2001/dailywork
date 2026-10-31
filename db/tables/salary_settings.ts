import { pgTable, numeric, primaryKey, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "@/db/tables/users";

export const salarySettingsTable = pgTable("salary_settings", {
  userId: varchar("user_id", { length: 255 })
    .references(() => usersTable.userId, { onDelete: "cascade" }),
  monthlySalary: numeric("monthly_salary", {
    precision: 14,
    scale: 2,
    mode: "number",
  })
    .notNull()
    .default(0),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2, mode: "number" })
    .notNull()
    .default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.currency] }),
]);
