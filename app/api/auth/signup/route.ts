import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import db from "@/db/db";
import { usersTable } from "@/db/tables/users";
import { hashPassword, setSession } from "@/lib/auth/server";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { name?: unknown; email?: unknown; password?: unknown; confirmPassword?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = body.password;
    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== "string" || password.length < 8 || password.length > 1024) {
      return NextResponse.json({ message: "Enter a name, valid email, and password of at least 8 characters." }, { status: 400 });
    }
    if (body.confirmPassword !== password) {
      return NextResponse.json({ message: "Passwords do not match." }, { status: 400 });
    }
    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing) return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
    const userId = randomUUID();
    const [user] = await db.insert(usersTable).values({
      authUserId: userId,
      username: email,
      email,
      name,
      password: await hashPassword(password),
    }).returning({ id: usersTable.id, authUserId: usersTable.authUserId, email: usersTable.email, name: usersTable.name });
    await setSession(userId);
    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    console.error("Unable to create account", error);
    return NextResponse.json({ message: "Unable to create account." }, { status: 500 });
  }
}
