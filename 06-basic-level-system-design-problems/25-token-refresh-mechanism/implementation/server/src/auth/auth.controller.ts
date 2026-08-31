import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthService } from './auth.service';

const loginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });
const refreshSchema = z.object({ refreshToken: z.string().min(1) });
const logoutSchema = z.object({ refreshToken: z.string().min(1), allDevices: z.boolean().optional() });

type LoginInput = z.infer<typeof loginSchema>;
type RefreshInput = z.infer<typeof refreshSchema>;
type LogoutInput = z.infer<typeof logoutSchema>;

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body(new ZodValidationPipe(loginSchema)) body: LoginInput) {
    return this.auth.login(body.username, body.password);
  }

  @Post('refresh')
  refresh(@Body(new ZodValidationPipe(refreshSchema)) body: RefreshInput) {
    return this.auth.refresh(body.refreshToken);
  }

  @Post('logout')
  logout(@Body(new ZodValidationPipe(logoutSchema)) body: LogoutInput) {
    return this.auth.logout(body.refreshToken, body.allDevices ?? false);
  }

  /** Stateless: authorized purely by verifying the access token's signature + expiry. */
  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    return this.auth.me(authorization);
  }

  @Get('sessions')
  sessions() {
    return this.auth.sessions();
  }

  @Post('reset')
  reset() {
    this.auth.reset();
    return { ok: true };
  }
}
