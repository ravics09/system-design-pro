import { test } from 'node:test';
import assert from 'node:assert/strict';
import { haversineKm, isValidCoord } from '../src/geo';

test('haversine distance is ~0 for the same point', () => {
  assert.ok(haversineKm(40, -74, 40, -74) < 1e-6);
});

test('haversine NYC → LA is ~3936 km', () => {
  const d = haversineKm(40.7128, -74.006, 34.0522, -118.2437);
  assert.ok(Math.abs(d - 3936) < 40, `expected ~3936, got ${d.toFixed(0)}`);
});

test('haversine ~1 degree of latitude is ~111 km', () => {
  const d = haversineKm(0, 0, 1, 0);
  assert.ok(Math.abs(d - 111.19) < 1, `got ${d.toFixed(2)}`);
});

test('isValidCoord bounds-checks lat/lng', () => {
  assert.equal(isValidCoord(-74, 40), true);
  assert.equal(isValidCoord(200, 40), false); // lng out of range
  assert.equal(isValidCoord(-74, 100), false); // lat out of range
  assert.equal(isValidCoord(NaN, 40), false);
});
