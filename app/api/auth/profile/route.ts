import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import db from "@/db/db";
import { usersTable } from "@/db/tables/users";
import { getCurrentAuthUser } from "@/lib/auth/current-user";

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    const body = await request.json() as { name?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 255) return NextResponse.json({ message: "Name must be between 1 and 255 characters." }, { status: 400 });
    await db.update(usersTable).set({ name, modifiedAt: new Date() }).where(eq(usersTable.userId, user.id));
    return NextResponse.json({ data: { name } });
  } catch (error) {
    console.error("Unable to update profile", error);
    return NextResponse.json({ message: "Unable to update profile." }, { status: 500 });
  }
}
