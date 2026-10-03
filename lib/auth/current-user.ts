import { auth } from "@/lib/auth/server";
import db from "@/db/db";
import { usersTable } from "@/db/tables/users";

export async function getCurrentAuthUser() {
  const { data, error } = await auth.getSession();
  if (error) return null;
  return data?.user ?? null;
}

export async function syncAuthUserRecord(user: NonNullable<Awaited<ReturnType<typeof getCurrentAuthUser>>>) {
  const [savedUser] = await db
    .insert(usersTable)
    .values({
      authUserId: user.id,
      username: user.id,
      name: user.name || null,
      email: user.email,
      image: user.image || null,
    })
    .onConflictDoUpdate({
      target: usersTable.email,
      set: {
        authUserId: user.id,
        username: user.id,
        name: user.name || null,
        image: user.image || null,
        password: null,
        modifiedAt: new Date(),
      },
    })
    .returning({
      id: usersTable.id,
      authUserId: usersTable.authUserId,
      name: usersTable.name,
      email: usersTable.email,
      image: usersTable.image,
    });

  return savedUser;
}
