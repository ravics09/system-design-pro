import { z } from 'zod';
import { Types } from 'mongoose';
import { config } from '../config';

export const objectId = z
  .string()
  .refine((v) => Types.ObjectId.isValid(v), { message: 'Invalid id' });

/** POST /posts/:postId/comments — create a comment or reply. */
export const createCommentSchema = z.object({
  parentId: objectId.optional(),
  authorId: z.string().min(1).max(64), // from auth in production
  body: z.string().trim().min(1).max(10000),
});

/** GET /posts/:postId/comments — thread listing query. */
export const listThreadSchema = z.object({
  sort: z.enum(['new', 'top']).default('new'),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(config.MAX_ROOT_PAGE_SIZE)
    .default(config.DEFAULT_ROOT_PAGE_SIZE),
  cursor: z.string().optional(),
});

export const editCommentSchema = z.object({
  authorId: z.string().min(1).max(64),
  body: z.string().trim().min(1).max(10000),
});

export const deleteCommentSchema = z.object({
  authorId: z.string().min(1).max(64),
});

export const voteSchema = z.object({
  dir: z.union([z.literal(1), z.literal(-1)]),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ListThreadInput = z.infer<typeof listThreadSchema>;
export type EditCommentInput = z.infer<typeof editCommentSchema>;
export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
export type VoteInput = z.infer<typeof voteSchema>;

export interface CommentView {
  id: string;
  postId: string;
  parentId: string | null;
  depth: number;
  authorId: string;
  body: string;
  score: number;
  replyCount: number;
  deleted: boolean;
  createdAt: string;
}

/** A comment plus its nested replies. */
export interface CommentNode extends CommentView {
  children: CommentNode[];
}
