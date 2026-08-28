# Server — NestJS API platform

NestJS (TypeScript, CommonJS) API demonstrating standardized response envelopes, URI versioning, and
request-id tracing. No database — users are in-memory, so `npm install` is all the setup needed.

## Run

> npm is under nvm here; if `npm` is missing, run `export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"` first.

```bash
npm install
npm run build && npm start   # http://localhost:3008
# or hot reload:
npm run start:dev
# type-check only:
npm run typecheck
```

Config is validated at boot by `src/config.ts` (Zod). Copy `.env.example` → `.env` to override:

| Var | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3008` | Listen port. |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed web origin. |
| `DEFAULT_VERSION` | `2` | Version used when the URL omits `/vN`. |
| `V1_SUNSET` | `Wed, 31 Dec 2026 23:59:59 GMT` | Value of the `Sunset` header on v1. |

## How the three concerns map to code

### Response standardization
- `common/envelope.ts` — the `ApiSuccess` / `ApiError` / `Meta` types + the `Paginated<T>` marker.
- `common/response.interceptor.ts` — wraps every controller return value in the success envelope and
  fills `meta` (a `Paginated` return is lifted into `meta.pagination`).
- `common/all-exceptions.filter.ts` — turns any thrown error into the error envelope; `AppError`
  carries its own `status` + machine `code`, `HttpException` is mapped, anything else → `500 INTERNAL`.
- `common/app-error.ts` / `common/zod-validation.pipe.ts` — domain errors + input validation
  (`VALIDATION_ERROR` with a `fieldErrors` map).

### Versioning
- `main.ts` — `setGlobalPrefix('api')` + `enableVersioning({ type: VersioningType.URI, defaultVersion })`.
  Switching to header/media-type versioning is a one-line change of `type`.
- `users/users.v1.controller.ts` — `@Controller({ path: 'users', version: '1' })`, old `{ id, name }`
  shape, decorated with `DeprecationInterceptor`.
- `users/users.v2.controller.ts` — `version: '2'`, richer shape + pagination + create + trace-demo.
- `common/deprecation.interceptor.ts` — advertises `Deprecation` / `Sunset` / `Link` headers (RFC 8594).
- Both controllers call the **same** `UsersService` — only presentation differs between versions.

### Tracing
- `common/trace.middleware.ts` — honors an inbound `X-Request-Id` (or generates one), sets it on the
  response, and runs the rest of the pipeline inside an `AsyncLocalStorage` context; logs start/finish + duration.
- `common/trace-context.ts` — `runWithContext` / `getRequestId` / `propagationHeaders` (headers to
  forward downstream so the trace continues).
- `common/logger.ts` — every log line is auto-tagged with the current `requestId`.
- `users/users.service.ts` — `traceDemo()` forwards the propagation headers to a simulated downstream
  service that echoes back the same id.
