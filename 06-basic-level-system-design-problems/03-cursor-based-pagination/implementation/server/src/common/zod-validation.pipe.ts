import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import type { ZodType } from 'zod';

/**
 * A NestJS pipe that validates & coerces input against a Zod schema. Using Zod
 * (per the project's stack) instead of class-validator keeps a single validation
 * approach across the codebase and gives precise, structured 400s.
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      });
    }
    return result.data;
  }
}
