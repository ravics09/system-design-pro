import { Controller, Get } from '@nestjs/common';

/** Liveness probe for Docker / orchestrators (served at /api/health). */
@Controller('health')
export class HealthController {
  @Get()
  health() {
    return { status: 'ok', service: 'shopping-app-api', ts: Date.now() };
  }
}
