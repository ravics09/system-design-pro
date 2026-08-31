import { Controller, Get, Post, Query } from '@nestjs/common';
import { LifecycleService } from './lifecycle.service';

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

@Controller()
export class LifecycleController {
  constructor(private readonly lc: LifecycleService) {}

  /** A simulated in-flight request. It's counted while running; rejected (503) while draining. */
  @Get('work')
  async work(@Query('ms') ms?: string) {
    const duration = Math.min(30_000, Math.max(0, Number(ms) || 100));
    await sleep(duration);
    return { ok: true, ms: duration, finishedAt: Date.now() };
  }

  /**
   * Models receiving SIGTERM (the web demo can't send a real signal). Kicks off the drain
   * in the background and returns immediately — phase is already `draining` synchronously.
   */
  @Post('shutdown')
  shutdown() {
    void this.lc.manager.beginShutdown(async () => {
      // eslint-disable-next-line no-console
      console.log('closing resources (db, queue, timers)…');
    });
    return this.lc.manager.status();
  }

  @Get('status')
  status() {
    return this.lc.manager.status();
  }

  /** Demo convenience: return to a fresh running state (a real process would have exited). */
  @Post('reset')
  reset() {
    this.lc.manager.reset();
    return this.lc.manager.status();
  }
}
