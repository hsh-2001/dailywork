import { auth } from "@/lib/auth/server";
import { NextResponse, type NextRequest } from "next/server";

const authMiddleware = auth.middleware({ loginUrl: "/auth/sign-in" });

export default function proxy(request: NextRequest) {
  // Verification must be reachable before the user has a valid session.
  if (request.nextUrl.pathname === "/auth/email-verification") {
    return NextResponse.next();
  }

  return authMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
