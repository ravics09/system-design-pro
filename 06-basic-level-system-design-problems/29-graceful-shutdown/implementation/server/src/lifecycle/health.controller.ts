import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { LifecycleService } from './lifecycle.service';

/**
 * Liveness vs readiness — the key distinction:
 *  - liveness stays healthy while draining (don't let the orchestrator restart us);
 *  - readiness fails while draining so the load balancer takes us out of rotation.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly lc: LifecycleService) {}

  @Get('live')
  live() {
    return { status: 'ok', phase: this.lc.manager.phase };
  }

  @Get('ready')
  ready() {
    if (!this.lc.manager.isAccepting) {
      throw new ServiceUnavailableException({ status: 'not-ready', phase: this.lc.manager.phase });
    }
    return { status: 'ready', phase: this.lc.manager.phase };
  }
}
