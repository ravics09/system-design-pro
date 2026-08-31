import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { LifecycleService } from './lifecycle.service';

/** Control/observability paths that must keep working during drain and are NOT counted. */
const EXCLUDED = new Set(['/health/live', '/health/ready', '/status', '/shutdown', '/reset']);

/**
 * Tracks in-flight requests and enforces the drain: once draining, new "real" requests get
 * 503 + Retry-After (the LB should already have stopped routing), while requests already
 * in flight are allowed to finish. Health/status/control endpoints are exempt.
 */
@Injectable()
export class InflightMiddleware implements NestMiddleware {
  constructor(private readonly lc: LifecycleService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // originalUrl is reliable for globally-mounted middleware (req.path can be '/').
    const path = (req.originalUrl || req.url || '').split('?')[0].replace(/\/$/, '') || '/';
    if (EXCLUDED.has(path)) {
      next();
      return;
    }
    if (!this.lc.manager.isAccepting) {
      res.setHeader('Retry-After', '5');
      res.status(503).json({ error: 'SHUTTING_DOWN', message: 'Server is draining, please retry' });
      return;
    }
    this.lc.manager.enter();
    let left = false;
    const leave = (): void => {
      if (left) return;
      left = true;
      this.lc.manager.leave();
    };
    res.on('finish', leave);
    res.on('close', leave);
    next();
  }
}
