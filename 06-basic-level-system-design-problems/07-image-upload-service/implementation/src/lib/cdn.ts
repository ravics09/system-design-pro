import { getSignedUrl as getCloudFrontSignedUrl } from "@aws-sdk/cloudfront-signer";
import { config } from "../config/index.js";

/**
 * Build a delivery URL for a stored object.
 *
 * - Public content → a plain CDN URL with long cache TTLs.
 * - Private content → a short-lived signed CloudFront URL, so only authorized
 *   viewers can fetch while still benefiting from edge caching.
 *
 * Falls back to a bare key path when no CDN is configured (local dev).
 */
export function buildDeliveryUrl(key: string, opts?: { signed?: boolean }): string {
  const base = config.CDN_DOMAIN?.replace(/\/$/, "");
  if (!base) return `/__local-storage__/${key}`; // dev placeholder

  const url = `${base}/${key}`;
  if (!opts?.signed) return url;

  if (!config.CDN_SIGNING_KEY_ID || !config.CDN_PRIVATE_KEY) {
    // Misconfigured signing — better to fail loudly than serve unsigned private URLs.
    throw new Error("CDN signing requested but CDN_SIGNING_KEY_ID/CDN_PRIVATE_KEY are not set");
  }

  const expiresAt = new Date(Date.now() + config.SIGNED_VIEW_EXPIRES_SECONDS * 1000);
  return getCloudFrontSignedUrl({
    url,
    keyPairId: config.CDN_SIGNING_KEY_ID,
    privateKey: config.CDN_PRIVATE_KEY,
    dateLessThan: expiresAt.toISOString(),
  });
}
