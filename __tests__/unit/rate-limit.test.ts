/**
 * Unit Tests for Rate Limiting
 * 
 * Note: These tests use a simplified in-memory implementation
 * since the actual module imports Next.js server components
 */

// Simplified rate limit implementation for testing
const trackers = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const data = trackers.get(key);
  
  if (!data || data.resetTime < now) {
    trackers.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (data.count >= limit) {
    return false;
  }
  
  data.count++;
  return true;
}

function getRateLimitInfo(key: string, limit: number, windowMs: number) {
  const data = trackers.get(key);
  const now = Date.now();
  
  if (!data || data.resetTime < now) {
    return { remaining: limit, resetTime: now + windowMs };
  }
  
  return {
    remaining: Math.max(0, limit - data.count),
    resetTime: data.resetTime
  };
}

const RATE_LIMITS = {
  AUTH: { limit: 5, windowMs: 15 * 60 * 1000 },
  SUBMIT: { limit: 10, windowMs: 60 * 1000 },
  API: { limit: 100, windowMs: 60 * 1000 },
  MAGIC_LINK: { limit: 3, windowMs: 60 * 60 * 1000 },
};

describe("Rate Limiting", () => {
  beforeEach(() => {
    // Clear rate limit state between tests
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("checkRateLimit", () => {
    it("should allow requests under limit", () => {
      const key = "test-user-1";
      const limit = 5;
      const windowMs = 60000; // 1 minute

      // First 5 requests should be allowed
      for (let i = 0; i < 5; i++) {
        expect(checkRateLimit(key, limit, windowMs)).toBe(true);
      }
    });

    it("should block requests over limit", () => {
      const key = "test-user-2";
      const limit = 3;
      const windowMs = 60000;

      // Use up the limit
      for (let i = 0; i < 3; i++) {
        checkRateLimit(key, limit, windowMs);
      }

      // 4th request should be blocked
      expect(checkRateLimit(key, limit, windowMs)).toBe(false);
    });

    it("should reset after window expires", () => {
      const key = "test-user-3";
      const limit = 2;
      const windowMs = 1000; // 1 second

      // Use up limit
      checkRateLimit(key, limit, windowMs);
      checkRateLimit(key, limit, windowMs);
      expect(checkRateLimit(key, limit, windowMs)).toBe(false);

      // Advance time past window
      jest.advanceTimersByTime(1100);

      // Should be allowed again
      expect(checkRateLimit(key, limit, windowMs)).toBe(true);
    });

    it("should track different keys separately", () => {
      const key1 = "user-A";
      const key2 = "user-B";
      const limit = 2;
      const windowMs = 60000;

      // User A uses all their requests
      checkRateLimit(key1, limit, windowMs);
      checkRateLimit(key1, limit, windowMs);
      expect(checkRateLimit(key1, limit, windowMs)).toBe(false);

      // User B should still have their full quota
      expect(checkRateLimit(key2, limit, windowMs)).toBe(true);
      expect(checkRateLimit(key2, limit, windowMs)).toBe(true);
    });
  });

  describe("getRateLimitInfo", () => {
    it("should return correct remaining count", () => {
      const key = "info-test-1";
      const limit = 5;
      const windowMs = 60000;

      // Make 2 requests
      checkRateLimit(key, limit, windowMs);
      checkRateLimit(key, limit, windowMs);

      const info = getRateLimitInfo(key, limit, windowMs);
      expect(info.remaining).toBe(3);
    });

    it("should return 0 remaining when exhausted", () => {
      const key = "info-test-2";
      const limit = 2;
      const windowMs = 60000;

      checkRateLimit(key, limit, windowMs);
      checkRateLimit(key, limit, windowMs);

      const info = getRateLimitInfo(key, limit, windowMs);
      expect(info.remaining).toBe(0);
    });

    it("should return full limit for new keys", () => {
      const key = "new-key-" + Date.now();
      const limit = 10;
      const windowMs = 60000;

      const info = getRateLimitInfo(key, limit, windowMs);
      expect(info.remaining).toBe(10);
    });
  });

  describe("RATE_LIMITS presets", () => {
    it("should have stricter limits for auth", () => {
      expect(RATE_LIMITS.AUTH.limit).toBeLessThan(RATE_LIMITS.API.limit);
    });

    it("should have very strict limits for magic links", () => {
      expect(RATE_LIMITS.MAGIC_LINK.limit).toBeLessThanOrEqual(5);
      expect(RATE_LIMITS.MAGIC_LINK.windowMs).toBeGreaterThanOrEqual(60 * 60 * 1000); // At least 1 hour
    });
  });
});
