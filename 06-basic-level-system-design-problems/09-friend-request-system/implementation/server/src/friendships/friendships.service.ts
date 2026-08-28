import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Friendship } from './friendship.schema';
import { UsersService } from '../users/users.service';
import { pairKey } from '../config';
import type { OverviewView, PerspectiveStatus, StatusView } from './friendships.dto';

interface FriendshipRow {
  requesterId: string;
  addresseeId: string;
  status: string;
  pairKey: string;
}

@Injectable()
export class FriendshipsService {
  private readonly logger = new Logger(FriendshipsService.name);

  constructor(
    @InjectModel(Friendship.name) private readonly model: Model<Friendship>,
    private readonly users: UsersService,
  ) {}

  /**
   * Send a friend request. The canonical pairKey + unique index guarantees a
   * single row per pair; a concurrent insert that loses the race is resolved by
   * re-reading and applying the state machine (auto-accept on mutual pending).
   */
  async sendRequest(from: string, to: string): Promise<StatusView> {
    if (from === to) throw new BadRequestException('Cannot friend yourself');
    if (!(await this.users.exists(from)) || !(await this.users.exists(to))) {
      throw new BadRequestException('Unknown user');
    }

    const key = pairKey(from, to);
    const existing = (await this.model.findOne({ pairKey: key }).lean().exec()) as FriendshipRow | null;
    if (existing) return this.applyOnExisting(existing, from, to);

    try {
      await this.model.create({ requesterId: from, addresseeId: to, status: 'PENDING', pairKey: key });
      this.publish('friend_request_received', { from, to });
      return { userId: from, otherId: to, status: 'REQUEST_SENT' };
    } catch (err) {
      if (isDuplicateKey(err)) {
        const again = (await this.model.findOne({ pairKey: key }).lean().exec()) as FriendshipRow;
        return this.applyOnExisting(again, from, to);
      }
      throw err;
    }
  }

  /** Resolve a send against an existing row (the state machine's core branch). */
  private async applyOnExisting(row: FriendshipRow, from: string, to: string): Promise<StatusView> {
    switch (row.status) {
      case 'BLOCKED':
        throw new ForbiddenException('You cannot send a request to this user');
      case 'ACCEPTED':
        throw new ConflictException('You are already friends');
      case 'PENDING':
        if (row.requesterId === from) {
          return { userId: from, otherId: to, status: 'REQUEST_SENT' }; // idempotent re-send
        }
        // Reverse pending (they already requested you) → auto-accept.
        await this.model.updateOne({ pairKey: row.pairKey }, { $set: { status: 'ACCEPTED' } });
        this.publish('friend_request_accepted', { from, to });
        return { userId: from, otherId: to, status: 'FRIENDS' };
      case 'DECLINED':
      default:
        // Re-send after a decline: reset to a fresh PENDING in the new direction.
        await this.model.updateOne(
          { pairKey: row.pairKey },
          { $set: { requesterId: from, addresseeId: to, status: 'PENDING' } },
        );
        this.publish('friend_request_received', { from, to });
        return { userId: from, otherId: to, status: 'REQUEST_SENT' };
    }
  }

  /** Accept or decline a request addressed to `userId` from `otherId`. */
  async respond(userId: string, otherId: string, action: 'accept' | 'decline'): Promise<StatusView> {
    const key = pairKey(userId, otherId);
    const row = (await this.model.findOne({ pairKey: key }).lean().exec()) as FriendshipRow | null;
    // Only the addressee of a PENDING request may respond.
    if (!row || row.status !== 'PENDING' || row.addresseeId !== userId || row.requesterId !== otherId) {
      throw new NotFoundException('No pending request from this user');
    }
    if (action === 'accept') {
      await this.model.updateOne({ pairKey: key }, { $set: { status: 'ACCEPTED' } });
      this.publish('friend_request_accepted', { from: userId, to: otherId });
      return { userId, otherId, status: 'FRIENDS' };
    }
    await this.model.updateOne({ pairKey: key }, { $set: { status: 'DECLINED' } });
    return { userId, otherId, status: 'NONE' };
  }

