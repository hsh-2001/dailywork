import {
  pgTable,
  bigserial,
  index,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { usersTable } from "@/db/tables/users";

export const projectTable = pgTable("projects", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [index("projects_user_id_idx").on(table.userId)]);
