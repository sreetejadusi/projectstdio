import { z } from "zod";
import { problemService } from "@/lib/services/problem.service";
import { getRequestContext, requireAuthenticatedUser } from "@/lib/utils/request";
import { successResponse } from "@/lib/utils/api";
import { handleApiError } from "@/lib/errors/errorHandler";

const ENDPOINT = "GET /api/problems/:id/solve";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const querySchema = z.object({
  classroomId: z.string().uuid().optional(),
  language: z.enum(["c", "java", "python"]).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getRequestContext();

  try {
    requireAuthenticatedUser(context);
    const parsedParams = paramsSchema.parse(await params);

    const url = new URL(request.url);
    const parsedQuery = querySchema.parse({
      classroomId: url.searchParams.get("classroomId") ?? undefined,
      language: (url.searchParams.get("language") as "c" | "java" | "python" | null) ?? undefined,
    });

    const problem = await problemService.getProblemSolveData(
      parsedParams.id,
      parsedQuery.classroomId,
      parsedQuery.language,
    );

    return successResponse({ problem }, context, ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, ENDPOINT);
  }
}
