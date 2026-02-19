import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { signSessionToken, verifySessionToken } from "@/lib/utils/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/utils/session";

export { SESSION_COOKIE_NAME } from "@/lib/utils/session";

export const createSessionToken = signSessionToken;
export { verifySessionToken };

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: env.JWT_EXPIRES_IN_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
