import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickReadPreference } from '../src/readpref';

test('eventual reads prefer secondaries (scale reads, tolerate lag)', () => {
  assert.equal(pickReadPreference('eventual'), 'secondaryPreferred');
});

test('strong / default reads go to the primary (read-your-writes)', () => {
  assert.equal(pickReadPreference('strong'), 'primary');
  assert.equal(pickReadPreference(undefined), 'primary');
  assert.equal(pickReadPreference('anything-else'), 'primary');
});
