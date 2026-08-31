export type Phase = 'running' | 'draining' | 'terminated';

export interface DrainResult {
  drainedMs: number;
  /** true if the drain deadline was hit before in-flight reached zero (forced exit). */
  forced: boolean;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * The graceful-shutdown state machine (pure, framework-free). It tracks the lifecycle
 * phase and the number of in-flight requests, and orchestrates the drain:
 *   running → (SIGTERM) → draining → (in-flight = 0 | deadline) → terminated.
 *
 * Crucially, while draining it stops ACCEPTING new work but keeps LIVENESS healthy, and
 * waits out a preStop delay first so the load balancer stops routing before we reject.
 */
export class LifecycleManager {
  private _phase: Phase = 'running';
  private _inFlight = 0;

  constructor(
    private readonly preStopMs: number,
    private readonly drainDeadlineMs: number,
  ) {}

  get phase(): Phase {
    return this._phase;
  }
  get inFlight(): number {
    return this._inFlight;
  }
  /** New requests are only accepted while running (readiness reflects this). */
  get isAccepting(): boolean {
    return this._phase === 'running';
  }

  enter(): void {
    this._inFlight += 1;
  }
  leave(): void {
    if (this._inFlight > 0) this._inFlight -= 1;
  }

  /**
   * Begin draining. Idempotent (a repeat SIGTERM is a no-op). Sequence: fail readiness →
   * preStop delay (LB de-registers) → wait for in-flight to drain (up to the deadline) →
   * close resources → terminated. Returns how long draining took and whether it was forced.
   */
  async beginShutdown(onClose?: () => Promise<void> | void): Promise<DrainResult> {
    if (this._phase !== 'running') return { drainedMs: 0, forced: false };
    this._phase = 'draining';
    const start = Date.now();
    await sleep(this.preStopMs);
    const drained = await this.waitForDrain(this.drainDeadlineMs);
    if (onClose) await onClose();
    this._phase = 'terminated';
    return { drainedMs: Date.now() - start, forced: !drained };
  }

  private waitForDrain(timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
      const deadline = Date.now() + timeoutMs;
      const check = (): void => {
        if (this._inFlight <= 0) return resolve(true);
        if (Date.now() >= deadline) return resolve(false);
        setTimeout(check, 20);
      };
      check();
    });
  }

  status() {
    return {
      phase: this._phase,
      inFlight: this._inFlight,
      acceptingNew: this.isAccepting,
      preStopMs: this.preStopMs,
      drainDeadlineMs: this.drainDeadlineMs,
    };
  }

  /** Demo convenience: return to a fresh running state. */
  reset(): void {
    this._phase = 'running';
    this._inFlight = 0;
  }
}
