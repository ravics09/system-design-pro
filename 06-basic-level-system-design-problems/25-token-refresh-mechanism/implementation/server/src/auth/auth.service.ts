import { Injectable, UnauthorizedException } from '@nestjs/common';
import { config } from '../config';
import { RefreshStore } from './refresh-store';
import { parseRefreshToken, signAccess, signRefreshToken, verifyAccess } from './tokens';

interface DemoUser {
  id: string;
  username: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  accessExpiresAt: number;
  refreshToken: string;
  user: { id: string; username: string };
}

@Injectable()
export class AuthService {
  private readonly store = new RefreshStore();

  // Demo users (in-memory). Real systems hash passwords + look up a user store.
  private readonly users = new Map<string, DemoUser>([
    ['alice', { id: 'u_alice', username: 'alice', password: 'password123' }],
    ['bob', { id: 'u_bob', username: 'bob', password: 'hunter2' }],
  ]);

  private issuePair(user: DemoUser, familyId: string, parentId: string | null): TokenPair {
    const rec = this.store.issue({ userId: user.id, familyId, parentId }, config.REFRESH_TTL_S);
    const access = signAccess(user.id, config.ACCESS_TTL_S);
    return {
      accessToken: access.token,
      accessExpiresAt: access.expiresAt,
      refreshToken: signRefreshToken(rec.id),
      user: { id: user.id, username: user.username },
    };
  }

  login(username: string, password: string): TokenPair {
    const user = this.users.get(username);
    if (!user || user.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issuePair(user, this.store.newFamily(), null);
  }

  /**
   * Rotation + reuse detection: a valid, unused token rotates to a fresh one; a token that
   * was already used (or revoked) is a theft signal → revoke the whole family.
   */
  refresh(refreshToken: string): TokenPair {
    const id = parseRefreshToken(refreshToken);
    if (!id) throw new UnauthorizedException('Malformed refresh token');
    const rec = this.store.get(id);
    if (!rec || rec.revoked || Date.now() > rec.expiresAt) {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }
    if (rec.used) {
      const revoked = this.store.revokeFamily(rec.familyId);
      throw new UnauthorizedException(`Refresh token reuse detected — revoked ${revoked} tokens in the family`);
    }
    this.store.markUsed(rec.id);
    const user = [...this.users.values()].find((u) => u.id === rec.userId);
    if (!user) throw new UnauthorizedException('User not found');
    return this.issuePair(user, rec.familyId, rec.id);
  }

  logout(refreshToken: string, allDevices = false): { revoked: number } {
    const id = parseRefreshToken(refreshToken);
    if (!id) return { revoked: 0 };
    const rec = this.store.get(id);
    if (!rec) return { revoked: 0 };
    if (allDevices) return { revoked: this.store.revokeFamily(rec.familyId) };
    this.store.revoke(id);
    return { revoked: 1 };
  }

  me(authorization?: string): { userId: string } {
    const token = authorization?.replace(/^Bearer\s+/i, '') ?? '';
    const payload = verifyAccess(token);
    if (!payload) throw new UnauthorizedException('Invalid or expired access token');
    return { userId: payload.sub };
  }

  /** Debug view of refresh-token families/lineage for the UI. */
  sessions() {
    return this.store.all().map((r) => ({
      id: r.id.slice(0, 8),
      userId: r.userId,
      familyId: r.familyId.slice(0, 8),
      parentId: r.parentId ? r.parentId.slice(0, 8) : null,
      used: r.used,
      revoked: r.revoked,
    }));
  }

  reset(): void {
    this.store.reset();
  }
}
