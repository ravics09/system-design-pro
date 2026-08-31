import { randomUUID } from 'node:crypto';
import { Body, Controller, Get, Headers, Ip, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { contactSchema, type ContactInput, type SubmissionStatus } from './contact.types';
import { ContactService } from './contact.service';

@Controller()
export class ContactController {
  constructor(private readonly svc: ContactService) {}

  /** Public submit endpoint. Idempotency key from a header (or generated); IP from the request. */
  @Post('contact')
  submit(
    @Body(new ZodValidationPipe(contactSchema)) body: ContactInput,
    @Ip() ip: string,
    @Headers('x-idempotency-key') idem?: string,
  ) {
    return this.svc.submit(body, ip || 'unknown', idem || randomUUID());
  }

  /** Admin listing, filterable by status and spam flag. */
  @Get('contact')
  list(@Query('status') status?: string, @Query('spam') spam?: string) {
    return this.svc.list({
      status: status as SubmissionStatus | undefined,
      spam: spam === 'true',
    });
  }

  @Get('stats')
  stats() {
    return this.svc.stats();
  }

  @Get('contact/:id')
  get(@Param('id') id: string) {
    const s = this.svc.get(id);
    if (!s) throw new NotFoundException(`Submission ${id} not found`);
    return s;
  }

  @Post('reset')
  reset() {
    this.svc.reset();
    return { ok: true };
  }
}
