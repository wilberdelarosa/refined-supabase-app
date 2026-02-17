/**
 * Rate Limiter Utility
 * Implements client-side rate limiting to prevent abuse
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();

  /**
   * Check if a request is allowed under the rate limit
   * @param key - Unique identifier for the rate limit (e.g., 'api:products', 'auth:login')
   * @param config - Rate limit configuration
   * @returns true if request is allowed, false if rate limited
   */
  check(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    // No previous requests or window expired
    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    // Within rate limit
    if (entry.count < config.maxRequests) {
      entry.count++;
      return true;
    }

    // Rate limited
    return false;
  }

  /**
   * Get time until rate limit resets
   * @param key - Rate limit key
   * @returns milliseconds until reset, or 0 if not rate limited
   */
  getTimeUntilReset(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) return 0;

    const now = Date.now();
    return Math.max(0, entry.resetTime - now);
  }

  /**
   * Clear rate limit for a key
   * @param key - Rate limit key to clear
   */
  clear(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.limits.clear();
  }
}

export const rateLimiter = new RateLimiter();

// Common rate limit configurations
export const RATE_LIMITS = {
  API_CALL: { maxRequests: 60, windowMs: 60 * 1000 }, // 60 requests per minute
  AUTH_LOGIN: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  CART_UPDATE: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 updates per minute
  SEARCH: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 searches per minute
} as const;
