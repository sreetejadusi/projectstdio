import { z } from "zod";
import { AppError } from "@/lib/errors/AppError";
import { handleApiError } from "@/lib/errors/errorHandler";
import { env } from "@/lib/env";
import { successResponse } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";
import { getRequestContext, requireAuthenticatedUser } from "@/lib/utils/request";

const ENDPOINT = "GET /api/result/:id";

const paramsSchema = z.object({
  id: z.string().min(1),
});

type ResultUpstreamResponse = Record<string, unknown> & {
  status?: unknown;
  executionId?: unknown;
  result?: { status?: unknown } | unknown;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getRequestContext();

  try {
    logger.info({
      requestId: context.requestId,
      userId: context.userId,
      endpoint: ENDPOINT,
      message: "Step 1: received result request",
    });
    requireAuthenticatedUser(context);
    const parsedParams = paramsSchema.parse(await params);
    logger.info({
      requestId: context.requestId,
      userId: context.userId,
      endpoint: ENDPOINT,
      message: "Step 2: validated result id",
      metadata: { executionId: parsedParams.id },
    });

    const upstreamResponse = await fetch(`${env.EXECUTION_API_URL}/result/${parsedParams.id}`, {
      cache: "no-store",
    });
    logger.info({
      requestId: context.requestId,
      userId: context.userId,
      endpoint: ENDPOINT,
      message: "Step 3: fetched result from execution service",
      metadata: { upstreamStatus: upstreamResponse.status, executionId: parsedParams.id },
    });

    const payload = (await upstreamResponse.json().catch(() => null)) as
      | ResultUpstreamResponse
      | { message?: string }
      | null;

    const upstreamMessage =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : null;

    if (!upstreamResponse.ok) {
      throw new AppError(
        upstreamMessage ?? "Execution result lookup failed",
        upstreamResponse.status,
        "EXECUTION_RESULT_FAILED",
      );
    }

    const resultPayload =
      payload &&
      typeof payload === "object" &&
      "status" in payload &&
      typeof payload.status === "string"
        ? (payload as ResultUpstreamResponse)
        : null;

    if (!resultPayload) {
      throw new AppError("Invalid response from execution service", 502, "INVALID_EXECUTION_RESPONSE");
    }

    logger.info({
      requestId: context.requestId,
      userId: context.userId,
      endpoint: ENDPOINT,
      message: "Step 4: returning result payload",
      metadata: {
        executionId: resultPayload.executionId,
        status: resultPayload.status,
        verdict:
          resultPayload.result && typeof resultPayload.result === "object" && "status" in resultPayload.result
            ? resultPayload.result.status
            : undefined,
      },
    });

    return successResponse(resultPayload, context, ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, ENDPOINT);
  }
}
