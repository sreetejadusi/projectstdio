import { AppError } from "@/lib/errors/AppError";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { clearSessionCookie } from "@/lib/utils/auth";
import { getRequestContext, requireAuthenticatedUser } from "@/lib/utils/request";
import { successResponse } from "@/lib/utils/api";
import { handleApiError } from "@/lib/errors/errorHandler";

const ENDPOINT = "GET /api/auth/session";

export async function GET() {
  const context = await getRequestContext();
  const db = getSupabaseServerClient();

  try {
    const auth = requireAuthenticatedUser(context);
    const { data: user, error } = await db
      .from("users")
      .select("id, full_name, email, role")
      .eq("id", auth.userId)
      .maybeSingle();

    if (error) {
      throw new AppError("Failed to validate session", 500, "SESSION_VALIDATION_FAILED", {
        postgresCode: error.code,
      });
    }

    if (!user) {
      await clearSessionCookie();
      throw new AppError("Session user no longer exists", 401, "UNAUTHORIZED");
    }

    return successResponse(
      {
        userId: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        organizationId: auth.organizationId,
      },
      context,
      ENDPOINT,
    );
  } catch (error) {
    return handleApiError(error, context, ENDPOINT);
  }
}
