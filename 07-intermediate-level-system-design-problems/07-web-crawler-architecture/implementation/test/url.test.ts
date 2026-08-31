import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUrl, sameDomain, extractLinks } from '../src/lib/url';
import { parseRobots, isAllowed } from '../src/lib/robots';

test('normalizeUrl canonicalizes host, port, fragment, and query order', () => {
  assert.equal(normalizeUrl('HTTP://Example.com:80/a?b=2&a=1#frag'), 'http://example.com/a?a=1&b=2');
  assert.equal(normalizeUrl('https://ex.com:443/'), 'https://ex.com');
  assert.equal(normalizeUrl('ftp://ex.com'), null); // non-http scheme rejected
  assert.equal(normalizeUrl('not a url'), null);
});

test('normalizeUrl resolves relative links against a base', () => {
  assert.equal(normalizeUrl('/about', 'https://ex.com/dir/page'), 'https://ex.com/about');
});

test('sameDomain compares hosts', () => {
  assert.equal(sameDomain('https://a.com/x', 'https://a.com/y'), true);
  assert.equal(sameDomain('https://a.com', 'https://b.com'), false);
});

test('extractLinks pulls absolute normalized hrefs and dedupes', () => {
  const html = '<a href="/x">x</a> <a href="https://a.com/y">y</a> <a href="/x">dup</a>';
  const links = extractLinks(html, 'https://a.com/');
  assert.deepEqual(links.sort(), ['https://a.com/x', 'https://a.com/y']);
});

test('parseRobots + isAllowed apply longest-match precedence', () => {
  const rules = parseRobots('User-agent: *\nDisallow: /private\nAllow: /private/public\nCrawl-delay: 2');
  assert.equal(isAllowed(rules, '/'), true);
  assert.equal(isAllowed(rules, '/private/secret'), false);
  assert.equal(isAllowed(rules, '/private/public/x'), true); // longer Allow wins
  assert.equal(rules.crawlDelayMs, 2000);
});
