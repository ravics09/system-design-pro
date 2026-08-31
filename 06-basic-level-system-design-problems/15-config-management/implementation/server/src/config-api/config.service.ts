import { Injectable } from '@nestjs/common';
import { config } from '../config';
import { ConfigEngine } from '../engine/engine';

/** Owns the single config engine, seeded with the service's active environment. */
@Injectable()
export class ConfigManagerService {
  readonly engine = new ConfigEngine(config.APP_ENV);
}