  /** Requester cancels their own outgoing PENDING request. */
  async cancel(userId: string, otherId: string): Promise<StatusView> {
    const key = pairKey(userId, otherId);
    const res = await this.model.deleteOne({
      pairKey: key,
      status: 'PENDING',
      requesterId: userId,
      addresseeId: otherId,
    });
    if (res.deletedCount === 0) throw new NotFoundException('No outgoing request to cancel');
    return { userId, otherId, status: 'NONE' };
  }

  /** Remove an existing friendship. */
  async unfriend(userId: string, otherId: string): Promise<StatusView> {
    const key = pairKey(userId, otherId);
    const res = await this.model.deleteOne({ pairKey: key, status: 'ACCEPTED' });
    if (res.deletedCount === 0) throw new NotFoundException('You are not friends with this user');
    return { userId, otherId, status: 'NONE' };
  }

  /**
   * Block a user: overwrite the pair row to BLOCKED (blocker = userId). This
   * removes any friendship/pending and prevents new requests in both directions.
   */
  async block(userId: string, otherId: string): Promise<StatusView> {
    if (userId === otherId) throw new BadRequestException('Cannot block yourself');
    const key = pairKey(userId, otherId);
    await this.model.updateOne(
      { pairKey: key },
      { $set: { requesterId: userId, addresseeId: otherId, status: 'BLOCKED', pairKey: key } },
      { upsert: true },
    );
    return { userId, otherId, status: 'BLOCKED' };
  }

  /** Unblock — only the blocker can clear their block. */
  async unblock(userId: string, otherId: string): Promise<StatusView> {
    const key = pairKey(userId, otherId);
    const res = await this.model.deleteOne({ pairKey: key, status: 'BLOCKED', requesterId: userId });
    if (res.deletedCount === 0) throw new NotFoundException('No block to remove');
    return { userId, otherId, status: 'NONE' };
  }

  /** Relationship between two users, from `userId`'s perspective. */
  async status(userId: string, otherId: string): Promise<StatusView> {
    if (userId === otherId) return { userId, otherId, status: 'NONE' };
    const row = (await this.model
      .findOne({ pairKey: pairKey(userId, otherId) })
      .lean()
      .exec()) as FriendshipRow | null;
    return { userId, otherId, status: perspective(row, userId) };
  }

  /** Everything about `userId`'s relationships, grouped for the UI. */
  async overview(userId: string): Promise<OverviewView> {
    const rows = (await this.model
      .find({ $or: [{ requesterId: userId }, { addresseeId: userId }] })
      .lean()
      .exec()) as FriendshipRow[];

    const out: OverviewView = {
      userId,
      friends: [],
      incoming: [],
      outgoing: [],
      blocked: [],
      blockedBy: [],
    };

    for (const row of rows) {
      const other = row.requesterId === userId ? row.addresseeId : row.requesterId;
      switch (row.status) {
        case 'ACCEPTED':
          out.friends.push(other);
          break;
        case 'PENDING':
          if (row.addresseeId === userId) out.incoming.push(other);
          else out.outgoing.push(other);
          break;
        case 'BLOCKED':
          if (row.requesterId === userId) out.blocked.push(other);
          else out.blockedBy.push(other);
          break;
        default:
          break; // DECLINED → treated as NONE
      }
    }
    return out;
  }

  /**
   * Publish a domain event. In production this enqueues to the notification
   * service (Problem 08) for real-time WebSocket delivery + push + history.
   */
  private publish(event: string, payload: Record<string, string>): void {
    this.logger.log(`event=${event} ${JSON.stringify(payload)}`);
  }
}

function perspective(row: FriendshipRow | null, userId: string): PerspectiveStatus {
  if (!row) return 'NONE';
  switch (row.status) {
    case 'ACCEPTED':
      return 'FRIENDS';
    case 'BLOCKED':
      return row.requesterId === userId ? 'BLOCKED' : 'BLOCKED_BY';
    case 'PENDING':
      return row.requesterId === userId ? 'REQUEST_SENT' : 'REQUEST_RECEIVED';
    default:
      return 'NONE';
  }
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}
