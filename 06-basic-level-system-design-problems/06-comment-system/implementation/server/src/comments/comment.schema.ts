import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

/**
 * A comment node stored with the MATERIALIZED PATH pattern.
 *
 * `path` is the dot-joined chain of ancestor ids ending with this comment's own
 * id, e.g. "665a.665b.665c". A whole subtree is then a single anchored-prefix
 * query (`{ path: /^<ancestor.path>\./ }`) that uses the index. `parentId` is
 * redundant with `path` but makes O(n) in-memory tree assembly trivial. `depth`
 * caps nesting and drives indentation on the client.
 */
@Schema({ timestamps: true, collection: 'comments' })
export class Comment {
  @Prop({ required: true, index: true })
  postId: string;

  @Prop({ type: String, default: null })
  parentId: string | null;

  @Prop({ required: true })
  path: string;

  @Prop({ required: true, default: 0 })
  depth: number;

  @Prop({ required: true })
  authorId: string;

  @Prop({ required: true, maxlength: 10000 })
  body: string;

  @Prop({ default: 0 })
  score: number;

  @Prop({ default: 0 })
  replyCount: number;

  @Prop({ default: false })
  deleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// Fetch/paginate a post's top-level comments, newest-first.
CommentSchema.index({ postId: 1, parentId: 1, createdAt: -1 });
// Fetch any subtree by anchored path prefix (materialized path lookups).
CommentSchema.index({ postId: 1, path: 1 });
