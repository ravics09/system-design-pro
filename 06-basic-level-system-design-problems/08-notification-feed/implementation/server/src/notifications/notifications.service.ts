import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, type FilterQuery } from 'mongoose';
import { Notification } from './notification.schema';
import { UnreadStore } from './unread.store';
import { NotificationsGateway } from './notifications.gateway';
import type {
  BroadcastInput,
  EmitInput,
  ListInput,
  MarkReadInput,
  NotificationView,
  Paginated,
} from './notifications.dto';

interface LeanNotif {
  _id: Types.ObjectId;
  userId: string;
  type: string;
  actorId: string | null;
  entityId: string | null;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

interface Cursor {
  v: string;
  id: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private readonly model: Model<Notification>,
    private readonly unread: UnreadStore,
    private readonly gateway: NotificationsGateway,
  ) {}

  /**
   * Emit to one user: persist (idempotent via dedupeKey), bump the unread
   * counter, and push the notification over the socket to any online device.
   * A duplicate (same dedupeKey) is a no-op — no double count, no double emit.
   */
  async emitToUser(input: EmitInput): Promise<NotificationView> {
    let doc: LeanNotif;
    try {
      const created = await this.model.create({
        userId: input.userId,
        type: input.type,
        actorId: input.actorId ?? null,
        entityId: input.entityId ?? null,
        payload: input.payload ?? {},
        dedupeKey: input.dedupeKey ?? null,
      });
      doc = created.toObject() as unknown as LeanNotif;
    } catch (err) {
      if (isDuplicateKey(err) && input.dedupeKey) {
        // Idempotent: return the existing notification without re-counting/emitting.
        const existing = (await this.model
          .findOne({ userId: input.userId, dedupeKey: input.dedupeKey })
          .lean()
          .exec()) as unknown as LeanNotif;
        return toView(existing);
      }
      throw err;
    }

    await this.unread.incr(input.userId);
    const view = toView(doc);
    // Real-time delivery to online sockets (persisted anyway for offline users).
    this.gateway.emitToUser(input.userId, 'notification', view);
    return view;
  }

  /**
   * Fan-out the same notification to many users. Iterated here for clarity; at
   * scale this is done asynchronously in batches by a worker pool off a queue,
   * and real-time emit is limited to the online subset.
   */
  async emitToMany(input: BroadcastInput): Promise<{ delivered: number }> {
    let delivered = 0;
    for (const userId of input.userIds) {
      await this.emitToUser({ ...input, userId });
      delivered += 1;
    }
    return { delivered };
  }

  /** Cursor-paginated history, newest-first. */
  async list(input: ListInput): Promise<Paginated> {
    const filter: FilterQuery<Notification> = { userId: input.userId };
    if (input.cursor) {
      const c = decodeCursor(input.cursor);
      const d = new Date(c.v);
      filter.$or = [
        { createdAt: { $lt: d } },
        { createdAt: d, _id: { $lt: new Types.ObjectId(c.id) } },
      ];
    }

    const rows = (await this.model
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(input.limit + 1)
      .lean()
      .exec()) as unknown as LeanNotif[];

    const hasNextPage = rows.length > input.limit;
    const page = hasNextPage ? rows.slice(0, input.limit) : rows;
    const last = page[page.length - 1];
    const nextCursor =
      hasNextPage && last
        ? encodeCursor({ v: new Date(last.createdAt).toISOString(), id: last._id.toHexString() })
        : null;

    return { data: page.map(toView), pageInfo: { nextCursor, hasNextPage, limit: input.limit } };
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    return { count: await this.unread.get(userId) };
  }

  /** Mark some/all as read and keep the unread counter in sync. */
  async markRead(input: MarkReadInput): Promise<{ count: number }> {
    if (input.all) {
      await this.model.updateMany({ userId: input.userId, read: false }, { $set: { read: true } });
      await this.unread.reset(input.userId);
      return { count: 0 };
    }

    const ids = (input.ids ?? []).filter((id) => Types.ObjectId.isValid(id));
    if (ids.length === 0) throw new BadRequestException('No valid ids');

    const res = await this.model.updateMany(
      { _id: { $in: ids.map((id) => new Types.ObjectId(id)) }, userId: input.userId, read: false },
      { $set: { read: true } },
    );
    // Decrement the counter by however many were actually flipped unread → read.
    await this.unread.decr(input.userId, res.modifiedCount ?? 0);
    return this.unreadCount(input.userId);
  }
}

function toView(n: LeanNotif): NotificationView {
  return {
    id: n._id.toHexString(),
    userId: n.userId,
    type: n.type,
    actorId: n.actorId ?? null,
    entityId: n.entityId ?? null,
    payload: n.payload ?? {},
    read: n.read ?? false,
    createdAt: new Date(n.createdAt).toISOString(),
  };
}

function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c), 'utf8').toString('base64url');
}

function decodeCursor(token: string): Cursor {
  try {
    const parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as Cursor;
    if (!parsed || typeof parsed.id !== 'string' || !Types.ObjectId.isValid(parsed.id)) {
      throw new Error('bad');
    }
    return parsed;
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}
