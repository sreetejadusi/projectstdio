export class ApiHttpError extends Error {
  code: string;
  status: number;
  metadata?: Record<string, unknown>;

  constructor(message: string, code: string, status: number, metadata?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.status = status;
    this.metadata = metadata;
  }
}

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        success?: boolean;
        data?: T;
        error?: { code?: string; message?: string; metadata?: Record<string, unknown> };
      }
    | null;

  if (!response.ok || !payload?.success) {
    throw new ApiHttpError(
      payload?.error?.message || `Request failed (${response.status})`,
      payload?.error?.code || "REQUEST_FAILED",
      response.status,
      payload?.error?.metadata,
    );
  }

  return payload.data as T;
}
