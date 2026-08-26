import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  createCommentSchema,
  deleteCommentSchema,
  editCommentSchema,
  listThreadSchema,
  voteSchema,
  type CreateCommentInput,
  type DeleteCommentInput,
  type EditCommentInput,
  type ListThreadInput,
  type VoteInput,
} from './comments.dto';

@Controller()
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  /** Create a comment or reply under a post. */
  @Post('posts/:postId/comments')
  create(
    @Param('postId') postId: string,
    @Body(new ZodValidationPipe(createCommentSchema)) body: CreateCommentInput,
  ) {
    return this.comments.create(postId, body);
  }

  /** Paginated nested thread for a post. */
  @Get('posts/:postId/comments')
  list(
    @Param('postId') postId: string,
    @Query(new ZodValidationPipe(listThreadSchema)) query: ListThreadInput,
  ) {
    return this.comments.listThread(postId, query);
  }

  /** Lazy-load a single comment's subtree. */
  @Get('comments/:id/subtree')
  subtree(@Param('id') id: string) {
    return this.comments.getSubtree(id);
  }

  @Patch('comments/:id')
  edit(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(editCommentSchema)) body: EditCommentInput,
  ) {
    return this.comments.edit(id, body.authorId, body.body);
  }

  @Delete('comments/:id')
  remove(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(deleteCommentSchema)) body: DeleteCommentInput,
  ) {
    return this.comments.softDelete(id, body.authorId);
  }

  @Post('comments/:id/vote')
  vote(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(voteSchema)) body: VoteInput,
  ) {
    return this.comments.vote(id, body.dir);
  }
}
