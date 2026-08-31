import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MyListItem } from './mylist.schema';
import type { AddToListInput } from './mylist.dto';

export interface MyListView {
  imdbID: string;
  title: string;
  poster: string | null;
  addedAt: string;
}

@Injectable()
export class MyListService {
  constructor(@InjectModel(MyListItem.name) private readonly model: Model<MyListItem>) {}

  async list(profileId: string): Promise<MyListView[]> {
    const rows = await this.model.find({ profileId }).sort({ createdAt: -1 }).lean().exec();
    return rows.map((r) => ({
      imdbID: r.imdbID,
      title: r.title,
      poster: r.poster ?? null,
      addedAt: (r as { createdAt?: Date }).createdAt?.toISOString() ?? '',
    }));
  }

  /** Idempotent add (upsert on the unique (profileId, imdbID) key). */
  async add(profileId: string, input: AddToListInput): Promise<{ ok: true }> {
    await this.model.updateOne(
      { profileId, imdbID: input.imdbID },
      { $set: { title: input.title, poster: input.poster ?? null } },
      { upsert: true },
    ).exec();
    return { ok: true };
  }

  async remove(profileId: string, imdbID: string): Promise<{ ok: true }> {
    await this.model.deleteOne({ profileId, imdbID }).exec();
    return { ok: true };
  }
}
