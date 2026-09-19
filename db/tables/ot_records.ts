import {
  pgTable,
  bigint,
  date,
  timestamp,
  integer,
  varchar,
  text,
} from "drizzle-orm/pg-core";

export const otRecordTable = pgTable("ot_records", {
  id: bigint("id", { mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity(),

  workDate: date("work_date").notNull(),

  startTime: timestamp("start_time").notNull(),

  endTime: timestamp("end_time").notNull(),

  totalMinutes: integer("total_minutes"),

  project: varchar("project", { length: 100 }),

  task: varchar("task", { length: 255 }),

  note: text("note"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
