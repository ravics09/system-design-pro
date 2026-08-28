import { Injectable } from '@nestjs/common';
import { AppError } from '../common/app-error';
import { getRequestId, propagationHeaders } from '../common/trace-context';
import { logger } from '../common/logger';
import type { CreateUserInput } from './users.dto';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * SHARED domain logic — used by BOTH the v1 and v2 controllers. Only the
 * controllers/DTOs differ between versions; the business logic lives here once.
 */
@Injectable()
export class UsersService {
  private users: User[] = [
    { id: '1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
    { id: '2', firstName: 'Alan', lastName: 'Turing', email: 'alan@example.com' },
    { id: '3', firstName: 'Grace', lastName: 'Hopper', email: 'grace@example.com' },
  ];
  private seq = 3;

  findAll(): User[] {
    return this.users;
  }

  findOne(id: string): User {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', `User ${id} was not found`);
    return user;
  }

  create(input: CreateUserInput): User {
    const user: User = { id: String(++this.seq), ...input };
    this.users.push(user);
    return user;
  }

  /**
   * Demonstrates trace PROPAGATION: we build the propagation headers from the
   * current request context and hand them to a (simulated) downstream service,
   * which sees the SAME request id — proving the trace continues across calls.
   */
  traceDemo(): { requestId: string | undefined; downstream: { receivedRequestId: string | null } } {
    const headers = propagationHeaders();
    logger.info('calling downstream service B', { forwarded: headers });
    const downstream = downstreamEcho(headers);
    return { requestId: getRequestId(), downstream };
  }
}

/** Stand-in for another service: echoes back the correlation id it received. */
function downstreamEcho(headers: Record<string, string>): { receivedRequestId: string | null } {
  return { receivedRequestId: headers['X-Request-Id'] ?? null };
}
