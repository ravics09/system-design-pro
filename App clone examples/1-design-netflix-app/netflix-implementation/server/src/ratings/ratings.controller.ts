import { Body, Controller, Delete, Get, Headers, Param, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard, getUserId } from '../common/auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ProfilesService } from '../profiles/profiles.service';
import { rateSchema, type RateInput } from './ratings.dto';
import { RatingsService } from './ratings.service';

@Controller('ratings')
@UseGuards(AuthGuard)
export class RatingsController {
  constructor(
    private readonly ratings: RatingsService,
    private readonly profiles: ProfilesService,
  ) {}

  private async profile(req: Request, profileId?: string): Promise<string> {
    await this.profiles.assertOwned(getUserId(req), profileId ?? '');
    return profileId as string;
  }

  @Get()
  async forProfile(@Req() req: Request, @Headers('x-profile-id') profileId?: string) {
    return this.ratings.forProfile(await this.profile(req, profileId));
  }

  @Put()
  async set(
    @Req() req: Request,
    @Headers('x-profile-id') profileId: string,
    @Body(new ZodValidationPipe(rateSchema)) body: RateInput,
  ) {
    return this.ratings.set(await this.profile(req, profileId), body.imdbID, body.value);
  }

  @Delete(':imdbID')
  async remove(@Req() req: Request, @Headers('x-profile-id') profileId: string, @Param('imdbID') imdbID: string) {
    return this.ratings.remove(await this.profile(req, profileId), imdbID);
  }
}
