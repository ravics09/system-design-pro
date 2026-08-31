import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { config } from '../config';
import { hashPassword, randomToken, sha256, verifyPassword } from '../common/crypto';
import { signAccessToken } from '../common/tokens';
import { User } from './user.schema';
import { Session } from './session.schema';

export interface UserView {
  id: string;
  email: string;
  plan: string;
}
export interface AuthResult {
  accessToken: string;
  accessExpiresAt: number;
  refreshToken: string;
  user: UserView;
}

const userView = (u: { _id: unknown; email: string; plan: string }): UserView => ({
  id: String(u._id),
  email: u.email,
  plan: u.plan,
});

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Session.name) private readonly sessions: Model<Session>,
  ) {}

  private async issueTokens(userId: string, familyId?: string): Promise<Omit<AuthResult, 'user'>> {
    const access = signAccessToken(userId);
    const refreshToken = randomToken();
    await this.sessions.create({
      userId,
      refreshHash: sha256(refreshToken),
      familyId: familyId ?? new Types.ObjectId().toString(),
      revoked: false,
      expiresAt: new Date(Date.now() + config.REFRESH_TTL_S * 1000),
    });
    return { accessToken: access.token, accessExpiresAt: access.expiresAt, refreshToken };
  }

  async register(email: string, password: string): Promise<AuthResult> {
    const existing = await this.users.findOne({ email: email.toLowerCase() }).lean().exec();
    if (existing) throw new ConflictException('An account with this email already exists');
    const user = await this.users.create({ email, passwordHash: hashPassword(password) });
    return { ...(await this.issueTokens(String(user._id))), user: userView(user) };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.users.findOne({ email: email.toLowerCase() }).exec();
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return { ...(await this.issueTokens(String(user._id))), user: userView(user) };
  }

  /** Rotate the refresh token; reuse of a revoked token revokes the whole family. */
  async refresh(refreshToken: string): Promise<AuthResult> {
    const session = await this.sessions.findOne({ refreshHash: sha256(refreshToken) }).exec();
    if (!session) throw new UnauthorizedException('Invalid refresh token');
    if (session.revoked) {
      await this.sessions.updateMany({ familyId: session.familyId }, { revoked: true }).exec();
      throw new UnauthorizedException('Refresh token reuse detected — session revoked');
    }
    if (session.expiresAt.getTime() < Date.now()) throw new UnauthorizedException('Refresh token expired');

    session.revoked = true;
    await session.save();

    const user = await this.users.findById(session.userId).lean().exec();
    if (!user) throw new UnauthorizedException('User not found');
    return { ...(await this.issueTokens(session.userId, session.familyId)), user: userView(user) };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.sessions.updateOne({ refreshHash: sha256(refreshToken) }, { revoked: true }).exec();
  }

  async me(userId: string): Promise<UserView> {
    const user = await this.users.findById(userId).lean().exec();
    if (!user) throw new UnauthorizedException('User not found');
    return userView(user);
  }
}
