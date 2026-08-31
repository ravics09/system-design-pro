import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ConfigValidationError } from '../engine/resolver';
import { UnknownFlagError } from '../engine/engine';
import { KEY_META } from '../engine/schema';
import { ConfigManagerService } from './config.service';

const value = z.union([z.string(), z.number(), z.boolean()]);
const overrideSchema = z.object({ key: z.string().min(1), value, actor: z.string().default('admin') });
const validateSchema = z.object({ overrides: z.record(value) });
const environmentSchema = z.object({ environment: z.enum(['local', 'dev', 'prod']), actor: z.string().default('admin') });
const flagSchema = z.object({ name: z.string().min(1), value: z.boolean(), actor: z.string().default('admin') });

type OverrideInput = z.infer<typeof overrideSchema>;
type ValidateInput = z.infer<typeof validateSchema>;
type EnvironmentInput = z.infer<typeof environmentSchema>;
type FlagInput = z.infer<typeof flagSchema>;

const isReveal = (v?: string): boolean => v === 'true' || v === '1';

@Controller()
export class ConfigController {
  constructor(private readonly svc: ConfigManagerService) {}

  /** Effective (resolved) config with per-key provenance. Secrets masked unless ?reveal=true. */
  @Get('config')
  getConfig(@Query('reveal') reveal?: string) {
    return this.svc.engine.getResolved(isReveal(reveal));
  }

  /** Per-layer breakdown (defaults → env → env-vars → runtime). */
  @Get('config/layers')
  getLayers(@Query('reveal') reveal?: string) {
    return this.svc.engine.getLayers(isReveal(reveal));
  }

  /** Schema metadata (types, secret markers) for the UI. */
  @Get('config/meta')
  meta() {
    return KEY_META;
  }

  /** Set a runtime override (validated before it takes effect). */
  @Post('config/overrides')
  setOverride(@Body(new ZodValidationPipe(overrideSchema)) body: OverrideInput) {
    try {
      return this.svc.engine.setOverride(body.key, body.value, body.actor);
    } catch (err) {
      if (err instanceof ConfigValidationError) {
        throw new BadRequestException({ message: 'Config validation failed', errors: err.errors });
      }
      throw err;
    }
  }

  @Delete('config/overrides/:key')
  clearOverride(@Param('key') key: string) {
    return this.svc.engine.clearOverride(key, 'admin');
  }

  /** Dry-run validation of a candidate override set (does not persist). */
  @Post('config/validate')
  validate(@Body(new ZodValidationPipe(validateSchema)) body: ValidateInput) {
    return this.svc.engine.validate(body.overrides);
  }

  @Post('config/environment')
  setEnvironment(@Body(new ZodValidationPipe(environmentSchema)) body: EnvironmentInput) {
    return this.svc.engine.setEnvironment(body.environment, body.actor);
  }

  @Get('flags')
  flags() {
    return this.svc.engine.flagsView();
  }

  @Post('flags')
  setFlag(@Body(new ZodValidationPipe(flagSchema)) body: FlagInput) {
    try {
      return this.svc.engine.setFlag(body.name, body.value, body.actor);
    } catch (err) {
      if (err instanceof UnknownFlagError) throw new BadRequestException(err.message);
      throw err;
    }
  }

  @Get('versions')
  versions() {
    return this.svc.engine.versions();
  }

  @Post('versions/:version/rollback')
  rollback(@Param('version') version: string) {
    const result = this.svc.engine.rollback(Number(version), 'admin');
    if (!result) throw new NotFoundException(`Version ${version} not found`);
    return result;
  }

  @Post('reset')
  reset() {
    return this.svc.engine.reset();
  }
}
