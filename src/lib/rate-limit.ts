import "server-only";
import { headers } from "next/headers";

/**
 * Rate limiting. The default driver is a fixed-window counter in process memory,
 * which is genuinely useful in development and on a single instance, and useless
 * across several — so `RATE_LIMIT_DRIVER=redis` is the shape a shared store slots
 * into. Everything else in the app calls `rateLimit()` and doesn't care which.
 *
 * Fail open on driver errors: a broken counter should not take the site down.
 */

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSeconds: number };
export type RateLimitOptions = { limit: number; windowMs: number };

interface RateLimitDriver {
  hit(key: string, options: RateLimitOptions): Promise<RateLimitResult>;
  reset(key: string): Promise<void>;
}

const buckets = new Map<string, { count: number; expiresAt: number }>();

const memoryDriver: RateLimitDriver = {
  async hit(key, { limit, windowMs }) {
    const now = Date.now();
    const bucket = buckets.get(key);

    // Opportunistic sweep so the map can't grow without bound.
    if (buckets.size > 10_000) {
      for (const [k, v] of buckets) if (v.expiresAt < now) buckets.delete(k);
    }

    if (!bucket || bucket.expiresAt < now) {
      buckets.set(key, { count: 1, expiresAt: now + windowMs });
      return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
    }

    bucket.count += 1;
    const ok = bucket.count <= limit;
    return {
      ok,
      remaining: Math.max(0, limit - bucket.count),
      retryAfterSeconds: ok ? 0 : Math.ceil((bucket.expiresAt - now) / 1000),
    };
  },

  async reset(key) {
    buckets.delete(key);
  },
};

const redisDriver: RateLimitDriver = {
  async hit() {
    // Implement with INCR + EXPIRE (or @upstash/ratelimit) and keep this shape.
    throw new Error("Redis rate limit driver not implemented. See src/lib/rate-limit.ts.");
  },
  async reset() {
    throw new Error("Redis rate limit driver not implemented.");
  },
};

const driver: RateLimitDriver = process.env.RATE_LIMIT_DRIVER === "redis" ? redisDriver : memoryDriver;

export async function rateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  try {
    return await driver.hit(key, options);
  } catch (error) {
    console.error("Rate limiter unavailable, allowing request:", error);
    return { ok: true, remaining: options.limit, retryAfterSeconds: 0 };
  }
}

export async function resetRateLimit(key: string) {
  try {
    await driver.reset(key);
  } catch {
    // Not worth failing a successful login over.
  }
}

/**
 * Caller IP. Trusting a proxy header is only safe behind a proxy you control —
 * set TRUST_PROXY=false if the app is exposed directly, and this falls back to
 * a shared bucket rather than a spoofable one.
 */
export async function callerIp(): Promise<string> {
  if (process.env.TRUST_PROXY === "false") return "direct";
  const header = await headers();
  const forwarded = header.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return header.get("x-real-ip") ?? "unknown";
}

/** Standard buckets, so limits are consistent and easy to review in one place. */
export const LIMITS = {
  login: { limit: 8, windowMs: 15 * 60_000 },
  loginPerAccount: { limit: 10, windowMs: 15 * 60_000 },
  register: { limit: 5, windowMs: 60 * 60_000 },
  passwordChange: { limit: 5, windowMs: 60 * 60_000 },
  message: { limit: 30, windowMs: 60_000 },
  request: { limit: 10, windowMs: 60 * 60_000 },
  referral: { limit: 20, windowMs: 60 * 60_000 },
  report: { limit: 10, windowMs: 60 * 60_000 },
  upload: { limit: 40, windowMs: 60 * 60_000 },
} as const;
