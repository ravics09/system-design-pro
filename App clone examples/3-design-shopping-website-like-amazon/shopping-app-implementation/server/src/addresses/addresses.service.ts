import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Address } from './address.schema';
import type { CreateAddressInput } from './addresses.dto';

export interface AddressView {
  id: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

const view = (a: Record<string, unknown> & { _id: unknown }): AddressView => ({
  id: String(a._id),
  name: a.name as string,
  line1: a.line1 as string,
  line2: (a.line2 as string) ?? '',
  city: a.city as string,
  state: (a.state as string) ?? '',
  zip: a.zip as string,
  country: a.country as string,
  phone: (a.phone as string) ?? '',
});

@Injectable()
export class AddressesService {
  constructor(@InjectModel(Address.name) private readonly model: Model<Address>) {}

  async list(userId: string): Promise<AddressView[]> {
    const rows = await this.model.find({ userId }).sort({ createdAt: -1 }).lean().exec();
    return rows.map((r) => view(r as never));
  }

  async create(userId: string, input: CreateAddressInput): Promise<AddressView> {
    const created = await this.model.create({ userId, ...input });
    return view(created.toObject() as never);
  }

  async remove(userId: string, id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Address not found');
    const res = await this.model.deleteOne({ _id: id, userId }).exec();
    if (res.deletedCount === 0) throw new NotFoundException('Address not found');
  }

  /** Fetch an address owned by the user (used by checkout). Throws if not found. */
  async getOwned(userId: string, id: string): Promise<AddressView> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Address not found');
    const row = await this.model.findOne({ _id: id, userId }).lean().exec();
    if (!row) throw new NotFoundException('Address not found');
    return view(row as never);
  }
}
