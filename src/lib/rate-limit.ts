import { NextRequest, NextResponse } from "next/server";

// In-memory store for rate limiting
const trackers = new Map<string, { count: number; resetTime: number }>();

// Cleanup interval (every 5 minutes)
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [key, data] of trackers.entries()) {
      if (data.resetTime < now) {
        trackers.delete(key);
      }
    }
    lastCleanup = now;
  }
}

/**
 * Check if request is rate limited
 * @param key - Unique identifier (IP, user ID, etc.)
 * @param limit - Max requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  cleanup();

  const now = Date.now();
  const data = trackers.get(key);

  if (!data || data.resetTime < now) {
    // New window
    trackers.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (data.count >= limit) {
    return false;
  }

  data.count++;
  return true;
}

/**
 * Get remaining requests and reset time
 */
export function getRateLimitInfo(
  key: string,
  limit: number,
  windowMs: number,
): {
  remaining: number;
  resetTime: number;
} {
  const data = trackers.get(key);
  const now = Date.now();

  if (!data || data.resetTime < now) {
    return { remaining: limit, resetTime: now + windowMs };
  }

  return {
    remaining: Math.max(0, limit - data.count),
    resetTime: data.resetTime,
  };
}

/**
 * Rate limit configuration presets
 */
export const RATE_LIMITS = {
  // Strict: Login, password reset
  AUTH: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 min

  // Medium: Order creation, form submissions
  SUBMIT: { limit: 10, windowMs: 60 * 1000 }, // 10 per minute

  // Relaxed: API reads
  API: { limit: 100, windowMs: 60 * 1000 }, // 100 per minute

  // Very strict: Magic link requests
  MAGIC_LINK: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
};

/**
 * Get client IP from request
 */
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Rate limit middleware helper
 * Returns NextResponse if rate limited, null if allowed
 */
export function withRateLimit(
  req: NextRequest,
  limitConfig: { limit: number; windowMs: number },
  keyPrefix: string = "",
): NextResponse | null {
  const ip = getClientIP(req);
  const key = `${keyPrefix}:${ip}`;

  if (!checkRateLimit(key, limitConfig.limit, limitConfig.windowMs)) {
    const info = getRateLimitInfo(key, limitConfig.limit, limitConfig.windowMs);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limitConfig.limit.toString(),
          "X-RateLimit-Remaining": info.remaining.toString(),
          "X-RateLimit-Reset": Math.ceil(info.resetTime / 1000).toString(),
          "Retry-After": Math.ceil(
            (info.resetTime - Date.now()) / 1000,
          ).toString(),
        },
      },
    );
  }

  return null;
}
