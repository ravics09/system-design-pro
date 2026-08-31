import { Body, Controller, Get, Headers, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard, getUserId } from '../common/auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ProfilesService } from '../profiles/profiles.service';
import { progressSchema, type ProgressInput } from './history.dto';
import { HistoryService } from './history.service';

@Controller('history')
@UseGuards(AuthGuard)
export class HistoryController {
  constructor(
    private readonly history: HistoryService,
    private readonly profiles: ProfilesService,
  ) {}

  private async profile(req: Request, profileId?: string): Promise<string> {
    await this.profiles.assertOwned(getUserId(req), profileId ?? '');
    return profileId as string;
  }

  /** Player heartbeat: save/resume the current position. */
  @Put()
  async record(
    @Req() req: Request,
    @Headers('x-profile-id') profileId: string,
    @Body(new ZodValidationPipe(progressSchema)) body: ProgressInput,
  ) {
    return this.history.record(await this.profile(req, profileId), body);
  }

  @Get('continue')
  async continueWatching(@Req() req: Request, @Headers('x-profile-id') profileId?: string) {
    return this.history.continueWatching(await this.profile(req, profileId));
  }
}
