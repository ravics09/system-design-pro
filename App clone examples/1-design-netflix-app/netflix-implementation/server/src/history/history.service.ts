import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Progress } from './progress.schema';
import type { ProgressInput } from './history.dto';

export interface ProgressView {
  imdbID: string;
  title: string;
  poster: string | null;
  positionS: number;
  durationS: number;
  percent: number;
  updatedAt: string;
}

const view = (r: {
  imdbID: string;
  title: string;
  poster: string | null;
  positionS: number;
  durationS: number;
  updatedAt?: Date;
}): ProgressView => ({
  imdbID: r.imdbID,
  title: r.title,
  poster: r.poster ?? null,
  positionS: r.positionS,
  durationS: r.durationS,
  percent: r.durationS > 0 ? Math.min(100, Math.round((r.positionS / r.durationS) * 100)) : 0,
  updatedAt: r.updatedAt?.toISOString() ?? '',
});

@Injectable()
export class HistoryService {
  constructor(@InjectModel(Progress.name) private readonly model: Model<Progress>) {}

  /** Upsert the latest playback position (idempotent heartbeat). */
  async record(profileId: string, input: ProgressInput): Promise<ProgressView> {
    const doc = await this.model
      .findOneAndUpdate(
        { profileId, imdbID: input.imdbID },
        {
          $set: {
            title: input.title,
            poster: input.poster ?? null,
            positionS: input.positionS,
            durationS: input.durationS,
          },
        },
        { upsert: true, new: true },
      )
      .lean()
      .exec();
    return view(doc as never);
  }

  /** Recently-watched, not-yet-finished titles — the "Continue Watching" row. */
  async continueWatching(profileId: string): Promise<ProgressView[]> {
    const rows = await this.model
      .find({ profileId, positionS: { $gt: 0 } })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean()
      .exec();
    return rows
      .map((r) => view(r as never))
      .filter((r) => r.durationS === 0 || r.percent < 95);
  }
}
