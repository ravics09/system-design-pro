import type { ContactInput } from './contact.types';

const SPAM_PHRASES = [
  'free money',
  'viagra',
  'seo services',
  'crypto',
  'click here',
  'buy now',
  'limited offer',
  'work from home',
  'winner',
  'nigerian prince',
];
const DISPOSABLE_DOMAINS = ['mailinator.com', 'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'trashmail.com'];

/**
 * Lightweight, transparent spam heuristics → a 0..100 score plus the reasons that
 * contributed (real systems add Bayesian/ML filters + reputation lists on top).
 */
export function spamScore(input: ContactInput): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  const text = `${input.subject ?? ''} ${input.message}`;
  const lower = text.toLowerCase();

  const links = (text.match(/https?:\/\//g) ?? []).length;
  if (links > 2) {
    score += 30;
    reasons.push(`too many links (${links})`);
  }

  const letters = text.replace(/[^a-zA-Z]/g, '');
  const caps = text.replace(/[^A-Z]/g, '');
  if (letters.length >= 12 && caps.length / letters.length > 0.6) {
    score += 15;
    reasons.push('mostly uppercase');
  }

  const matched = SPAM_PHRASES.filter((p) => lower.includes(p));
  if (matched.length > 0) {
    score += 25 * Math.min(2, matched.length);
    reasons.push(`spam phrases: ${matched.join(', ')}`);
  }

  if (input.message.trim().length < 12) {
    score += 20;
    reasons.push('message too short');
  }

  const domain = input.email.split('@')[1]?.toLowerCase() ?? '';
  if (DISPOSABLE_DOMAINS.includes(domain)) {
    score += 20;
    reasons.push('disposable email domain');
  }

  return { score: Math.min(100, score), reasons };
}
