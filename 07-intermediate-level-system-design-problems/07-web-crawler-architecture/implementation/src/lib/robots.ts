export interface RobotsRules {
  disallow: string[];
  allow: string[];
  crawlDelayMs: number | null;
}

/**
 * Parse a robots.txt for the rules that apply to our user-agent (falling back to `*`).
 * Simplified but faithful: collects Allow/Disallow/Crawl-delay for the best-matching group.
 */
export function parseRobots(text: string, userAgent = '*'): RobotsRules {
  const groups = new Map<string, RobotsRules>();
  let current: string[] = [];
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const [field, ...rest] = line.split(':');
    const key = field.trim().toLowerCase();
    const value = rest.join(':').trim();
    if (key === 'user-agent') {
      current = [value.toLowerCase()];
      for (const ua of current) if (!groups.has(ua)) groups.set(ua, { disallow: [], allow: [], crawlDelayMs: null });
    } else if (current.length) {
      for (const ua of current) {
        const g = groups.get(ua)!;
        if (key === 'disallow' && value) g.disallow.push(value);
        else if (key === 'allow' && value) g.allow.push(value);
        else if (key === 'crawl-delay' && value) g.crawlDelayMs = Number(value) * 1000;
      }
    }
  }
  return groups.get(userAgent.toLowerCase()) ?? groups.get('*') ?? { disallow: [], allow: [], crawlDelayMs: null };
}

/** Longest-match wins: a path is allowed unless a Disallow prefix matches longer than any Allow. */
export function isAllowed(rules: RobotsRules, path: string): boolean {
  const longest = (patterns: string[]) =>
    patterns.filter((p) => path.startsWith(p)).reduce((max, p) => Math.max(max, p.length), -1);
  const dis = longest(rules.disallow);
  const allow = longest(rules.allow);
  if (dis === -1) return true;
  return allow >= dis; // an equal/longer Allow overrides the Disallow
}
