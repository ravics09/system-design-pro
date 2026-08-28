# Implementation — API versioning strategy

Versioning is a **cross-cutting API concern**, not a standalone service. Rather than spin up a separate
app, it is demonstrated inside the shared **Production API Platform**, alongside response
standardization and request tracing (they share the same NestJS middleware stack in real life):

➡️ **[../../12-api-response-standardization/implementation](../../12-api-response-standardization/implementation)**

## Where versioning lives in that code

| Aspect | File |
| --- | --- |
| Enabling URI versioning (`/api/v1`, `/api/v2`) + `defaultVersion` | [`server/src/main.ts`](../../12-api-response-standardization/implementation/server/src/main.ts) |
| v1 controller — old `{ id, name }` shape, marked deprecated | [`server/src/users/users.v1.controller.ts`](../../12-api-response-standardization/implementation/server/src/users/users.v1.controller.ts) |
| v2 controller — current shape + pagination + create | [`server/src/users/users.v2.controller.ts`](../../12-api-response-standardization/implementation/server/src/users/users.v2.controller.ts) |
| `Deprecation` / `Sunset` / `Link` headers (RFC 8594) | [`server/src/common/deprecation.interceptor.ts`](../../12-api-response-standardization/implementation/server/src/common/deprecation.interceptor.ts) |
| Shared domain logic reused by both versions | [`server/src/users/users.service.ts`](../../12-api-response-standardization/implementation/server/src/users/users.service.ts) |
| Web console showing v1 vs v2 + the deprecation banner | [`web/src/components/Console.tsx`](../../12-api-response-standardization/implementation/web/src/components/Console.tsx) |

## Key points demonstrated

- **URI versioning** via NestJS `enableVersioning({ type: VersioningType.URI })`. Switching to header
  or media-type versioning is a one-line change of `type` — the controllers stay the same.
- **One service, many representations.** v1 and v2 call the same `UsersService`; only the
  controller/DTO shape differs, so business logic is never duplicated per version.
- **Graceful deprecation.** v1 still works but advertises `Deprecation: true` and a `Sunset` date so
  clients and monitoring can detect and migrate before removal.

See the design write-up in [`../README.md`](../README.md) and run instructions in the shared
implementation's [README](../../12-api-response-standardization/implementation/README.md).
