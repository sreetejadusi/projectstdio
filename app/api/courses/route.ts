import { getRequestContext, requireAuthenticatedUser } from "@/lib/utils/request";
import { successResponse } from "@/lib/utils/api";
import { handleApiError } from "@/lib/errors/errorHandler";
import { courseService } from "@/lib/services/course.service";

const ENDPOINT = "GET /api/courses";

export async function GET() {
  const context = await getRequestContext();

  try {
    const auth = requireAuthenticatedUser(context);
    const courses = await courseService.listCoursesForUser(auth.userId);

    return successResponse({ courses }, context, ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, ENDPOINT);
  }
}
