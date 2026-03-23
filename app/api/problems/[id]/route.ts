import { z } from "zod";
import { problemService } from "@/lib/services/problem.service";
import { getRequestContext, requireAuthenticatedUser } from "@/lib/utils/request";
import { successResponse } from "@/lib/utils/api";
import { handleApiError } from "@/lib/errors/errorHandler";

const ENDPOINT = "GET /api/problems/:id";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getRequestContext();

  try {
    requireAuthenticatedUser(context);
    const parsed = paramsSchema.parse(await params);
    const problem = await problemService.getProblemMetadata(parsed.id);

    return successResponse({ problem }, context, ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, ENDPOINT);
  }
}
