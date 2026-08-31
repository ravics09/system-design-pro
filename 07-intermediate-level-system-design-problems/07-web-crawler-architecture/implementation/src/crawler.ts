import type { Redis } from 'ioredis';
import { config } from './config';
import { Page } from './models';
import { extractLinks, hostOf, normalizeUrl, sameDomain } from './lib/url';
import { isAllowed, parseRobots, type RobotsRules } from './lib/robots';

const FRONTIER = 'frontier';
const SEEN = 'seen';

/**
 * Worker-based crawler. The frontier (Redis list) + seen-set (Redis set) survive restarts
 * and are shared across workers; per-host politeness is enforced with a "next allowed time"
 * key so we never exceed one request / crawl-delay per host.
 */
export class Crawler {
  private robotsCache = new Map<string, RobotsRules>();

  constructor(private readonly redis: Redis) {}

  async enqueue(url: string): Promise<boolean> {
    const norm = normalizeUrl(url);
    if (!norm) return false;
    const isNew = await this.redis.sadd(SEEN, norm); // dedup: only new urls enter the frontier
    if (isNew) await this.redis.rpush(FRONTIER, norm);
    return isNew === 1;
  }

  async start(seed: string, maxPages: number, sameDomainOnly: boolean): Promise<{ crawled: number }> {
    await this.redis.del(FRONTIER, SEEN);
    await Page.deleteMany({});
    await this.enqueue(seed);
    let crawled = 0;
    const worker = async () => {
      while (crawled < maxPages) {
        const url = await this.redis.lpop(FRONTIER);
        if (!url) {
          await sleep(50);
          if ((await this.redis.llen(FRONTIER)) === 0) return; // drained
          continue;
        }
        if (crawled >= maxPages) return;
        const ok = await this.fetchAndProcess(url, seed, sameDomainOnly, () => crawled++);
        void ok;
      }
    };
    await Promise.all(Array.from({ length: config.concurrency }, worker));
    return { crawled };
  }

  private async politenessWait(host: string): Promise<void> {
    const key = `nextAllowed:${host}`;
    const now = Date.now();
    const next = Number((await this.redis.get(key)) ?? 0);
    if (next > now) await sleep(next - now);
    await this.redis.set(key, String(Date.now() + config.crawlDelayMs));
  }

  private async getRobots(host: string, scheme: string): Promise<RobotsRules> {
    if (this.robotsCache.has(host)) return this.robotsCache.get(host)!;
    let rules: RobotsRules = { disallow: [], allow: [], crawlDelayMs: null };
    try {
      const res = await fetchWithTimeout(`${scheme}//${host}/robots.txt`, 5000);
      if (res.ok) rules = parseRobots(await res.text(), config.userAgent);
    } catch {
      /* no robots.txt → allow all */
    }
    this.robotsCache.set(host, rules);
    return rules;
  }

  private async fetchAndProcess(url: string, seed: string, sameDomainOnly: boolean, onCrawled: () => void): Promise<boolean> {
    const host = hostOf(url);
    if (!host) return false;
    const scheme = new URL(url).protocol;
    const rules = await this.getRobots(host, scheme);
    if (!isAllowed(rules, new URL(url).pathname)) return false; // robots.txt compliance
    await this.politenessWait(host);
    try {
      const res = await fetchWithTimeout(url, 8000, config.userAgent);
      const html = res.headers.get('content-type')?.includes('text/html') ? await res.text() : '';
      const links = html ? extractLinks(html, url) : [];
      const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? null;
      await Page.updateOne(
        { url },
        { $set: { status: res.status, title, bytes: html.length, outLinks: links.length, fetchedAt: new Date() } },
        { upsert: true },
      );
      onCrawled();
      for (const link of links) {
        if (sameDomainOnly && !sameDomain(link, seed)) continue;
        await this.enqueue(link);
      }
      return true;
    } catch {
      return false; // transient failure: in production, retry with backoff then dead-letter
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(url: string, timeoutMs: number, ua?: string): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: ctrl.signal, headers: ua ? { 'user-agent': ua } : undefined, redirect: 'follow' });
  } finally {
    clearTimeout(t);
  }
}
