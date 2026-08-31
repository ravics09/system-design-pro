import {
  BadRequestException,
  CanActivate,
  type ExecutionContext,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { config } from '../config';

/** Nesting depth of a JSON value (objects + arrays). */
export function depthOf(value: unknown, current = 1): number {
  if (value === null || typeof value !== 'object') return current;
  let max = current;
  for (const v of Object.values(value as Record<string, unknown>)) {
    max = Math.max(max, depthOf(v, current + 1));
  }
  return max;
}

/**
 * Fail-fast DoS guard that runs BEFORE the validation pipe: reject oversized bodies (413)
 * and pathologically deep payloads (400) before spending CPU on a full schema parse.
 */
@Injectable()
export class SizeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ body?: unknown }>();
    const body = req.body ?? {};
    const bytes = Buffer.byteLength(JSON.stringify(body));
    if (bytes > config.MAX_BODY_BYTES) {
      throw new PayloadTooLargeException(`Body ${bytes} bytes exceeds limit ${config.MAX_BODY_BYTES}`);
    }
    if (depthOf(body) > config.MAX_DEPTH) {
      throw new BadRequestException(`Payload nesting exceeds max depth ${config.MAX_DEPTH}`);
    }
    return true;
  }
}
