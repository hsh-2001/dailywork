import { createNeonAuth } from "@neondatabase/auth/next/server";

const baseUrl = process.env.AUTH_URL;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

if (!baseUrl) throw new Error("AUTH_URL must contain the Neon Auth endpoint");
if (!cookieSecret || cookieSecret.length < 32) {
  throw new Error("NEON_AUTH_COOKIE_SECRET must be at least 32 characters");
}

export const auth = createNeonAuth({
  baseUrl,
  cookies: { secret: cookieSecret },
});
