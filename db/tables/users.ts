import {
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: varchar({ length: 255 }).notNull().unique(),
  email: varchar({ length: 255 }).notNull().unique(),
  authUserId: varchar("auth_user_id", { length: 255 }),
  name: varchar({ length: 255 }),
  image: varchar({ length: 2048 }),
  phone: varchar({ length: 20 }).unique(),
  // Neon Auth owns credentials. This legacy column stays nullable for existing rows.
  password: varchar({ length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  modifiedAt: timestamp("modified_at").defaultNow().notNull(),
}, (table) => [uniqueIndex("users_auth_user_id_unique").on(table.authUserId)]);
