import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  traceId: string;
  userId: string | null;
}

const als = new AsyncLocalStorage<RequestContext>();

/** Run `fn` (and everything it asynchronously spawns) with the given context bound. */
export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return als.run(ctx, fn);
}

/** Read the context for the currently-executing async chain (undefined outside a run). */
export function getContext(): RequestContext | undefined {
  return als.getStore();
}

/** A logger that auto-attaches the current request's traceId — no argument threading. */
export function log(message: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  const ctx = getContext();
  return { traceId: ctx?.traceId ?? null, userId: ctx?.userId ?? null, message, ...extra };
}
