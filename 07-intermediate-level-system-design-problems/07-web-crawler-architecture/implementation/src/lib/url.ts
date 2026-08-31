/**
 * Canonicalize a URL so the same page isn't crawled twice under trivial variations:
 * lowercase host, drop the fragment, remove default ports, sort query params, and
 * normalize a bare-path trailing slash.
 */
export function normalizeUrl(input: string, base?: string): string | null {
  let u: URL;
  try {
    u = base ? new URL(input, base) : new URL(input);
  } catch {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  u.hash = '';
  u.hostname = u.hostname.toLowerCase();
  if ((u.protocol === 'http:' && u.port === '80') || (u.protocol === 'https:' && u.port === '443')) {
    u.port = '';
  }
  u.searchParams.sort();
  let out = u.toString();
  if (out.endsWith('/') && u.pathname === '/' && !u.search) out = out.slice(0, -1);
  return out;
}

export function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function sameDomain(a: string, b: string): boolean {
  const ha = hostOf(a);
  const hb = hostOf(b);
  return ha != null && ha === hb;
}

/** Extract absolute, normalized links from an HTML document. */
export function extractLinks(html: string, baseUrl: string): string[] {
  const links = new Set<string>();
  const re = /<a\b[^>]*\bhref\s*=\s*["']([^"'#]+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const abs = normalizeUrl(m[1], baseUrl);
    if (abs) links.add(abs);
  }
  return [...links];
}
