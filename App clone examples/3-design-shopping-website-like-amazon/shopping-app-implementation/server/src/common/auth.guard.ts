import { CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { verifyAccessToken } from './tokens';

/** Requests carrying a valid Bearer access token proceed with `req.userId` set. */
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { userId?: string }>();
    const header = req.headers['authorization'];
    const token = typeof header === 'string' ? header.replace(/^Bearer\s+/i, '') : '';
    const payload = verifyAccessToken(token);
    if (!payload) throw new UnauthorizedException('Invalid or expired access token');
    req.userId = payload.sub;
    return true;
  }
}

/** Read the authenticated userId the guard attached (throws if the guard didn't run). */
export function getUserId(req: Request & { userId?: string }): string {
  if (!req.userId) throw new UnauthorizedException('Not authenticated');
  return req.userId;
}
