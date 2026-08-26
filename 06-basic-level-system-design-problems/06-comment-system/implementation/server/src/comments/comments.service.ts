import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, type FilterQuery } from 'mongoose';
import { Comment } from './comment.schema';
import type {
  CommentNode,
  CommentView,
  CreateCommentInput,
  ListThreadInput,
} from './comments.dto';
import { assembleForest, byNewest, byTop } from '../common/tree';
import { config } from '../config';

interface LeanComment {
  _id: Types.ObjectId;
  postId: string;
  parentId: string | null;
  path: string;
  depth: number;
  authorId: string;
  body: string;
  score: number;
  replyCount: number;
  deleted: boolean;
  createdAt: Date;
}

interface Cursor {
  v: string | number;
  id: string;
}

@Injectable()
export class CommentsService {
  constructor(@InjectModel(Comment.name) private readonly model: Model<Comment>) {}

  /**
   * Create a comment or reply. For a reply we derive the materialized `path` and
   * `depth` from the parent, and bump the parent's denormalized `replyCount`.
   * The id is generated up-front so the path can include it without a 2nd write.
   */
  async create(postId: string, input: CreateCommentInput): Promise<CommentView> {
    const id = new Types.ObjectId();
    let path: string;
    let depth: number;
    const parentId = input.parentId ?? null;

    if (parentId) {
      const parent = await this.model.findById(parentId).lean().exec();
      if (!parent || parent.postId !== postId) throw new NotFoundException('Parent comment not found');
      depth = parent.depth + 1;
      if (depth > config.MAX_DEPTH) throw new BadRequestException('Max nesting depth exceeded');
      path = `${parent.path}.${id.toHexString()}`;
    } else {
      depth = 0;
      path = id.toHexString();
    }

    await this.model.create({
      _id: id,
      postId,
      parentId,
      path,
      depth,
      authorId: input.authorId,
      body: input.body,
    });

    if (parentId) {
      await this.model.updateOne({ _id: parentId }, { $inc: { replyCount: 1 } }).exec();
    }

    const doc = (await this.model.findById(id).lean().exec()) as unknown as LeanComment;
    return toView(doc);
  }

  /**
   * Fetch a post's thread: paginate top-level comments (keyset cursor), fetch all
   * descendants of that page of roots in ONE query via an anchored path prefix,
   * then assemble the nested trees in memory.
   */
  async listThread(
    postId: string,
    input: ListThreadInput,
  ): Promise<{ roots: CommentNode[]; pageInfo: { nextCursor: string | null; hasNextPage: boolean; limit: number } }> {
    const isTop = input.sort === 'top';
    const rootSort: Record<string, 1 | -1> = isTop
      ? { score: -1, _id: -1 }
      : { createdAt: -1, _id: -1 };

    const rootFilter: FilterQuery<Comment> = { postId, parentId: null };
    if (input.cursor) {
      const c = decodeCursor(input.cursor);
      if (isTop) {
        rootFilter.$or = [
          { score: { $lt: c.v as number } },
          { score: c.v as number, _id: { $lt: new Types.ObjectId(c.id) } },
        ];
      } else {
        const d = new Date(c.v as string);
        rootFilter.$or = [
          { createdAt: { $lt: d } },
          { createdAt: d, _id: { $lt: new Types.ObjectId(c.id) } },
        ];
      }
    }

    const rootRows = (await this.model
      .find(rootFilter)
      .sort(rootSort)
      .limit(input.limit + 1)
      .lean()
      .exec()) as unknown as LeanComment[];

    const hasNextPage = rootRows.length > input.limit;
    const roots = hasNextPage ? rootRows.slice(0, input.limit) : rootRows;
    if (roots.length === 0) {
      return { roots: [], pageInfo: { nextCursor: null, hasNextPage: false, limit: input.limit } };
    }

    const rootIds = roots.map((r) => r._id.toHexString());
    // Descendants of this page of roots: path starts with "<rootId>." for some root.
    const descRegex = new RegExp(`^(${rootIds.join('|')})\\.`);
    const descendants = (await this.model
      .find({ postId, path: descRegex })
      .lean()
      .exec()) as unknown as LeanComment[];

    const views = [...roots, ...descendants].map(toView);
    const forest = assembleForest(views, isTop ? byTop : byNewest, rootIds);

    const last = roots[roots.length - 1]!;
    const nextCursor = hasNextPage
      ? encodeCursor({ v: isTop ? last.score : new Date(last.createdAt).toISOString(), id: last._id.toHexString() })
      : null;

    return { roots: forest, pageInfo: { nextCursor, hasNextPage, limit: input.limit } };
  }

  /** Lazy-load a single comment's subtree via one anchored path-prefix query. */
  async getSubtree(commentId: string): Promise<CommentNode> {
    const root = (await this.model.findById(commentId).lean().exec()) as unknown as LeanComment | null;
    if (!root) throw new NotFoundException('Comment not found');
    const descendants = (await this.model
      .find({ postId: root.postId, path: new RegExp(`^${root.path}\\.`) })
      .lean()
      .exec()) as unknown as LeanComment[];
    const forest = assembleForest([root, ...descendants].map(toView), byNewest, [root._id.toHexString()]);
    return forest[0]!;
  }

  /** Edit own comment. 404 (not 403) for another user's comment to avoid id leaks. */
  async edit(commentId: string, authorId: string, body: string): Promise<CommentView> {
    const doc = (await this.model
      .findOneAndUpdate({ _id: commentId, authorId, deleted: false }, { $set: { body } }, { new: true })
      .lean()
      .exec()) as unknown as LeanComment | null;
    if (!doc) throw new NotFoundException('Comment not found');
    return toView(doc);
  }

  /**
   * Soft-delete (tombstone): mark deleted and blank the body but KEEP the node,
   * so any replies stay attached to the thread.
   */
  async softDelete(commentId: string, authorId: string): Promise<CommentView> {
    const doc = (await this.model
      .findOneAndUpdate(
        { _id: commentId, authorId },
        { $set: { deleted: true, body: '[deleted]' } },
        { new: true },
      )
      .lean()
      .exec()) as unknown as LeanComment | null;
    if (!doc) throw new NotFoundException('Comment not found');
    return toView(doc);
  }

  /**
   * Vote: adjust the denormalized score. NOTE: production should track one vote
   * per user in a `votes` collection to prevent ballot stuffing; simplified here.
   */
  async vote(commentId: string, dir: 1 | -1): Promise<{ score: number }> {
    const doc = (await this.model
      .findByIdAndUpdate(commentId, { $inc: { score: dir } }, { new: true })
      .lean()
      .exec()) as unknown as LeanComment | null;
    if (!doc) throw new NotFoundException('Comment not found');
    return { score: doc.score };
  }
}

function toView(c: LeanComment): CommentView {
  return {
    id: c._id.toHexString(),
    postId: c.postId,
    parentId: c.parentId ?? null,
    depth: c.depth,
    authorId: c.authorId,
    body: c.body,
    score: c.score ?? 0,
    replyCount: c.replyCount ?? 0,
    deleted: c.deleted ?? false,
    createdAt: new Date(c.createdAt).toISOString(),
  };
}

function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c), 'utf8').toString('base64url');
}

function decodeCursor(token: string): Cursor {
  try {
    const parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as Cursor;
    if (!parsed || typeof parsed.id !== 'string' || !Types.ObjectId.isValid(parsed.id)) {
      throw new Error('bad cursor');
    }
    return parsed;
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
}
