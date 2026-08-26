import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { RedirectService } from './redirect.service';

/**
 * Read/redirect path. `GET /:code` issues a 302 to the long URL.
 *
 * 302 (not 301) by default so we keep control: destinations can be disabled and
 * analytics stay meaningful (301s get cached hard by browsers). Unknown → 404,
 * expired/disabled → 410 (handled by the exception filters via thrown errors).
 */
@Controller()
export class RedirectController {
  constructor(private readonly redirectService: RedirectService) {}

  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  @Get(':code')
  async redirect(@Param('code') code: string, @Res() res: Response): Promise<void> {
    const longUrl = await this.redirectService.resolve(code);
    res.redirect(302, longUrl);
  }
}
