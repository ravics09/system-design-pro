import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, sumColumn } from '../src/csv';

const csv = 'name,amount\nalice,10\nbob,20\ncarol,30';

test('parseCsv extracts headers and rows', () => {
  const p = parseCsv(csv);
  assert.deepEqual(p.headers, ['name', 'amount']);
  assert.equal(p.rows.length, 3);
  assert.equal(p.rows[0].name, 'alice');
  assert.equal(p.rows[2].amount, '30');
});

test('parseCsv handles empty input', () => {
  assert.deepEqual(parseCsv('   '), { headers: [], rows: [] });
});

test('sumColumn totals a numeric column', () => {
  assert.equal(sumColumn(parseCsv(csv), 'amount'), 60);
});

test('sumColumn treats non-numeric cells as 0', () => {
  assert.equal(sumColumn(parseCsv('x\nabc\n5'), 'x'), 5);
});
