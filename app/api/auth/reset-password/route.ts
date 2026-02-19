import { authService } from "@/lib/services/auth.service";
import { resetPasswordSchema } from "@/lib/validators/auth.validator";
import { verifyEmailToken } from "@/lib/utils/emailTokens";
import { getRequestContext } from "@/lib/utils/request";
import { successResponse } from "@/lib/utils/api";
import { handleApiError } from "@/lib/errors/errorHandler";

const ENDPOINT = "POST /api/auth/reset-password";

export async function POST(request: Request) {
  const context = await getRequestContext();

  try {
    const body = resetPasswordSchema.parse(await request.json());
    const payload = await verifyEmailToken(body.token, "password_reset");

    await authService.resetPassword(body, payload.sub);

    return successResponse({ reset: true }, context, ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, ENDPOINT);
  }
}
