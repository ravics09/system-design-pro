import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { CommentNode, CreateCommentBody, SortOrder, Thread } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3003";

export interface GetThreadArgs {
  postId: string;
  sort: SortOrder;
}

/**
 * RTK Query slice for the comment system.
 *
 * - `getThread` returns the nested tree for a post; tagged `Thread` so it
 *   re-fetches after any mutation.
 * - `addComment` / `vote` invalidate `Thread` so the UI stays consistent without
 *   manual cache surgery (the tree is cheap to refetch — one query + assembly).
 */
export const commentsApi = createApi({
  reducerPath: "commentsApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ["Thread"],
  endpoints: (builder) => ({
    getThread: builder.query<Thread, GetThreadArgs>({
      query: ({ postId, sort }) => `/posts/${postId}/comments?sort=${sort}&limit=50`,
      providesTags: ["Thread"],
    }),
    addComment: builder.mutation<CommentNode, CreateCommentBody>({
      query: ({ postId, ...body }) => ({
        url: `/posts/${postId}/comments`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Thread"],
    }),
    vote: builder.mutation<{ score: number }, { id: string; dir: 1 | -1 }>({
      query: ({ id, dir }) => ({ url: `/comments/${id}/vote`, method: "POST", body: { dir } }),
      invalidatesTags: ["Thread"],
    }),
  }),
});

export const { useGetThreadQuery, useAddCommentMutation, useVoteMutation } = commentsApi;
