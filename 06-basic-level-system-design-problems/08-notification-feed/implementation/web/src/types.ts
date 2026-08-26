/** Mirrors the NestJS API contract. */
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

export interface PageInfo {
  nextCursor: string | null;
  hasNextPage: boolean;
  limit: number;
}

export interface NotificationPage {
  data: NotificationView[];
  pageInfo: PageInfo;
}
