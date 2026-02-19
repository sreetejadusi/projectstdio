import { authService } from "@/lib/services/auth.service";
import { mailService } from "@/lib/services/mail.service";
import { forgotPasswordSchema } from "@/lib/validators/auth.validator";
import { createPasswordResetToken } from "@/lib/utils/emailTokens";
import { getAppBaseUrl } from "@/lib/utils/url";
import { getRequestContext } from "@/lib/utils/request";
import { successResponse } from "@/lib/utils/api";
import { handleApiError } from "@/lib/errors/errorHandler";

const ENDPOINT = "POST /api/auth/forgot-password";

export async function POST(request: Request) {
  const context = await getRequestContext();

  try {
    const body = forgotPasswordSchema.parse(await request.json());
    const result = await authService.forgotPassword(body);

    if (result.sent && result.userId) {
      const token = await createPasswordResetToken(result.userId, result.email);
      const resetUrl = `${getAppBaseUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`;
      await mailService.sendPasswordResetEmail(result.email, resetUrl);
    }

    return successResponse({ sent: true }, context, ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, ENDPOINT);
  }
}
