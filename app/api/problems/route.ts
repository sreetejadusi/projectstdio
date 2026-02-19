import { problemService } from "@/lib/services/problem.service";
import { createProblemSchema } from "@/lib/validators/problem.validator";
import { getRequestContext, requireAuthenticatedUser } from "@/lib/utils/request";
import { successResponse } from "@/lib/utils/api";
import { handleApiError } from "@/lib/errors/errorHandler";

const ENDPOINT = "POST /api/problems";

export async function POST(request: Request) {
  const context = await getRequestContext();

  try {
    const auth = requireAuthenticatedUser(context);
    const body = createProblemSchema.parse(await request.json());

    const problem = await problemService.createProblem(body, {
      userId: auth.userId,
      role: auth.userRole,
    });

    return successResponse({ problem }, context, ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, ENDPOINT);
  }
}
