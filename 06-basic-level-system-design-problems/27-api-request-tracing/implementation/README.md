# Implementation — API request tracing

Request tracing is a **cross-cutting API concern**, not a standalone service. Rather than spin up a
separate app, it is demonstrated inside the shared **Production API Platform**, alongside API
versioning and response standardization (they share the same NestJS middleware stack in real life):

➡️ **[../../12-api-response-standardization/implementation](../../12-api-response-standardization/implementation)**

## Where tracing lives in that code

| Aspect | File |
| --- | --- |
| Accept/generate `X-Request-Id`, set response header, open the context | [`server/src/common/trace.middleware.ts`](../../12-api-response-standardization/implementation/server/src/common/trace.middleware.ts) |
| `AsyncLocalStorage` context: `runWithContext` / `getRequestId` / `propagationHeaders` | [`server/src/common/trace-context.ts`](../../12-api-response-standardization/implementation/server/src/common/trace-context.ts) |
| Logger auto-tagging every line with the current `requestId` | [`server/src/common/logger.ts`](../../12-api-response-standardization/implementation/server/src/common/logger.ts) |
| Downstream propagation (echo the same id) | [`server/src/users/users.service.ts`](../../12-api-response-standardization/implementation/server/src/users/users.service.ts) (`traceDemo`) |
| `requestId` surfaced in every response `meta` | [`server/src/common/response.interceptor.ts`](../../12-api-response-standardization/implementation/server/src/common/response.interceptor.ts) |
| Web console showing `meta.requestId` vs the `X-Request-Id` header | [`web/src/components/ResultView.tsx`](../../12-api-response-standardization/implementation/web/src/components/ResultView.tsx) |

## Key points demonstrated

- **No parameter threading.** The request id is established once in middleware and read anywhere
  (service, logger, interceptor, exception filter) via `AsyncLocalStorage` — never passed as an argument.
- **Correlation everywhere.** The same id appears on the `X-Request-Id` response header, in every log
  line, and in the response `meta` — one id reconstructs the whole request.
- **Inbound ids are honored.** A safe upstream `X-Request-Id` is reused instead of being overwritten,
  so a trace started at the gateway continues through this service.
- **Propagation downstream.** `traceDemo` forwards the propagation headers to a simulated downstream
  service, which echoes back the same id — proving the trace continues across service boundaries.

See the design write-up in [`../README.md`](../README.md) and run instructions in the shared
implementation's [README](../../12-api-response-standardization/implementation/README.md).
