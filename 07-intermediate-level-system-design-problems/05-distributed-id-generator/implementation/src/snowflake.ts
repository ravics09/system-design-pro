/**
 * Snowflake 64-bit id: [1 sign][41 timestamp ms][10 machine][12 sequence].
 *  - 41-bit ms timestamp from a custom epoch → ~69 years of range
 *  - 10-bit machine id → up to 1024 nodes
 *  - 12-bit per-ms sequence → 4096 ids/ms/node
 * All math is BigInt (a 64-bit id exceeds JS Number's safe 53-bit integer range).
 */
export const EPOCH = 1_577_836_800_000n; // 2020-01-01T00:00:00Z
const MACHINE_BITS = 10n;
const SEQ_BITS = 12n;
const MAX_MACHINE = (1n << MACHINE_BITS) - 1n; // 1023
const MAX_SEQ = (1n << SEQ_BITS) - 1n; // 4095
const TIME_SHIFT = MACHINE_BITS + SEQ_BITS; // 22
const MACHINE_SHIFT = SEQ_BITS; // 12

export class Snowflake {
  private readonly machineId: bigint;
  private lastMs = -1n;
  private seq = 0n;

  constructor(machineId: number, private readonly now: () => number = Date.now) {
    const m = BigInt(machineId);
    if (m < 0n || m > MAX_MACHINE) throw new RangeError(`machineId must be 0..${MAX_MACHINE}`);
    this.machineId = m;
  }

  nextId(): bigint {
    let ms = BigInt(this.now());
    if (ms < this.lastMs) {
      // Clock moved backwards (NTP step) — refuse rather than risk duplicate ids.
      throw new Error(`Clock moved backwards by ${this.lastMs - ms}ms`);
    }
    if (ms === this.lastMs) {
      this.seq = (this.seq + 1n) & MAX_SEQ;
      if (this.seq === 0n) ms = this.waitNextMs(ms); // sequence exhausted this ms
    } else {
      this.seq = 0n;
    }
    this.lastMs = ms;
    return ((ms - EPOCH) << TIME_SHIFT) | (this.machineId << MACHINE_SHIFT) | this.seq;
  }

  private waitNextMs(current: bigint): bigint {
    let ms = current;
    while (ms <= this.lastMs) ms = BigInt(this.now());
    return ms;
  }
}

/** Decode an id back into its parts (for debugging / analytics). */
export function decode(id: bigint): { timestampMs: number; machineId: number; sequence: number; date: string } {
  const seq = id & MAX_SEQ;
  const machineId = (id >> MACHINE_SHIFT) & MAX_MACHINE;
  const timestampMs = (id >> TIME_SHIFT) + EPOCH;
  return {
    timestampMs: Number(timestampMs),
    machineId: Number(machineId),
    sequence: Number(seq),
    date: new Date(Number(timestampMs)).toISOString(),
  };
}
