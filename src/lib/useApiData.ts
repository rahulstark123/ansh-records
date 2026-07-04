"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchJson,
  fetchWithCache,
  getCached,
  invalidateCache,
  setCached
} from "@/lib/api-cache";

type UseApiDataOptions<T> = {
  enabled?: boolean;
  revalidate?: boolean;
  transform?: (raw: unknown) => T;
};

export function useApiData<T>(key: string, url: string, options: UseApiDataOptions<T> = {}) {
  const { enabled = true, revalidate = true, transform } = options;
  const [data, setData] = useState<T | null>(() => getCached<T>(key));
  const [isLoading, setIsLoading] = useState(() => enabled && getCached<T>(key) === null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(
    async (background = false) => {
      if (!enabled) return;

      const hasCache = getCached<T>(key) !== null;
      if (!background && !hasCache) setIsLoading(true);
      if (background || hasCache) setIsValidating(true);

      try {
        const result = await fetchWithCache(key, async () => {
          const raw = await fetchJson<unknown>(url);
          return transform ? transform(raw) : (raw as T);
        });
        if (!mountedRef.current) return;
        setData(result);
        setError(null);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        if (!mountedRef.current) return;
        setIsLoading(false);
        setIsValidating(false);
      }
    },
    [enabled, key, url, transform]
  );

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) return;

    const cached = getCached<T>(key);
    if (cached !== null) {
      setData(cached);
      setIsLoading(false);
      if (revalidate) void load(true);
    } else {
      void load(false);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [enabled, key, url, load, revalidate]);

  const refresh = useCallback(async () => {
    invalidateCache(key);
    await load(false);
  }, [key, load]);

  const mutate = useCallback(
    (updater: T | ((prev: T | null) => T)) => {
      setData((prev) => {
        const next = typeof updater === "function" ? (updater as (p: T | null) => T)(prev) : updater;
        setCached(key, next);
        return next;
      });
    },
    [key]
  );

  return { data, isLoading, isValidating, error, refresh, mutate, setData };
}
