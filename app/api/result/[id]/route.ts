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

    if (!upstreamResponse.ok) {
      throw new AppError(
        typeof payload === "object" && payload && "message" in payload && payload.message
          ? payload.message
          : "Execution result lookup failed",
        upstreamResponse.status,
        "EXECUTION_RESULT_FAILED",
      );
    }

    if (!payload || typeof payload !== "object" || typeof payload.status !== "string") {
      throw new AppError("Invalid response from execution service", 502, "INVALID_EXECUTION_RESPONSE");
    }

    logger.info({
      requestId: context.requestId,
      userId: context.userId,
      endpoint: ENDPOINT,
      message: "Step 4: returning result payload",
      metadata: {
        executionId: payload.executionId,
        status: typeof payload.status === "string" ? payload.status : undefined,
        verdict:
          payload.result && typeof payload.result === "object" && "status" in payload.result
            ? payload.result.status
            : undefined,
      },
    });

    return successResponse(payload, context, ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, ENDPOINT);
  }
}
