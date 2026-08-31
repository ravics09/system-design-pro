import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from '../src/event-emitter';

test('on/emit invokes listeners in insertion order with args', () => {
  const e = new EventEmitter();
  const seen: string[] = [];
  e.on('x', (a) => seen.push(`a:${a}`));
  e.on('x', (a) => seen.push(`b:${a}`));
  assert.equal(e.emit('x', 42), true);
  assert.deepEqual(seen, ['a:42', 'b:42']);
});

test('emit returns false when no listeners', () => {
  assert.equal(new EventEmitter().emit('nope'), false);
});

test('once fires exactly once then auto-removes', () => {
  const e = new EventEmitter();
  let count = 0;
  e.once('y', () => (count += 1));
  e.emit('y');
  e.emit('y');
  assert.equal(count, 1);
  assert.equal(e.listenerCount('y'), 0);
});

test('off removes a once listener given the ORIGINAL function', () => {
  const e = new EventEmitter();
  let count = 0;
  const fn = () => (count += 1);
  e.once('z', fn);
  e.off('z', fn); // original ref, not the wrapper
  e.emit('z');
  assert.equal(count, 0);
});

test('duplicate listeners both fire (no dedupe)', () => {
  const e = new EventEmitter();
  let n = 0;
  const fn = () => (n += 1);
  e.on('d', fn);
  e.on('d', fn);
  e.emit('d');
  assert.equal(n, 2);
});

test('removing a listener during emit does not corrupt iteration', () => {
  const e = new EventEmitter();
  const order: number[] = [];
  const b = () => order.push(2);
  e.on('m', () => {
    order.push(1);
    e.off('m', b); // remove the next listener mid-dispatch
  });
  e.on('m', b);
  e.on('m', () => order.push(3));
  e.emit('m');
  assert.deepEqual(order, [1, 2, 3]); // snapshot means b still runs this round
});

test('unhandled error event throws', () => {
  const e = new EventEmitter();
  assert.throws(() => e.emit('error', new Error('boom')), /boom/);
});

test('handled error event does not throw', () => {
  const e = new EventEmitter();
  let msg = '';
  e.on('error', (err) => (msg = (err as Error).message));
  assert.equal(e.emit('error', new Error('caught')), true);
  assert.equal(msg, 'caught');
});
