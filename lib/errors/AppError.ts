export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly metadata?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    metadata?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.metadata = metadata;
  }
}
