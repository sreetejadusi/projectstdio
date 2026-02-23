import { z } from "zod";
import { AppError } from "@/lib/errors/AppError";
import { handleApiError } from "@/lib/errors/errorHandler";
import { env } from "@/lib/env";
import { successResponse } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";
import { getRequestContext, requireAuthenticatedUser } from "@/lib/utils/request";

const ENDPOINT = "POST /api/execute";

const executeBodySchema = z.object({
  language: z.enum(["python", "c", "java"]),
  code: z.string().min(1),
  testcases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
      }),
    )
    .min(1),
});

type ExecuteUpstreamResponse = {
  executionId: string;
  status: "queued";
};

export async function POST(request: Request) {
  const context = await getRequestContext();

  try {
    logger.info({
      requestId: context.requestId,
      userId: context.userId,
      endpoint: ENDPOINT,
      message: "Step 1: received execute request",
    });
    const auth = requireAuthenticatedUser(context);
    logger.info({
      requestId: context.requestId,
      userId: context.userId,
      endpoint: ENDPOINT,
      message: "Step 2: authenticated user",
      metadata: { authenticatedUserId: auth.userId },
    });
    const body = executeBodySchema.parse(await request.json());
    logger.info({
      requestId: context.requestId,
      userId: context.userId,
      endpoint: ENDPOINT,
      message: "Step 3: validated body",
      metadata: { language: body.language, testcaseCount: body.testcases.length },
    });

    const upstreamResponse = await fetch(`${env.EXECUTION_API_URL}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: body.language,
        code: body.code,
        userId: auth.userId,
        testcases: body.testcases,
      }),
      cache: "no-store",
    });
    logger.info({
      requestId: context.requestId,
      userId: context.userId,
      endpoint: ENDPOINT,
      message: "Step 4: forwarded request to execution service",
      metadata: { upstreamStatus: upstreamResponse.status },
    });

    const payload = (await upstreamResponse.json().catch(() => null)) as
      | ExecuteUpstreamResponse
      | { message?: string }
      | null;

    if (!upstreamResponse.ok) {
      throw new AppError(
        typeof payload === "object" && payload && "message" in payload && payload.message
          ? payload.message
          : "Execution enqueue failed",
        upstreamResponse.status,
        "EXECUTION_ENQUEUE_FAILED",
      );
    }

    if (
      !payload ||
      typeof payload !== "object" ||
      !("executionId" in payload) ||
      !("status" in payload)
    ) {
      throw new AppError("Invalid response from execution service", 502, "INVALID_EXECUTION_RESPONSE");
    }

    logger.info({
      requestId: context.requestId,
      userId: context.userId,
      endpoint: ENDPOINT,
      statusCode: 200,
      message: "Step 5: execution queued",
      metadata: { executionId: payload.executionId },
    });

    return successResponse(payload, context, ENDPOINT);
  } catch (error) {
    return handleApiError(error, context, ENDPOINT);
  }
}
