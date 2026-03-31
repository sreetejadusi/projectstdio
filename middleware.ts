import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/utils/session";
import { verifySessionToken } from "@/lib/utils/jwt";

const PUBLIC_API_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/session",
  "/api/auth/confirm",
  "/api/auth/resend-confirmation",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
]);

const PUBLIC_PAGE_PATHS = new Set([
  "/auth",
  "/auth/confirmation",
  "/auth/forgot-password",
  "/auth/reset-password",
]);

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const requestId = requestHeaders.get("x-request-id") ?? crypto.randomUUID();
  requestHeaders.set("x-request-id", requestId);

  const pathname = request.nextUrl.pathname;

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isPublicApi = pathname.startsWith("/api") && PUBLIC_API_PATHS.has(pathname);
  const isPublicPage = PUBLIC_PAGE_PATHS.has(pathname);
  const isVisualizationRoute = pathname === "/visualize";
  const isProtectedApi = (pathname.startsWith("/api") && !isPublicApi) || isVisualizationRoute;
  const isProtectedPage =
    !pathname.startsWith("/api") &&
    !isPublicPage &&
    pathname !== "/favicon.ico" &&
    !pathname.startsWith("/_next") &&
    !/\.[a-zA-Z0-9]+$/.test(pathname);

  if (!token) {
    if (isProtectedApi) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 },
      );
    }

    if (isProtectedPage) {
      const loginUrl = new URL("/auth", request.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  try {
    const payload = await verifySessionToken(token);
    requestHeaders.set("x-user-id", payload.sub);
    requestHeaders.set("x-user-role", payload.role);
    requestHeaders.set("x-session-id", payload.sessionId);
    if (payload.organizationId) {
      requestHeaders.set("x-user-organization-id", payload.organizationId);
    }

    if (isPublicPage) {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    if (isProtectedApi) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid or expired session token",
          },
        },
        { status: 401 },
      );
    }

    if (isProtectedPage) {
      const loginUrl = new URL("/auth", request.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
