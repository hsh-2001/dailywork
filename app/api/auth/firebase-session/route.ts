import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import db from "@/db/db";
import { usersTable } from "@/db/tables/users";
import { setSession } from "@/lib/auth/server";

type FirebaseLookup = {
  users?: Array<{
    localId?: string;
    email?: string;
    emailVerified?: boolean;
    displayName?: string;
    photoUrl?: string;
  }>;
};

type FirebaseError = { error?: { message?: string } };

export async function POST(request: Request) {
  try {
    const apiKey = process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) return NextResponse.json({ message: "Firebase Authentication is not configured." }, { status: 503 });

    const body = await request.json() as { idToken?: unknown };
    if (typeof body.idToken !== "string" || body.idToken.length > 16_000) {
      return NextResponse.json({ message: "A valid Firebase sign-in token is required." }, { status: 400 });
    }

    const verification = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: body.idToken }),
    });
    if (!verification.ok) {
      const failure = await verification.json().catch(() => null) as FirebaseError | null;
      const code = failure?.error?.message?.split(" ")[0];
      console.error("Firebase token verification failed", { status: verification.status, code });
      return NextResponse.json({ message: code ? `Firebase sign-in verification failed: ${code}.` : "Firebase sign-in verification failed." }, { status: 401 });
    }

    const result = await verification.json() as FirebaseLookup;
    const profile = result.users?.[0];
    const email = profile?.email?.trim().toLowerCase();
    if (!profile?.localId || !email) {
      return NextResponse.json({ message: "Firebase did not return a valid email account." }, { status: 401 });
    }
    if (!profile.emailVerified) {
      return NextResponse.json({ message: "Verify your email address before signing in." }, { status: 403 });
    }

    // Preserve an existing app user ID so legacy records remain attached when
    // an existing local account is first linked to Firebase Authentication.
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    let userId = existing?.userId;
    if (existing) {
      userId ||= randomUUID();
      await db.update(usersTable).set({
        userId,
        name: existing.name || profile.displayName || email,
        image: existing.image || profile.photoUrl || null,
        modifiedAt: new Date(),
      }).where(eq(usersTable.id, existing.id));
    } else {
      userId = randomUUID();
      await db.insert(usersTable).values({
        userId,
        username: email,
        email,
        name: profile.displayName || email,
        image: profile.photoUrl || null,
      });
    }

    await setSession(userId);
    return NextResponse.json({ data: { id: userId, email, name: profile.displayName || existing?.name || null } });
  } catch (error) {
    console.error("Unable to create Firebase session", error);
    return NextResponse.json({ message: "Unable to sign in." }, { status: 500 });
  }
}
