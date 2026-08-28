import { AsyncLocalStorage } from 'node:async_hooks';

/** Per-request context carried implicitly across async boundaries. */
export interface RequestContext {
  requestId: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

/** Run `fn` (and everything it awaits) within a request context. */
export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

/** Read the current request id anywhere — no parameter threading. */
export function getRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}

/**
 * Headers to forward on downstream calls so the SAME id continues the trace.
 * (`X-Request-Id` for our correlation id; `traceparent` in a real W3C setup.)
 */
export function propagationHeaders(): Record<string, string> {
  const id = getRequestId();
  return id ? { 'X-Request-Id': id } : {};
}
