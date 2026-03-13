export class HttpError extends Error {
  status: number;
  details?: Record<string, unknown>;
  headers?: HeadersInit;

  constructor(status: number, message: string, options?: { details?: Record<string, unknown>; headers?: HeadersInit }) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = options?.details;
    this.headers = options?.headers;
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}
