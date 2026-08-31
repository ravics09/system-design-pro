export interface User {
  id: string;
  email: string;
  plan: string;
}

export interface AuthResult {
  accessToken: string;
  accessExpiresAt: number;
  refreshToken: string;
  user: User;
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  isKids: boolean;
}

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

export interface MyListItem {
  imdbID: string;
  title: string;
  poster: string | null;
  addedAt: string;
}

export interface ProgressView {
  imdbID: string;
  title: string;
  poster: string | null;
  positionS: number;
  durationS: number;
  percent: number;
  updatedAt: string;
}

export type RatingMap = Record<string, 'up' | 'down'>;
