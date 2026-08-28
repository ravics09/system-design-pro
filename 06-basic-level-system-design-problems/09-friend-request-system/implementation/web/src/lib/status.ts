import type { Overview, PerspectiveStatus } from "../types";

/** Derive the relationship status of `userId` (vs. me) from the grouped overview. */
export function statusFromOverview(ov: Overview | undefined, userId: string): PerspectiveStatus {
  if (!ov) return "NONE";
  if (ov.friends.includes(userId)) return "FRIENDS";
  if (ov.incoming.includes(userId)) return "REQUEST_RECEIVED";
  if (ov.outgoing.includes(userId)) return "REQUEST_SENT";
  if (ov.blocked.includes(userId)) return "BLOCKED";
  if (ov.blockedBy.includes(userId)) return "BLOCKED_BY";
  return "NONE";
}

export const STATUS_LABEL: Record<PerspectiveStatus, string> = {
  NONE: "Not connected",
  REQUEST_SENT: "Request sent",
  REQUEST_RECEIVED: "Wants to be friends",
  FRIENDS: "Friends",
  BLOCKED: "Blocked",
  BLOCKED_BY: "Unavailable",
};
