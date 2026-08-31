import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ZodValidationPipe } from '../validation/zod-validation.pipe';
import { SizeGuard } from '../validation/size.guard';
import {
  createUserSchema,
  dateRangeSchema,
  idParamSchema,
  searchSchema,
  type CreateUserInput,
  type DateRangeInput,
  type IdParam,
  type SearchInput,
} from '../validation/schemas';

@Controller()
export class DemoController {
  /** Body validation: coerces `age`, strips unknown keys (e.g. isAdmin), nested address. */
  @Post('users')
  createUser(@Body(new ZodValidationPipe(createUserSchema)) body: CreateUserInput) {
    return { received: body, note: 'unknown keys stripped, types coerced' };
  }

  /** Query validation: strings coerced to number/boolean, pagination defaults applied. */
  @Get('search')
  search(@Query(new ZodValidationPipe(searchSchema)) query: SearchInput) {
    return { query };
  }

  /** Param validation: the path id is coerced + constrained to a positive integer. */
  @Get('users/:id')
  getUser(@Param(new ZodValidationPipe(idParamSchema)) params: IdParam) {
    return { id: params.id };
  }

  /** Cross-field refinement: a bad range fails as a formError. */
  @Post('date-range')
  dateRange(@Body(new ZodValidationPipe(dateRangeSchema)) body: DateRangeInput) {
    return { range: body };
  }

  /** Size/depth guard runs before the body is processed → 413 / 400 on oversized input. */
  @Post('upload')
  @UseGuards(SizeGuard)
  upload(@Body() body: unknown) {
    return { ok: true, bytes: Buffer.byteLength(JSON.stringify(body ?? {})) };
  }
}
