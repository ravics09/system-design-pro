import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Url } from './url.schema';
import type { CreateUrlInput, UrlView } from './urls.dto';
import { CounterService } from '../counter/counter.service';
import { encodeBase62 } from '../common/base62';
import { config } from '../config';

@Injectable()
export class UrlsService {
  constructor(
    @InjectModel(Url.name) private readonly urlModel: Model<Url>,
    private readonly counter: CounterService,
  ) {}

  /**
   * Create a short URL.
   *  - custom alias → try to insert with that code; a duplicate-key error (the
   *    unique index doing its job) becomes a clean 409.
   *  - otherwise    → allocate the next counter value and Base62-encode it.
   */
  async create(input: CreateUrlInput): Promise<UrlView> {
    if (input.alias) {
      const exists = await this.urlModel.exists({ code: input.alias });
      if (exists) throw new ConflictException('Alias already taken');
      return this.insert(input.alias, input);
    }

    const seq = await this.counter.next('url');
    const code = encodeBase62(seq + config.CODE_START_OFFSET);
    return this.insert(code, input);
  }

  private async insert(code: string, input: CreateUrlInput): Promise<UrlView> {
    try {
      const doc = await this.urlModel.create({
        code,
        longUrl: input.longUrl,
        ownerId: input.ownerId ?? null,
        expiresAt: input.expiresAt ?? null,
      });
      return toView(doc.toObject() as unknown as UrlRow);
    } catch (err) {
      // Concurrent alias claim (unique index) → 409.
      if (isDuplicateKey(err)) throw new ConflictException('Alias already taken');
      throw err;
    }
  }

  async listByOwner(ownerId: string): Promise<UrlView[]> {
    const rows = (await this.urlModel
      .find({ ownerId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
      .exec()) as unknown as UrlRow[];
    return rows.map(toView);
  }

  /** Owner-scoped disable (soft). Returns 404 if not found / not owner. */
  async disable(code: string, ownerId: string): Promise<void> {
    const res = await this.urlModel.updateOne({ code, ownerId }, { $set: { disabled: true } });
    if (res.matchedCount === 0) throw new NotFoundException('URL not found');
  }
}

interface UrlRow {
  code: string;
  longUrl: string;
  clicks: number;
  disabled: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

function toView(row: UrlRow): UrlView {
  return {
    code: row.code,
    shortUrl: `${config.PUBLIC_BASE_URL.replace(/\/$/, '')}/${row.code}`,
    longUrl: row.longUrl,
    clicks: row.clicks ?? 0,
    disabled: row.disabled ?? false,
    expiresAt: row.expiresAt ? new Date(row.expiresAt).toISOString() : null,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}
