import { headers } from "next/headers";
import { authService } from "@/lib/services/auth.service";
import { clearSessionCookie } from "@/lib/utils/auth";
import { getRequestContext, requireAuthenticatedUser } from "@/lib/utils/request";
import { successResponse } from "@/lib/utils/api";
import { handleApiError } from "@/lib/errors/errorHandler";

const ENDPOINT = "POST /api/auth/logout";

export async function POST() {
  const context = await getRequestContext();

  try {
    requireAuthenticatedUser(context);
    const headerStore = await headers();
    const sessionId = headerStore.get("x-session-id");

    if (sessionId) {
      await authService.invalidateSession(sessionId);
    }

    await clearSessionCookie();

    return successResponse({ loggedOut: true }, context, ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, ENDPOINT);
  }
}
