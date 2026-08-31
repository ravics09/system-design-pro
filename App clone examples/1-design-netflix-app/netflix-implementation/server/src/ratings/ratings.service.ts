import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rating } from './rating.schema';

export type RatingValue = 'up' | 'down';

@Injectable()
export class RatingsService {
  constructor(@InjectModel(Rating.name) private readonly model: Model<Rating>) {}

  /** Set (or change) the rating — idempotent upsert on (profileId, imdbID). */
  async set(profileId: string, imdbID: string, value: RatingValue): Promise<{ ok: true }> {
    await this.model.updateOne({ profileId, imdbID }, { $set: { value } }, { upsert: true }).exec();
    return { ok: true };
  }

  async remove(profileId: string, imdbID: string): Promise<{ ok: true }> {
    await this.model.deleteOne({ profileId, imdbID }).exec();
    return { ok: true };
  }

  /** All ratings for a profile as an { imdbID: value } map (for the UI). */
  async forProfile(profileId: string): Promise<Record<string, RatingValue>> {
    const rows = await this.model.find({ profileId }).lean().exec();
    const out: Record<string, RatingValue> = {};
    for (const r of rows) out[r.imdbID] = r.value;
    return out;
  }
}
