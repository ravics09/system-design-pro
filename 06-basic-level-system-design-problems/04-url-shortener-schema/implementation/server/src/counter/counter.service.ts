import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter } from './counter.schema';

@Injectable()
export class CounterService {
  constructor(@InjectModel(Counter.name) private readonly counterModel: Model<Counter>) {}

  /**
   * Atomically increment and return the next value for `name`.
   *
   * `findOneAndUpdate` with `$inc` + upsert is a single atomic operation, so two
   * concurrent creates can never receive the same number — no locks needed.
   *
   * At very high write throughput you would hand each app instance a *block* of
   * ids (e.g. increment by 1000, then allocate locally) to avoid a hot document.
   */
  async next(name = 'url'): Promise<number> {
    const doc = await this.counterModel
      .findByIdAndUpdate(name, { $inc: { seq: 1 } }, { new: true, upsert: true })
      .lean()
      .exec();
    return doc!.seq;
  }
}
