import { z } from 'zod';
import { config } from '../config';

/** Body for emitting a notification to one user (demo trigger / producer). */
export const emitSchema = z.object({
  userId: z.string().min(1).max(64),
  type: z.string().min(1).max(64),
  actorId: z.string().max(64).optional(),
  entityId: z.string().max(128).optional(),
  payload: z.record(z.unknown()).optional(),
  dedupeKey: z.string().max(128).optional(),
});

/** Fan-out the same notification to many users. */
export const broadcastSchema = emitSchema
  .omit({ userId: true })
  .extend({ userIds: z.array(z.string().min(1).max(64)).min(1).max(10000) });

export const listSchema = z.object({
  userId: z.string().min(1).max(64),
  limit: z.coerce.number().int().positive().max(config.MAX_PAGE_SIZE).default(config.DEFAULT_PAGE_SIZE),
  cursor: z.string().optional(),
});

export const unreadSchema = z.object({ userId: z.string().min(1).max(64) });

export const markReadSchema = z
  .object({
    userId: z.string().min(1).max(64),
    ids: z.array(z.string()).max(1000).optional(),
    all: z.boolean().optional(),
  })
  .refine((o) => o.all === true || (o.ids && o.ids.length > 0), {
    message: 'Provide ids[] or all:true',
  });

export type EmitInput = z.infer<typeof emitSchema>;
export type BroadcastInput = z.infer<typeof broadcastSchema>;
export type ListInput = z.infer<typeof listSchema>;
export type UnreadInput = z.infer<typeof unreadSchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;

export interface NotificationView {
  id: string;
  userId: string;
  type: string;
  actorId: string | null;
  entityId: string | null;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface Paginated {
  data: NotificationView[];
  pageInfo: { nextCursor: string | null; hasNextPage: boolean; limit: number };
}
