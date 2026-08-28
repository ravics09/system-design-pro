import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

/** Version-neutral health check → /api/health (still enveloped by the interceptor). */
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  @Get()
  health(): { status: string } {
    return { status: 'ok' };
  }
}
