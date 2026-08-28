import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  pairActionSchema,
  requestSchema,
  respondSchema,
  type PairActionInput,
  type RequestInput,
  type RespondInput,
} from './friendships.dto';

/**
 * In production the "acting user" comes from the authenticated session, not the
 * request body — a user can only act on their own relationships. Passed
 * explicitly here to keep the demo runnable without an auth server.
 */
@Controller('friendships')
export class FriendshipsController {
  constructor(private readonly friendships: FriendshipsService) {}

  @Post('request')
  request(@Body(new ZodValidationPipe(requestSchema)) body: RequestInput) {
    return this.friendships.sendRequest(body.from, body.to);
  }

  @Post('respond')
  respond(@Body(new ZodValidationPipe(respondSchema)) body: RespondInput) {
    return this.friendships.respond(body.userId, body.otherId, body.action);
  }

  @Post('cancel')
  cancel(@Body(new ZodValidationPipe(pairActionSchema)) body: PairActionInput) {
    return this.friendships.cancel(body.userId, body.otherId);
  }

  @Post('unfriend')
  unfriend(@Body(new ZodValidationPipe(pairActionSchema)) body: PairActionInput) {
    return this.friendships.unfriend(body.userId, body.otherId);
  }

  @Post('block')
  block(@Body(new ZodValidationPipe(pairActionSchema)) body: PairActionInput) {
    return this.friendships.block(body.userId, body.otherId);
  }

  @Post('unblock')
  unblock(@Body(new ZodValidationPipe(pairActionSchema)) body: PairActionInput) {
    return this.friendships.unblock(body.userId, body.otherId);
  }

  @Get(':userId/overview')
  overview(@Param('userId') userId: string) {
    return this.friendships.overview(userId);
  }

  @Get(':userId/status/:otherId')
  status(@Param('userId') userId: string, @Param('otherId') otherId: string) {
    return this.friendships.status(userId, otherId);
  }
}
