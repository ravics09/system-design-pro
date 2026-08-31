import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { EnqueueBody, Job, JobState, QueueStats, WorkerStatus } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3009';

/**
 * RTK Query slice for the queue dashboard. Stats/jobs/workers are queries that the
 * UI polls (via `pollingInterval` on the hooks) so the board animates as jobs move
 * through their states. Mutations invalidate those tags for an immediate refresh.
 */
export const queueApi = createApi({
  reducerPath: 'queueApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ['Stats', 'Jobs', 'Workers'],
  endpoints: (builder) => ({
    getStats: builder.query<QueueStats, void>({
      query: () => '/stats',
      providesTags: ['Stats'],
    }),
    getJobs: builder.query<Job[], JobState | 'all'>({
      query: (state) => (state === 'all' ? '/jobs' : `/jobs?state=${state}`),
      providesTags: ['Jobs'],
    }),
    getWorkers: builder.query<WorkerStatus, void>({
      query: () => '/workers',
      providesTags: ['Workers'],
    }),
    enqueue: builder.mutation<Job, EnqueueBody>({
      query: (body) => ({ url: '/jobs', method: 'POST', body }),
      invalidatesTags: ['Stats', 'Jobs'],
    }),
    retryDead: builder.mutation<Job, string>({
      query: (id) => ({ url: `/jobs/${id}/retry`, method: 'POST' }),
      invalidatesTags: ['Stats', 'Jobs'],
    }),
    pauseWorkers: builder.mutation<WorkerStatus, void>({
      query: () => ({ url: '/workers/pause', method: 'POST' }),
      invalidatesTags: ['Workers'],
    }),
    resumeWorkers: builder.mutation<WorkerStatus, void>({
      query: () => ({ url: '/workers/resume', method: 'POST' }),
      invalidatesTags: ['Workers'],
    }),
    setConcurrency: builder.mutation<WorkerStatus, number>({
      query: (concurrency) => ({ url: '/workers/concurrency', method: 'POST', body: { concurrency } }),
      invalidatesTags: ['Workers'],
    }),
    reset: builder.mutation<{ ok: boolean }, void>({
      query: () => ({ url: '/queue/reset', method: 'POST' }),
      invalidatesTags: ['Stats', 'Jobs', 'Workers'],
    }),
  }),
});

export const {
  useGetStatsQuery,
  useGetJobsQuery,
  useGetWorkersQuery,
  useEnqueueMutation,
  useRetryDeadMutation,
  usePauseWorkersMutation,
  useResumeWorkersMutation,
  useSetConcurrencyMutation,
  useResetMutation,
} = queueApi;
