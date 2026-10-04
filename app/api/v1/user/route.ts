import {
  getCurrentAuthUser,
  getCurrentUserRecord,
} from "@/lib/auth/current-user";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const user = await getCurrentAuthUser();
    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const savedUser = await getCurrentUserRecord(user.id);

    return NextResponse.json({ data: savedUser });
  } catch (cause) {
    console.error("Unable to load authenticated user", cause);
    return NextResponse.json({ message: "Unable to load user" }, { status: 500 });
  }
}
