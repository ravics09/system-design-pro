export type State = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitOpenError extends Error {
  constructor() {
    super('CircuitOpen: failing fast');
    this.name = 'CircuitOpenError';
  }
}

export interface BreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  now?: () => number; // injectable clock for deterministic tests
}

/**
 * Circuit breaker: after `failureThreshold` consecutive failures the breaker OPENs and fails
 * fast for `resetTimeoutMs`; then it goes HALF_OPEN and allows a single trial call — success
 * CLOSEs it, failure re-OPENs it. Converts slow/cascading failures into cheap fast ones.
 */
export class CircuitBreaker {
  state: State = 'CLOSED';
  private failures = 0;
  private nextAttempt = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly now: () => number;

  constructor(opts: BreakerOptions = {}) {
    this.failureThreshold = opts.failureThreshold ?? 5;
    this.resetTimeoutMs = opts.resetTimeoutMs ?? 10_000;
    this.now = opts.now ?? Date.now;
  }

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.now() < this.nextAttempt) throw new CircuitOpenError();
      this.state = 'HALF_OPEN'; // cooldown elapsed → allow one trial
    }
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures += 1;
    if (this.state === 'HALF_OPEN' || this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = this.now() + this.resetTimeoutMs;
    }
  }
}
