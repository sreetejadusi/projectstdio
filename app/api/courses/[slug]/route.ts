import { z } from "zod";
import { getRequestContext, requireAuthenticatedUser } from "@/lib/utils/request";
import { successResponse } from "@/lib/utils/api";
import { handleApiError } from "@/lib/errors/errorHandler";
import { courseService } from "@/lib/services/course.service";

const ENDPOINT = "GET /api/courses/:slug";

const paramsSchema = z.object({
  slug: z.string().min(1),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const context = await getRequestContext();

  try {
    const auth = requireAuthenticatedUser(context);
    const parsed = paramsSchema.parse(await params);
    const course = await courseService.getCourseDetailForUser(auth.userId, parsed.slug);

    return successResponse({ course }, context, ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, ENDPOINT);
  }
}
