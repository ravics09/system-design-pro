import { Injectable, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';
import { AppError } from './app-error';

/**
 * Validates input against a Zod schema. On failure it throws an AppError with a
 * stable `VALIDATION_ERROR` code and a field→messages map, so the exception
 * filter renders it in the standard error envelope.
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', {
        fieldErrors: result.error.flatten().fieldErrors,
      });
    }
    return result.data;
  }
}
