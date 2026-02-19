import { organizationService } from "@/lib/services/organization.service";
import { getRequestContext, requireAuthenticatedUser } from "@/lib/utils/request";
import { successResponse } from "@/lib/utils/api";
import { handleApiError } from "@/lib/errors/errorHandler";

const ENDPOINT = "GET /api/organizations";

export async function GET() {
  const context = await getRequestContext();

  try {
    const auth = requireAuthenticatedUser(context);
    const organizations = await organizationService.listForUser(auth.userId);

    return successResponse({ organizations }, context, ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, ENDPOINT);
  }
}
