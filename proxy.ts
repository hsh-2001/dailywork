import { NextResponse, type NextRequest } from "next/server";

const publicPaths = ["/auth/sign-in", "/auth/sign-up"];

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hasSessionCookie = request.cookies.has("daily_work_session");
  if (publicPaths.includes(path) || path.startsWith("/api/auth/")) return NextResponse.next();
  if (!hasSessionCookie && path.startsWith("/api/")) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }
  if (!hasSessionCookie) return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
