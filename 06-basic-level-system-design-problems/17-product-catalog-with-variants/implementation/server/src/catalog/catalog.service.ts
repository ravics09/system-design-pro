import { Injectable } from '@nestjs/common';
import { config } from '../config';
import { CatalogEngine } from '../engine/catalog';

/** Owns the single in-memory catalog engine (seeded on boot). */
@Injectable()
export class CatalogService {
  readonly engine = new CatalogEngine(config.MAX_VARIANTS);
}
