import { headers } from "next/headers";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function pruneBuckets(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Hard cap: drop oldest-ish entries if still oversized
  if (buckets.size >= MAX_BUCKETS) {
    const overflow = buckets.size - Math.floor(MAX_BUCKETS * 0.8);
    let removed = 0;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      removed += 1;
      if (removed >= overflow) break;
    }
  }
}

/**
 * Simple in-memory rate limiter (per server instance).
 * Suitable for single-node Hostinger/VPS deployments.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  pruneBuckets(now);
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return { allowed: true, retryAfterSec: 0 };
}

/**
 * Client IP for rate limiting.
 * Prefer Cloudflare's connecting IP (set by CF, not the client).
 * For X-Forwarded-For, use the first hop only when no CF header exists —
 * Hostinger/proxy must overwrite this header; do not trust arbitrary client XFF in multi-proxy chains without stripping.
 */
function resolveClientIp(headerList: Headers): string {
  const cfIp = headerList.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  const realIp = headerList.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const xff = headerList.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  return "unknown";
}

/**
 * Asynchronously checks rate limit based on client IP.
 * On header failure: fail closed into a shared tighter bucket (not open allow).
 */
export async function checkIpRateLimit(
  actionName: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  try {
    const headerList = await headers();
    const ip = resolveClientIp(headerList);
    const key = `${actionName}:${ip}`;
    return checkRateLimit(key, limit, windowMs);
  } catch (err) {
    console.error("Failed to read headers for rate limiting:", err);
    // Fail closed-ish: shared bucket with half the limit
    return checkRateLimit(
      `${actionName}:unknown`,
      Math.max(1, Math.floor(limit / 2)),
      windowMs
    );
  }
}
