export interface TokenPair {
  accessToken: string;
  accessExpiresAt: number;
  refreshToken: string;
  user: { id: string; username: string };
}

export interface Session {
  id: string;
  userId: string;
  familyId: string;
  parentId: string | null;
  used: boolean;
  revoked: boolean;
}
