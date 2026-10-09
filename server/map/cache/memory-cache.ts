interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private inFlight = new Map<string, Promise<unknown>>();
  private hits = 0;
  private misses = 0;

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
    this.inFlight.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Fetch with request deduplication:
   * If a fetch for this key is already in flight, return that promise.
   * If cached, return cached data immediately.
   */
  async fetchOrDedupe<T>(
    key: string,
    ttlMs: number,
    producer: () => Promise<T>
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const pending = this.inFlight.get(key);
    if (pending) {
      return (await pending) as T;
    }

    const promise = (async () => {
      try {
        const result = await producer();
        this.set(key, result, ttlMs);
        return result;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  getStats(): { size: number; inFlightCount: number; hits: number; misses: number } {
    return {
      size: this.store.size,
      inFlightCount: this.inFlight.size,
      hits: this.hits,
      misses: this.misses,
    };
  }
}

export const globalMemoryCache = new MemoryCache();
