import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';

export interface UserView {
  id: string;
  name: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly model: Model<User>) {}

  async list(): Promise<UserView[]> {
    const rows = await this.model.find().sort({ _id: 1 }).lean().exec();
    return rows.map((u) => ({ id: u._id, name: u.name }));
  }

  async exists(id: string): Promise<boolean> {
    return (await this.model.exists({ _id: id })) !== null;
  }

  /** Dev helper: reset the demo directory. */
  async seed(): Promise<{ inserted: number }> {
    await this.model.deleteMany({});
    const users = [
      { _id: 'alice', name: 'Alice' },
      { _id: 'bob', name: 'Bob' },
      { _id: 'carol', name: 'Carol' },
      { _id: 'dave', name: 'Dave' },
      { _id: 'erin', name: 'Erin' },
    ];
    await this.model.insertMany(users);
    return { inserted: users.length };
  }
}
