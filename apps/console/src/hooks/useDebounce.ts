/**
 * Debounce and Throttle Hooks
 * Provides performance optimization for frequent events
 */

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Debounce a value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce a callback function
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

/**
 * Throttle a callback function
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  limit: number
): (...args: Parameters<T>) => void {
  const inThrottleRef = useRef(false);
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  return useCallback(
    (...args: Parameters<T>) => {
      if (!inThrottleRef.current) {
        callbackRef.current(...args);
        inThrottleRef.current = true;
        setTimeout(() => {
          inThrottleRef.current = false;
        }, limit);
      }
    },
    [limit]
  );
}

/**
 * Throttle a value
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRanRef = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRanRef.current;

    if (timeSinceLastRun >= limit) {
      setThrottledValue(value);
      lastRanRef.current = now;
    } else {
      const timer = setTimeout(() => {
        setThrottledValue(value);
        lastRanRef.current = Date.now();
      }, limit - timeSinceLastRun);

      return () => clearTimeout(timer);
    }
  }, [value, limit]);

  return throttledValue;
}

/**
 * Hook for debounced search input
 */
export function useDebouncedSearch(
  onSearch: (query: string) => void,
  delay = 300
) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, delay);

  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  return {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
  };
}

/**
 * Hook for preventing rapid button clicks
 */
export function usePreventDoubleClick(
  callback: () => void,
  cooldown = 1000
): () => void {
  const isCooldownRef = useRef(false);
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  return useCallback(() => {
    if (isCooldownRef.current) return;

    isCooldownRef.current = true;
    callbackRef.current();

    setTimeout(() => {
      isCooldownRef.current = false;
    }, cooldown);
  }, [cooldown]);
}

/**
 * Hook for intersection observer with debounce
 */
export function useIntersectionObserver(
  callback: (isIntersecting: boolean) => void,
  options?: IntersectionObserverInit & { debounceMs?: number }
) {
  const targetRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const callbackRef = useRef(callback);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  callbackRef.current = callback;

  useEffect(() => {
    const { debounceMs = 0, ...observerOptions } = options || {};

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (debounceMs > 0) {
        debounceTimerRef.current = setTimeout(() => {
          callbackRef.current(entry.isIntersecting);
        }, debounceMs);
      } else {
        callbackRef.current(entry.isIntersecting);
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersection, observerOptions);

    if (targetRef.current) {
      observerRef.current.observe(targetRef.current);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      observerRef.current?.disconnect();
    };
  }, [options]);

  const setTarget = useCallback((element: Element | null) => {
    if (targetRef.current && observerRef.current) {
      observerRef.current.unobserve(targetRef.current);
    }

    targetRef.current = element;

    if (element && observerRef.current) {
      observerRef.current.observe(element);
    }
  }, []);

  return setTarget;
}
