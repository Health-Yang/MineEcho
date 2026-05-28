/**
 * Simple TTL Cache with Request Deduplication
 * Map-based in-memory cache for BFF layer - no external dependencies.
 */

interface CacheConfig {
  maxSize: number;
  ttl: number; // in milliseconds
}

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const DEFAULT_CONFIGS: Record<string, CacheConfig> = {
  enterpriseSkills: { maxSize: 10, ttl: 60 * 1000 },
  userConfig:       { maxSize: 50, ttl: 5 * 60 * 1000 },
  channelConfig:    { maxSize: 20, ttl: 10 * 60 * 1000 },
  skillsTree:       { maxSize: 10, ttl: 60 * 1000 },
  skillsList:       { maxSize: 10, ttl: 60 * 1000 },
  aiApps:           { maxSize: 20, ttl: 2 * 60 * 1000 },
  customModels:     { maxSize: 20, ttl: 5 * 60 * 1000 },
};

class SimpleCache {
  private store = new Map<string, CacheEntry>();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  get(key: string): unknown {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: unknown): void {
    // Evict if at max capacity
    if (this.store.size >= this.config.maxSize) {
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) this.store.delete(firstKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.config.ttl });
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  get max(): number {
    return this.config.maxSize;
  }

  keys(): IterableIterator<string> {
    return this.store.keys();
  }
}

const caches = new Map<string, SimpleCache>();
const pendingRequests = new Map<string, Promise<unknown>>();

export function getCache(name: string, config?: Partial<CacheConfig>): SimpleCache {
  if (!caches.has(name)) {
    const defaultConfig = DEFAULT_CONFIGS[name] || { maxSize: 100, ttl: 60 * 1000 };
    caches.set(name, new SimpleCache({
      maxSize: config?.maxSize ?? defaultConfig.maxSize,
      ttl:     config?.ttl     ?? defaultConfig.ttl,
    }));
  }
  return caches.get(name)!;
}

export async function getOrSet<T>(
  cacheName: string,
  key: string,
  factory: () => Promise<T>,
  config?: Partial<CacheConfig>
): Promise<T> {
  const cache = getCache(cacheName, config);
  const cached = cache.get(key);
  if (cached !== undefined) return cached as T;
  const value = await factory();
  cache.set(key, value);
  return value;
}

export async function dedupeRequest<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const pending = pendingRequests.get(key);
  if (pending) return pending as Promise<T>;
  const promise = factory().finally(() => { pendingRequests.delete(key); });
  pendingRequests.set(key, promise);
  return promise;
}

export async function cachedRequest<T>(
  cacheName: string,
  key: string,
  factory: () => Promise<T>,
  config?: Partial<CacheConfig>
): Promise<T> {
  const cache = getCache(cacheName, config);
  const cached = cache.get(key);
  if (cached !== undefined) return cached as T;
  const dedupeKey = `${cacheName}:${key}`;
  const value = await dedupeRequest(dedupeKey, factory);
  cache.set(key, value);
  return value;
}

export function invalidateCache(cacheName: string, pattern?: RegExp): void {
  const cache = caches.get(cacheName);
  if (!cache) return;
  if (pattern) {
    for (const key of cache.keys()) {
      if (pattern.test(key)) cache.delete(key);
    }
  } else {
    cache.clear();
  }
}

export function deleteCacheEntry(cacheName: string, key: string): boolean {
  const cache = caches.get(cacheName);
  if (!cache) return false;
  return cache.delete(key);
}

export function getCacheStats(cacheName: string): { size: number; maxSize: number } | null {
  const cache = caches.get(cacheName);
  if (!cache) return null;
  return { size: cache.size, maxSize: cache.max };
}

export function getAllCacheStats(): Record<string, { size: number; maxSize: number }> {
  const stats: Record<string, { size: number; maxSize: number }> = {};
  for (const [name, cache] of caches) {
    stats[name] = { size: cache.size, maxSize: cache.max };
  }
  return stats;
}

export function clearAllCaches(): void {
  for (const cache of caches.values()) cache.clear();
}
