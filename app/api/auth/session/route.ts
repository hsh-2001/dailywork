import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/lib/auth/current-user";

export async function GET() {
  return NextResponse.json({ data: await getCurrentAuthUser() });
}
