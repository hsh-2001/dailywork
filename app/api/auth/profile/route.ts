import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import db from "@/db/db";
import { usersTable } from "@/db/tables/users";
import { getCurrentAuthUser } from "@/lib/auth/current-user";
import { hashPassword, verifyPassword } from "@/lib/auth/server";

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    const body = await request.json() as { name?: unknown; currentPassword?: unknown; newPassword?: unknown };

    if (Object.hasOwn(body, "name")) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name || name.length > 255) return NextResponse.json({ message: "Name must be between 1 and 255 characters." }, { status: 400 });
      await db.update(usersTable).set({ name, modifiedAt: new Date() }).where(eq(usersTable.userId, user.id));
      return NextResponse.json({ data: { name } });
    }

    const newPassword = body.newPassword;
    if (typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 1024) {
      return NextResponse.json({ message: "New password must be between 8 and 1024 characters." }, { status: 400 });
    }
    const [record] = await db.select({ id: usersTable.id, password: usersTable.password })
      .from(usersTable).where(eq(usersTable.userId, user.id)).limit(1);
    if (!record) return NextResponse.json({ message: "Account not found." }, { status: 404 });
    if (record.password) {
      if (typeof body.currentPassword !== "string" || !(await verifyPassword(body.currentPassword, record.password))) {
        return NextResponse.json({ message: "Current password is incorrect." }, { status: 400 });
      }
    }
    await db.update(usersTable).set({ password: await hashPassword(newPassword), modifiedAt: new Date() }).where(eq(usersTable.id, record.id));
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Unable to update profile", error);
    return NextResponse.json({ message: "Unable to update profile." }, { status: 500 });
  }
}
