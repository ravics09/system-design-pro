export type Listener = (...args: unknown[]) => void;
interface WrappedListener extends Listener {
  listener?: Listener; // original fn behind a once() wrapper
}

/**
 * A from-scratch EventEmitter with Node-compatible semantics:
 *  - synchronous, in-order dispatch
 *  - multiple (and duplicate) listeners per event
 *  - once() auto-removes before invoking (safe re-entrancy)
 *  - off() matches the original fn even behind a once() wrapper
 *  - an unhandled 'error' event throws
 *  - the listener array is snapshotted during emit so on/off mid-dispatch is safe
 */
export class EventEmitter {
  private readonly events = new Map<string | symbol, WrappedListener[]>();
  maxListeners = 10;

  on(event: string | symbol, listener: Listener): this {
    if (typeof listener !== 'function') throw new TypeError('listener must be a function');
    const list = this.events.get(event) ?? [];
    list.push(listener);
    this.events.set(event, list);
    if (list.length > this.maxListeners) {
      console.warn(`MaxListenersExceededWarning: ${list.length} listeners for "${String(event)}"`);
    }
    return this;
  }

  once(event: string | symbol, listener: Listener): this {
    const wrapper: WrappedListener = (...args: unknown[]) => {
      this.off(event, wrapper); // remove BEFORE calling → safe re-emit
      listener.apply(this, args);
    };
    wrapper.listener = listener;
    return this.on(event, wrapper);
  }

  off(event: string | symbol, listener: Listener): this {
    const list = this.events.get(event);
    if (!list) return this;
    const idx = list.findIndex((l) => l === listener || l.listener === listener);
    if (idx !== -1) list.splice(idx, 1);
    if (list.length === 0) this.events.delete(event);
    return this;
  }

  removeAllListeners(event?: string | symbol): this {
    if (event === undefined) this.events.clear();
    else this.events.delete(event);
    return this;
  }

  emit(event: string | symbol, ...args: unknown[]): boolean {
    const list = this.events.get(event);
    if (!list || list.length === 0) {
      if (event === 'error') {
        throw args[0] instanceof Error ? args[0] : new Error('Unhandled "error" event');
      }
      return false;
    }
    for (const listener of [...list]) listener.apply(this, args); // snapshot iteration
    return true;
  }

  listenerCount(event: string | symbol): number {
    return this.events.get(event)?.length ?? 0;
  }
}
