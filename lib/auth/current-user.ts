import { eq } from "drizzle-orm";
import db from "@/db/db";
import { usersTable } from "@/db/tables/users";
import { getSessionUserId } from "@/lib/auth/server";

export async function getCurrentAuthUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.authUserId, userId)).limit(1);
  if (!user) return null;
  return { id: user.authUserId!, email: user.email, name: user.name, image: user.image };
}

export async function syncAuthUserRecord(user: NonNullable<Awaited<ReturnType<typeof getCurrentAuthUser>>>) {
  const [savedUser] = await db.select({
    id: usersTable.id,
    authUserId: usersTable.authUserId,
    name: usersTable.name,
    email: usersTable.email,
    image: usersTable.image,
  }).from(usersTable).where(eq(usersTable.authUserId, user.id)).limit(1);
  return savedUser ?? null;
}
