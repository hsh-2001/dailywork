import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import db from "@/db/db";
import { usersTable } from "@/db/tables/users";
import { setSession, verifyPassword } from "@/lib/auth/server";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: unknown; password?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || typeof body.password !== "string" || body.password.length > 1024) return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user?.password || !(await verifyPassword(body.password, user.password))) {
      return NextResponse.json({ message: "Email or password is incorrect." }, { status: 401 });
    }
    const userId = user.userId ?? randomUUID();
    if (!user.userId) {
      await db.update(usersTable).set({ userId, modifiedAt: new Date() }).where(eq(usersTable.id, user.id));
    }
    await setSession(userId);
    return NextResponse.json({ data: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error("Unable to sign in", error);
    return NextResponse.json({ message: "Unable to sign in." }, { status: 500 });
  }
}
