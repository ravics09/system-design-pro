import { randomUUID } from 'node:crypto';
import { newRefreshId } from './tokens';

export interface RefreshRecord {
  id: string;
  userId: string;
  familyId: string;
  parentId: string | null;
  used: boolean;
  revoked: boolean;
  createdAt: number;
  expiresAt: number;
}

/**
 * Server-side registry of refresh tokens grouped into families (lineages). Rotation marks
 * a token `used` and issues a child in the same family; reuse of a `used`/revoked token is
 * the theft signal that triggers `revokeFamily`.
 */
export class RefreshStore {
  private records = new Map<string, RefreshRecord>();

  newFamily(): string {
    return randomUUID();
  }

  issue(params: { userId: string; familyId: string; parentId: string | null }, ttlSec: number): RefreshRecord {
    const now = Date.now();
    const rec: RefreshRecord = {
      id: newRefreshId(),
      userId: params.userId,
      familyId: params.familyId,
      parentId: params.parentId,
      used: false,
      revoked: false,
      createdAt: now,
      expiresAt: now + ttlSec * 1000,
    };
    this.records.set(rec.id, rec);
    return rec;
  }

  get(id: string): RefreshRecord | null {
    return this.records.get(id) ?? null;
  }

  markUsed(id: string): void {
    const r = this.records.get(id);
    if (r) r.used = true;
  }

  revoke(id: string): void {
    const r = this.records.get(id);
    if (r) r.revoked = true;
  }

  /** Revoke every token in a family — the response to a detected reuse (theft). */
  revokeFamily(familyId: string): number {
    let n = 0;
    for (const r of this.records.values()) {
      if (r.familyId === familyId && !r.revoked) {
        r.revoked = true;
        n++;
      }
    }
    return n;
  }

  all(): RefreshRecord[] {
    return [...this.records.values()].sort((a, b) => a.createdAt - b.createdAt);
  }

  reset(): void {
    this.records.clear();
  }
}
