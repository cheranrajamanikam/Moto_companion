export class TokenBucket {
  private tokens: number;
  private lastRefillTimestamp: number;
  private readonly capacity: number;
  private readonly refillRatePerSec: number;

  constructor(capacity: number, refillRatePerSec: number) {
    this.capacity = capacity;
    this.refillRatePerSec = refillRatePerSec;
    this.tokens = capacity;
    this.lastRefillTimestamp = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSec = (now - this.lastRefillTimestamp) / 1000;
    if (elapsedSec > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillRatePerSec);
      this.lastRefillTimestamp = now;
    }
  }

  tryConsume(count = 1): boolean {
    this.refill();
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }

  /**
   * Waits until a token is available, or rejects if wait exceeds maxWaitMs.
   */
  async acquire(count = 1, maxWaitMs = 3000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      if (this.tryConsume(count)) {
        return true;
      }
      // Wait calculated time for 1 token or at least 100ms
      const needed = count - this.tokens;
      const waitMs = Math.max(100, Math.ceil((needed / this.refillRatePerSec) * 1000));
      await new Promise((r) => setTimeout(r, Math.min(waitMs, 250)));
    }
    return false;
  }

  getTokens(): number {
    this.refill();
    return this.tokens;
  }
}

export const providerLimiters = {
  // OSM Nominatim: strictly max 1 request per second
  nominatim: new TokenBucket(1, 1),
  // Public OSRM: max 2 requests per second
  osrm: new TokenBucket(3, 2),
  // Open-Meteo: max 5 requests per second
  openMeteo: new TokenBucket(5, 5),
  // Overpass POI API: max 1 request per second
  overpass: new TokenBucket(2, 1),
  // NASA FIRMS: max 1 request per second
  firms: new TokenBucket(2, 1),
};
