import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  broadcastSchema,
  emitSchema,
  listSchema,
  markReadSchema,
  unreadSchema,
  type BroadcastInput,
  type EmitInput,
  type ListInput,
  type MarkReadInput,
  type UnreadInput,
} from './notifications.dto';

/**
 * REST surface. In production the emit endpoints sit behind producer services /
 * a queue; here they double as a demo trigger. Reads (history, unread) and
 * mark-read are the client-facing endpoints.
 */
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  @Post()
  emit(@Body(new ZodValidationPipe(emitSchema)) body: EmitInput) {
    return this.service.emitToUser(body);
  }

  @Post('broadcast')
  broadcast(@Body(new ZodValidationPipe(broadcastSchema)) body: BroadcastInput) {
    return this.service.emitToMany(body);
  }

  @Get()
  list(@Query(new ZodValidationPipe(listSchema)) query: ListInput) {
    return this.service.list(query);
  }

  @Get('unread-count')
  unread(@Query(new ZodValidationPipe(unreadSchema)) query: UnreadInput) {
    return this.service.unreadCount(query.userId);
  }

  @Post('mark-read')
  markRead(@Body(new ZodValidationPipe(markReadSchema)) body: MarkReadInput) {
    return this.service.markRead(body);
  }
}
