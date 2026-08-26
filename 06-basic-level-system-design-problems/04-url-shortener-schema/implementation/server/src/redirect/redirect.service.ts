import { GoneException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Url } from '../urls/url.schema';
import { CacheService } from '../common/cache.service';

const NEGATIVE = '\u0000404'; // sentinel cached for unknown codes (penetration guard)

@Injectable()
export class RedirectService {
  private readonly logger = new Logger(RedirectService.name);

  constructor(
    @InjectModel(Url.name) private readonly urlModel: Model<Url>,
    private readonly cache: CacheService,
  ) {}

  /**
   * Resolve a short code to its long URL using CACHE-ASIDE:
   *   1. cache hit → return immediately (the hot path).
   *   2. cache miss → read DB, backfill cache, return.
   * Returns the long URL, or throws 404 (unknown) / 410 (expired or disabled).
   */
  async resolve(code: string): Promise<string> {
    const cached = await this.cache.get(key(code));
    if (cached === NEGATIVE) throw new NotFoundException('Short URL not found');
    if (cached) {
      this.recordClick(code);
      return cached;
    }

    const doc = await this.urlModel.findOne({ code }).lean().exec();
    if (!doc) {
      await this.cache.set(key(code), NEGATIVE, 60); // brief negative cache
      throw new NotFoundException('Short URL not found');
    }

    // Expired (TTL sweeper is periodic, so verify at read time) or disabled → 410.
    if (doc.disabled || (doc.expiresAt && new Date(doc.expiresAt).getTime() <= Date.now())) {
      throw new GoneException('Short URL is no longer available');
    }

    await this.cache.set(key(code), doc.longUrl);
    this.recordClick(code);
    return doc.longUrl;
  }

  /**
   * Analytics are OFF the critical path: fire-and-forget. A failure here must
   * never affect the redirect. In production this would emit to a queue; here we
   * bump a counter without awaiting.
   */
  private recordClick(code: string): void {
    void this.urlModel
      .updateOne({ code }, { $inc: { clicks: 1 } })
      .exec()
      .catch((e) => this.logger.warn(`click update failed for ${code}: ${String(e)}`));
  }
}

function key(code: string): string {
  return `url:${code}`;
}
