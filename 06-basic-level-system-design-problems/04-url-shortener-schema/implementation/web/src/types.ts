/** Mirrors the NestJS API response contract (UrlView). */
export interface UrlView {
  code: string;
  shortUrl: string;
  longUrl: string;
  clicks: number;
  disabled: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreateUrlBody {
  longUrl: string;
  alias?: string;
  expiresAt?: string;
  ownerId?: string;
}
