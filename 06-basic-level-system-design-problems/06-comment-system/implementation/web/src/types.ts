/** Mirrors the NestJS API contract. */
export interface CommentNode {
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
  children: CommentNode[];
}

export interface PageInfo {
  nextCursor: string | null;
  hasNextPage: boolean;
  limit: number;
}

export interface Thread {
  roots: CommentNode[];
  pageInfo: PageInfo;
}

export type SortOrder = "new" | "top";

export interface CreateCommentBody {
  postId: string;
  parentId?: string;
  authorId: string;
  body: string;
}
