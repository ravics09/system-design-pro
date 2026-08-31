import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { clearAuth, setCredentials } from './authSlice';
import type {
  AuthResult,
  BrowseResponse,
  MyListItem,
  Profile,
  ProgressView,
  RatingMap,
  TitleCard,
  TitleDetail,
} from '../types';
import type { RootState } from './store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3020';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const { accessToken, profileId } = (getState() as RootState).auth;
    if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
    if (profileId) headers.set('x-profile-id', profileId);
    return headers;
  },
});

/** Attach the access token; on a 401, transparently refresh once and retry. */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    const refreshToken = (api.getState() as RootState).auth.refreshToken;
    if (refreshToken) {
      const refresh = await rawBaseQuery(
        { url: '/api/auth/refresh', method: 'POST', body: { refreshToken } },
        api,
        extraOptions,
      );
      if (refresh.data) {
        api.dispatch(setCredentials(refresh.data as AuthResult));
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(clearAuth());
      }
    }
  }
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Profiles', 'MyList', 'Continue', 'Ratings'],
  endpoints: (builder) => ({
    // ── auth ──
    register: builder.mutation<AuthResult, { email: string; password: string }>({
      query: (body) => ({ url: '/api/auth/register', method: 'POST', body }),
    }),
    login: builder.mutation<AuthResult, { email: string; password: string }>({
      query: (body) => ({ url: '/api/auth/login', method: 'POST', body }),
    }),
    logout: builder.mutation<{ ok: boolean }, string>({
      query: (refreshToken) => ({ url: '/api/auth/logout', method: 'POST', body: { refreshToken } }),
    }),

    // ── profiles ──
    getProfiles: builder.query<Profile[], void>({
      query: () => '/api/profiles',
      providesTags: ['Profiles'],
    }),
    createProfile: builder.mutation<Profile, { name: string; avatar: string; isKids: boolean }>({
      query: (body) => ({ url: '/api/profiles', method: 'POST', body }),
      invalidatesTags: ['Profiles'],
    }),
    deleteProfile: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/api/profiles/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Profiles'],
    }),

    // ── catalog (OMDb) ──
    browse: builder.query<BrowseResponse, void>({ query: () => '/api/catalog/browse' }),
    search: builder.query<TitleCard[], string>({
      query: (q) => `/api/catalog/search?q=${encodeURIComponent(q)}`,
    }),
    title: builder.query<TitleDetail, string>({ query: (id) => `/api/catalog/title/${id}` }),

    // ── my list ──
    getMyList: builder.query<MyListItem[], void>({ query: () => '/api/mylist', providesTags: ['MyList'] }),
    addToList: builder.mutation<{ ok: boolean }, { imdbID: string; title: string; poster: string | null }>({
      query: (body) => ({ url: '/api/mylist', method: 'POST', body }),
      invalidatesTags: ['MyList'],
    }),
    removeFromList: builder.mutation<{ ok: boolean }, string>({
      query: (imdbID) => ({ url: `/api/mylist/${imdbID}`, method: 'DELETE' }),
      invalidatesTags: ['MyList'],
    }),

    // ── continue watching ──
    getContinue: builder.query<ProgressView[], void>({
      query: () => '/api/history/continue',
      providesTags: ['Continue'],
    }),
    recordProgress: builder.mutation<
      ProgressView,
      { imdbID: string; title: string; poster: string | null; positionS: number; durationS: number }
    >({
      query: (body) => ({ url: '/api/history', method: 'PUT', body }),
      invalidatesTags: ['Continue'],
    }),

    // ── ratings ──
    getRatings: builder.query<RatingMap, void>({ query: () => '/api/ratings', providesTags: ['Ratings'] }),
    setRating: builder.mutation<{ ok: boolean }, { imdbID: string; value: 'up' | 'down' }>({
      query: (body) => ({ url: '/api/ratings', method: 'PUT', body }),
      invalidatesTags: ['Ratings'],
    }),
    removeRating: builder.mutation<{ ok: boolean }, string>({
      query: (imdbID) => ({ url: `/api/ratings/${imdbID}`, method: 'DELETE' }),
      invalidatesTags: ['Ratings'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetProfilesQuery,
  useCreateProfileMutation,
  useDeleteProfileMutation,
  useBrowseQuery,
  useSearchQuery,
  useTitleQuery,
  useGetMyListQuery,
  useAddToListMutation,
  useRemoveFromListMutation,
  useGetContinueQuery,
  useRecordProgressMutation,
  useGetRatingsQuery,
  useSetRatingMutation,
  useRemoveRatingMutation,
} = api;
