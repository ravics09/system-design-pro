import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';
import { validate } from './validate';

/**
 * Reusable pipe: parse+coerce a request part (body/query/params) against a Zod schema.
 * On failure it throws a consistent, field-keyed 400 (VALIDATION_ERROR) that a UI can
 * render inline; on success the handler receives the clean, typed, unknown-stripped value.
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = validate(this.schema, value);
    if (!result.ok) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        fieldErrors: result.fieldErrors,
        formErrors: result.formErrors,
      });
    }
    return result.data;
  }
}
