/** Mirror of the server's standardized envelope + meta. */
export interface PageInfo {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export interface Meta {
  requestId: string;
  timestamp: string;
  version: string;
  pagination?: PageInfo;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  meta: Meta;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string; details?: unknown };
  meta: Meta;
}

export type ApiEnvelope<T = unknown> = ApiSuccess<T> | ApiError;

export interface UserV1 {
  id: string;
  name: string;
}

export interface UserV2 {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface CreateUserBody {
  firstName: string;
  lastName: string;
  email: string;
}

export interface TraceDemo {
  requestId: string;
  downstream: { receivedRequestId: string | null };
}

/**
 * What every console call resolves to: the parsed envelope PLUS the transport
 * facts we want to surface (HTTP status + the tracing/deprecation response
 * headers read off the raw Response).
 */
export interface CallResult<T = unknown> {
  status: number;
  ok: boolean;
  envelope: ApiEnvelope<T>;
  requestIdHeader: string | null;
  deprecation: string | null;
  sunset: string | null;
}
