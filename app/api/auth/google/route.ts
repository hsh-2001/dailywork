import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import db from "@/db/db";
import { usersTable } from "@/db/tables/users";
import { setSession } from "@/lib/auth/server";

type FirebaseLookup = { users?: Array<{ localId?: string; email?: string; displayName?: string; photoUrl?: string; emailVerified?: boolean }> };

export async function POST(request: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) return NextResponse.json({ message: "Google sign-in is not configured." }, { status: 503 });
    const body = await request.json() as { idToken?: unknown };
    if (typeof body.idToken !== "string" || body.idToken.length > 16_000) {
      return NextResponse.json({ message: "A valid Firebase sign-in token is required." }, { status: 400 });
    }
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: body.idToken }),
    });
    if (!response.ok) return NextResponse.json({ message: "Google sign-in could not be verified." }, { status: 401 });
    const result = await response.json() as FirebaseLookup;
    const profile = result.users?.[0];
    const email = profile?.email?.trim().toLowerCase();
    if (!profile?.localId || !email || !profile.emailVerified) {
      return NextResponse.json({ message: "A verified Google email is required." }, { status: 401 });
    }

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    let userId = existing?.userId;
    if (existing) {
      userId ||= randomUUID();
      await db.update(usersTable).set({ userId, name: existing.name || profile.displayName || email, image: existing.image || profile.photoUrl || null, modifiedAt: new Date() }).where(eq(usersTable.id, existing.id));
    } else {
      userId = randomUUID();
      await db.insert(usersTable).values({ userId, username: email, email, name: profile.displayName || email, image: profile.photoUrl || null });
    }
    await setSession(userId);
    return NextResponse.json({ data: { id: userId, email, name: profile.displayName || existing?.name || null } });
  } catch (error) {
    console.error("Unable to sign in with Google", error);
    return NextResponse.json({ message: "Unable to sign in with Google." }, { status: 500 });
  }
}
