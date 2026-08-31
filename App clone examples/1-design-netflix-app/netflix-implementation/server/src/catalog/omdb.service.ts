import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { config } from '../config';

export interface TitleCard {
  imdbID: string;
  title: string;
  year: string;
  type: string;
  poster: string | null;
}

export interface TitleDetail extends TitleCard {
  plot: string;
  genre: string;
  director: string;
  actors: string;
  runtime: string;
  imdbRating: string;
  rated: string;
}

export interface BrowseRow {
  key: string;
  title: string;
  items: TitleCard[];
}
export interface BrowseResponse {
  billboard: TitleCard | null;
  rows: BrowseRow[];
  configured: boolean;
}

/** Curated "rows" — OMDb searches by keyword (it has no genre browse). */
const ROWS: { key: string; title: string; query: string }[] = [
  { key: 'trending', title: 'Trending Now', query: 'Marvel' },
  { key: 'action', title: 'Action & Adventure', query: 'Mission Impossible' },
  { key: 'scifi', title: 'Sci-Fi & Fantasy', query: 'Star Wars' },
  { key: 'batman', title: 'The Batman Universe', query: 'Batman' },
  { key: 'wizarding', title: 'Wizarding World', query: 'Harry Potter' },
  { key: 'thrillers', title: 'Fast-Paced Thrillers', query: 'Fast Furious' },
  { key: 'epics', title: 'Epic Journeys', query: 'Lord of the Rings' },
];

interface OmdbSearchItem {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

const posterOf = (p?: string): string | null => (p && p !== 'N/A' ? p : null);
const cardOf = (i: OmdbSearchItem): TitleCard => ({
  imdbID: i.imdbID,
  title: i.Title,
  year: i.Year,
  type: i.Type,
  poster: posterOf(i.Poster),
});

/**
 * OMDb client with an in-process TTL cache (cache-aside). The catalog is small and slow to
 * change, so most browse loads hit the cache and never call OMDb — which also keeps us under
 * OMDb's rate limits. In production this cache would be Redis, shared across instances.
 */
@Injectable()
export class OmdbService {
  private readonly logger = new Logger(OmdbService.name);
  private readonly cache = new Map<string, { value: unknown; expiresAt: number }>();

  get configured(): boolean {
    return config.OMDB_API_KEY.length > 0;
  }

  private async cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const hit = this.cache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.value as T;
    const value = await loader();
    this.cache.set(key, { value, expiresAt: Date.now() + config.CATALOG_CACHE_TTL_MS });
    return value;
  }

  private async omdb(params: Record<string, string>): Promise<Record<string, unknown>> {
    const url = new URL(config.OMDB_BASE_URL);
    url.searchParams.set('apikey', config.OMDB_API_KEY);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`OMDb HTTP ${res.status}`);
    return (await res.json()) as Record<string, unknown>;
  }

  async search(query: string): Promise<TitleCard[]> {
    if (!this.configured || !query.trim()) return [];
    return this.cached(`search:${query.toLowerCase()}`, async () => {
      try {
        const data = await this.omdb({ s: query, type: 'movie' });
        const list = (data.Search as OmdbSearchItem[] | undefined) ?? [];
        return list.map(cardOf);
      } catch (err) {
        this.logger.warn(`OMDb search failed for "${query}": ${(err as Error).message}`);
        return [];
      }
    });
  }

  async title(imdbID: string): Promise<TitleDetail> {
    if (!this.configured) throw new NotFoundException('Catalog not configured (missing OMDB_API_KEY)');
    const detail = await this.cached(`title:${imdbID}`, async () => {
      const d = await this.omdb({ i: imdbID, plot: 'full' });
      if (d.Response === 'False') return null;
      return {
        imdbID: String(d.imdbID),
        title: String(d.Title),
        year: String(d.Year),
        type: String(d.Type),
        poster: posterOf(d.Poster as string),
        plot: String(d.Plot ?? ''),
        genre: String(d.Genre ?? ''),
        director: String(d.Director ?? ''),
        actors: String(d.Actors ?? ''),
        runtime: String(d.Runtime ?? ''),
        imdbRating: String(d.imdbRating ?? ''),
        rated: String(d.Rated ?? ''),
      } as TitleDetail;
    });
    if (!detail) throw new NotFoundException(`Title ${imdbID} not found`);
    return detail;
  }

  async browse(): Promise<BrowseResponse> {
    if (!this.configured) return { billboard: null, rows: [], configured: false };
    const rows = await Promise.all(
      ROWS.map(async (r) => ({ key: r.key, title: r.title, items: await this.search(r.query) })),
    );
    const nonEmpty = rows.filter((r) => r.items.length > 0);
    const billboard = nonEmpty[0]?.items[0] ?? null;
    return { billboard, rows: nonEmpty, configured: true };
  }
}
