/** Mirrors the NestJS API contract. */
export interface User {
  id: string;
  name: string;
}

export type PerspectiveStatus =
  | "NONE"
  | "REQUEST_SENT"
  | "REQUEST_RECEIVED"
  | "FRIENDS"
  | "BLOCKED"
  | "BLOCKED_BY";

export interface Overview {
  userId: string;
  friends: string[];
  incoming: string[];
  outgoing: string[];
  blocked: string[];
  blockedBy: string[];
}
