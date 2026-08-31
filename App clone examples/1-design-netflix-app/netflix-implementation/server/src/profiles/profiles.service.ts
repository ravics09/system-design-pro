import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { config } from '../config';
import { Profile } from './profile.schema';
import type { CreateProfileInput } from './profiles.dto';

export interface ProfileView {
  id: string;
  name: string;
  avatar: string;
  isKids: boolean;
}

const view = (p: { _id: unknown; name: string; avatar: string; isKids: boolean }): ProfileView => ({
  id: String(p._id),
  name: p.name,
  avatar: p.avatar,
  isKids: p.isKids,
});

@Injectable()
export class ProfilesService {
  constructor(@InjectModel(Profile.name) private readonly profiles: Model<Profile>) {}

  async list(userId: string): Promise<ProfileView[]> {
    const rows = await this.profiles.find({ userId }).sort({ createdAt: 1 }).lean().exec();
    return rows.map((p) => view(p as never));
  }

  async create(userId: string, input: CreateProfileInput): Promise<ProfileView> {
    const count = await this.profiles.countDocuments({ userId }).exec();
    if (count >= config.MAX_PROFILES) {
      throw new BadRequestException(`Maximum of ${config.MAX_PROFILES} profiles per account`);
    }
    const created = await this.profiles.create({ userId, ...input });
    return view(created);
  }

  async remove(userId: string, profileId: string): Promise<void> {
    if (!Types.ObjectId.isValid(profileId)) throw new NotFoundException('Profile not found');
    const res = await this.profiles.deleteOne({ _id: profileId, userId }).exec();
    if (res.deletedCount === 0) throw new NotFoundException('Profile not found');
  }

  /** Verify a profile belongs to the user — used by every per-profile feature. */
  async assertOwned(userId: string, profileId: string): Promise<void> {
    if (!profileId || !Types.ObjectId.isValid(profileId)) {
      throw new BadRequestException('A valid x-profile-id header is required');
    }
    const owned = await this.profiles.exists({ _id: profileId, userId }).exec();
    if (!owned) throw new ForbiddenException('Profile does not belong to this account');
  }
}
