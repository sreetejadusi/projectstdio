import { z } from "zod";
import { getRequestContext, requireAuthenticatedUser } from "@/lib/utils/request";
import { successResponse } from "@/lib/utils/api";
import { handleApiError } from "@/lib/errors/errorHandler";
import { courseService } from "@/lib/services/course.service";
import { courseTopicProgressUpdateSchema } from "@/lib/validators/course.validator";

const ENDPOINT = "PATCH /api/courses/:slug/topic-progress";

const paramsSchema = z.object({
  slug: z.string().min(1),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const context = await getRequestContext();

  try {
    const auth = requireAuthenticatedUser(context);
    const parsedParams = paramsSchema.parse(await params);
    const body = courseTopicProgressUpdateSchema.parse(await request.json());

    const course = body.completed
      ? await courseService.completeTopic(auth.userId, parsedParams.slug, body.moduleId, body.topicId)
      : await courseService.trackTopicView(auth.userId, parsedParams.slug, body.moduleId, body.topicId);

    return successResponse({ course }, context, ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, ENDPOINT);
  }
}
