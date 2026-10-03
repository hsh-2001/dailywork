import {
  bigserial,
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "@/db/tables/users";

export const notesTable = pgTable("notes", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => usersTable.authUserId),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  pinned: boolean("pinned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [index("notes_user_id_idx").on(table.userId)]);
