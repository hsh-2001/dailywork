import {
  pgTable,
  bigint,
  date,
  index,
  varchar,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

export const otRecordTable = pgTable("ot_records", {
  id: bigint("id", { mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity(),

  userId: varchar("user_id", { length: 255 }),

  workDate: date("work_date").notNull(),

  startTime: timestamp("start_time").notNull(),

  endTime: timestamp("end_time").notNull(),

  totalMinutes: integer("total_minutes"),

  project: varchar("project", { length: 100 }),

  task: varchar("task", { length: 255 }),

  note: text("note"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("ot_records_user_id_idx").on(table.userId)]);
