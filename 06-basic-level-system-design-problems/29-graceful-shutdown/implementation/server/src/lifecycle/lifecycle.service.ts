import { Injectable } from '@nestjs/common';
import { config } from '../config';
import { LifecycleManager } from './lifecycle.manager';

/** DI-shared singleton wrapping the pure LifecycleManager, built from config. */
@Injectable()
export class LifecycleService {
  readonly manager = new LifecycleManager(config.PRESTOP_MS, config.DRAIN_DEADLINE_MS);
}
