/**
 * API Response Caching Hook
 * Provides SWR-like caching for API requests with stale-while-revalidate pattern
 */

import { useState, useEffect, useCallback, useRef } from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  error?: Error;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean;
}

const DEFAULT_TTL = 60 * 1000; // 1 minute

// Global cache store
const globalCache = new Map<string, CacheEntry<unknown>>();

// Pending request deduplication
const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * Get cached data if valid
 */
function getCachedData<T>(key: string, ttl: number): T | null {
  const entry = globalCache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > ttl) {
    // Cache expired
    return null;
  }

  return entry.data as T;
}

/**
 * Set cache data
 */
function setCachedData<T>(key: string, data: T, error?: Error): void {
  globalCache.set(key, {
    data,
    timestamp: Date.now(),
    error,
  });
}

/**
 * Clear cache entry
 */
export function clearCache(key?: string): void {
  if (key) {
    globalCache.delete(key);
  } else {
    globalCache.clear();
  }
}

/**
 * Use cached API request hook
 */
export function useApiCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const { ttl = DEFAULT_TTL, staleWhileRevalidate = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh) {
      const cached = getCachedData<T>(key, ttl);
      if (cached !== null) {
        setData(cached);

        // Revalidate in background if stale-while-revalidate is enabled
        if (staleWhileRevalidate) {
          setIsValidating(true);
          fetcherRef
            .current()
            .then((freshData) => {
              setCachedData(key, freshData);
              setData(freshData);
              setError(null);
            })
            .catch((err) => {
              // Don't update error on background revalidation
              console.warn("Background revalidation failed:", err);
            })
            .finally(() => {
              setIsValidating(false);
            });
        }
        return;
      }
    }

    // Check for pending request (deduplication)
    const pendingKey = key;
    let promise = pendingRequests.get(pendingKey) as Promise<T> | undefined;

    if (!promise) {
      setIsLoading(true);
      promise = fetcherRef.current();
      pendingRequests.set(pendingKey, promise);
    } else {
      setIsValidating(true);
    }

    try {
      const result = await promise;
      setCachedData(key, result);
      setData(result);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      // Don't clear data on error, keep stale data
    } finally {
      pendingRequests.delete(pendingKey);
      setIsLoading(false);
      setIsValidating(false);
    }
  }, [key, ttl, staleWhileRevalidate]);

  // Initial fetch
  useEffect(() => {
    execute();
  }, [execute]);

  // Manual refresh function
  const refresh = useCallback(() => {
    clearCache(key);
    return execute(true);
  }, [key, execute]);

  return {
    data,
    error,
    isLoading,
    isValidating,
    refresh,
    mutate: setData,
  };
}

/**
 * Simple fetch with cache helper
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = DEFAULT_TTL } = options;

  // Check cache
  const cached = getCachedData<T>(key, ttl);
  if (cached !== null) {
    return cached;
  }

  // Check pending request
  let promise = pendingRequests.get(key) as Promise<T> | undefined;

  if (!promise) {
    promise = fetcher();
    pendingRequests.set(key, promise);
  }

  try {
    const result = await promise;
    setCachedData(key, result);
    return result;
  } finally {
    pendingRequests.delete(key);
  }
}
