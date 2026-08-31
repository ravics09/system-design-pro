import { Body, Controller, Delete, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard, getUserId } from '../common/auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ProfilesService } from '../profiles/profiles.service';
import { addToListSchema, type AddToListInput } from './mylist.dto';
import { MyListService } from './mylist.service';

@Controller('mylist')
@UseGuards(AuthGuard)
export class MyListController {
  constructor(
    private readonly mylist: MyListService,
    private readonly profiles: ProfilesService,
  ) {}

  private async profile(req: Request, profileId?: string): Promise<string> {
    await this.profiles.assertOwned(getUserId(req), profileId ?? '');
    return profileId as string;
  }

  @Get()
  async list(@Req() req: Request, @Headers('x-profile-id') profileId?: string) {
    return this.mylist.list(await this.profile(req, profileId));
  }

  @Post()
  async add(
    @Req() req: Request,
    @Headers('x-profile-id') profileId: string,
    @Body(new ZodValidationPipe(addToListSchema)) body: AddToListInput,
  ) {
    return this.mylist.add(await this.profile(req, profileId), body);
  }

  @Delete(':imdbID')
  async remove(@Req() req: Request, @Headers('x-profile-id') profileId: string, @Param('imdbID') imdbID: string) {
    return this.mylist.remove(await this.profile(req, profileId), imdbID);
  }
}
