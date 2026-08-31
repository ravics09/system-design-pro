import { Injectable } from '@nestjs/common';
import { config } from '../config';
import { IndexEngine } from '../engine/engine';

/** Owns the single in-memory engine instance, seeded on boot. */
@Injectable()
export class QueryService {
  readonly engine = new IndexEngine(config.SEED_SIZE);
}
