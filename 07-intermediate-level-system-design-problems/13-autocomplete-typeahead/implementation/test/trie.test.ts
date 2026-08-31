import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Trie } from '../src/trie';

function seeded(): Trie {
  const t = new Trie();
  t.insert('cat', 50);
  t.insert('car', 80);
  t.insert('care', 30);
  t.insert('cargo', 10);
  t.insert('dog', 100);
  return t;
}

test('topK returns completions of a prefix ranked by weight', () => {
  const t = seeded();
  assert.deepEqual(t.topK('ca', 3).map((s) => s.term), ['car', 'cat', 'care']);
});

test('topK respects the k limit', () => {
  assert.equal(seeded().topK('ca', 2).length, 2);
});

test('unknown prefix yields no suggestions', () => {
  assert.deepEqual(seeded().topK('xyz'), []);
});

test('exact prefix that is also a word is included', () => {
  const t = seeded();
  assert.ok(t.topK('car').some((s) => s.term === 'car'));
});

test('bump increases popularity and can promote a term', () => {
  const t = seeded();
  t.bump('cat', 100); // cat now 150 > car 80
  assert.equal(t.topK('ca', 1)[0].term, 'cat');
});

test('ties break alphabetically', () => {
  const t = new Trie();
  t.insert('bex', 10);
  t.insert('bax', 10);
  assert.deepEqual(t.topK('b', 2).map((s) => s.term), ['bax', 'bex']);
});
