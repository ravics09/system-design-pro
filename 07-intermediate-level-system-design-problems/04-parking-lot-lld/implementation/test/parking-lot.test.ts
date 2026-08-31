import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ParkingLot } from '../src/parking-lot';
import { HourlyPricing, Size, canFit } from '../src/domain';

const layout = { levels: 1, perLevel: { [Size.MOTORCYCLE]: 1, [Size.COMPACT]: 1, [Size.LARGE]: 1 } };

test('canFit respects the size ordering', () => {
  assert.equal(canFit(Size.MOTORCYCLE, Size.LARGE), true);
  assert.equal(canFit(Size.LARGE, Size.COMPACT), false);
  assert.equal(canFit(Size.COMPACT, Size.COMPACT), true);
});

test('best-fit: a car takes a compact before a large', () => {
  const lot = new ParkingLot(layout);
  const t = lot.park({ plate: 'CAR1', size: Size.COMPACT })!;
  assert.ok(t.spotId.includes('COMPACT'));
});

test('overflow spills to the next larger size, then rejects when full', () => {
  const lot = new ParkingLot({ levels: 1, perLevel: { [Size.MOTORCYCLE]: 0, [Size.COMPACT]: 1, [Size.LARGE]: 1 } });
  const a = lot.park({ plate: 'C1', size: Size.COMPACT }); // takes the compact
  const b = lot.park({ plate: 'C2', size: Size.COMPACT }); // spills to large
  const c = lot.park({ plate: 'C3', size: Size.COMPACT }); // full
  assert.ok(a && b);
  assert.equal(c, null);
});

test('no double-booking: each park gets a distinct spot', () => {
  const lot = new ParkingLot({ levels: 1, perLevel: { [Size.MOTORCYCLE]: 0, [Size.COMPACT]: 3, [Size.LARGE]: 0 } });
  const spots = new Set([
    lot.park({ plate: 'A', size: Size.COMPACT })!.spotId,
    lot.park({ plate: 'B', size: Size.COMPACT })!.spotId,
    lot.park({ plate: 'C', size: Size.COMPACT })!.spotId,
  ]);
  assert.equal(spots.size, 3);
});

test('unpark frees the spot and prices by rounded-up hours', () => {
  const lot = new ParkingLot(layout);
  const before = lot.availability().free;
  const t = lot.park({ plate: 'X', size: Size.LARGE })!;
  assert.equal(lot.availability().free, before - 1);
  const twoHoursAgo = t.entryTime; // unpark 90 min later → 2 hours billed
  const result = lot.unpark(t.id, twoHoursAgo + 90 * 60_000)!;
  assert.equal(result.feeCents, 2 * 300); // large = 300c/h, ceil(1.5h)=2
  assert.equal(lot.availability().free, before);
});

test('unparking an unknown/closed ticket returns null (idempotent-safe)', () => {
  const lot = new ParkingLot(layout);
  assert.equal(lot.unpark('nope'), null);
});

test('HourlyPricing rounds up and enforces a 1h minimum', () => {
  const p = new HourlyPricing();
  assert.equal(p.priceCents(0, Size.COMPACT), 200); // min 1h
  assert.equal(p.priceCents(60 * 60_000 + 1, Size.COMPACT), 400); // just over 1h → 2h
});
