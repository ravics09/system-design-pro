/**
 * A domain error carrying a STABLE machine-readable `code` alongside an HTTP
 * status. Services throw these; the exception filter maps them straight onto the
 * error envelope. Codes are part of the API contract (clients branch on them).
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
