import { eq } from "drizzle-orm";
import db from "@/db/db";
import { usersTable } from "@/db/tables/users";
import { getSessionUserId } from "@/lib/auth/server";

export async function getCurrentAuthUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.userId, userId)).limit(1);
  if (!user?.userId) return null;
  return { id: user.userId, email: user.email, name: user.name, image: user.image };
}

export async function getCurrentUserRecord(userId: string) {
  const [savedUser] = await db.select({
    id: usersTable.id,
    userId: usersTable.userId,
    name: usersTable.name,
    email: usersTable.email,
    image: usersTable.image,
  }).from(usersTable).where(eq(usersTable.userId, userId)).limit(1);
  return savedUser ?? null;
}
