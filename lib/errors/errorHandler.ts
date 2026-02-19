import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/utils/logger";
import type { RequestContext } from "@/lib/types";

function zodIssues(error: ZodError): Record<string, unknown>[] {
  return error.issues.map((issue) => ({
    code: issue.code,
    path: issue.path.join("."),
    message: issue.message,
  }));
}

export function handleApiError(error: unknown, context: RequestContext, endpoint: string) {
  if (error instanceof SyntaxError) {
    logger.warn({
      requestId: context.requestId,
      userId: context.userId,
      endpoint,
      statusCode: 400,
      errorCode: "INVALID_JSON",
      message: "Malformed JSON body",
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_JSON",
          message: "Malformed JSON body",
        },
      },
      { status: 400 },
    );
  }

  if (error instanceof ZodError) {
    logger.warn({
      requestId: context.requestId,
      userId: context.userId,
      endpoint,
      statusCode: 400,
      errorCode: "VALIDATION_ERROR",
      message: "Validation failed",
      metadata: { issues: zodIssues(error) },
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          metadata: { issues: zodIssues(error) },
        },
      },
      { status: 400 },
    );
  }

  if (error instanceof AppError) {
    logger.error({
      requestId: context.requestId,
      userId: context.userId,
      endpoint,
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      message: error.message,
      metadata: error.metadata,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.errorCode,
          message: error.message,
          ...(error.metadata ? { metadata: error.metadata } : {}),
        },
      },
      { status: error.statusCode },
    );
  }

  const fallback = error instanceof Error ? error : new Error("Unknown error");

  logger.error({
    requestId: context.requestId,
    userId: context.userId,
    endpoint,
    statusCode: 500,
    errorCode: "INTERNAL_SERVER_ERROR",
    message: fallback.message,
    stack: fallback.stack,
  });

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    },
    { status: 500 },
  );
}
