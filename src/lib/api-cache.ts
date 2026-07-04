type CacheEntry<T = unknown> = {
  data: T;
  ts: number;
};

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

export function getCached<T>(key: string, ttl = CACHE_TTL_MS): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T) {
  cache.set(key, { data, ts: Date.now() });
}

export function invalidateCache(keyOrPrefix: string) {
  for (const key of cache.keys()) {
    if (key === keyOrPrefix || key.startsWith(`${keyOrPrefix}?`) || key.startsWith(keyOrPrefix)) {
      cache.delete(key);
    }
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = CACHE_TTL_MS
): Promise<T> {
  const cached = getCached<T>(key, ttl);
  if (cached !== null) return cached;

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = fetcher()
    .then((data) => {
      setCached(key, data);
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, promise);
  return promise;
}

export function prefetchApi(url: string) {
  const key = url;
  if (getCached(key) || inflight.has(key)) return;

  void fetchWithCache(key, () => fetchJson(url)).catch(() => {
    invalidateCache(key);
  });
}

export const API = {
  dashboard: "/api/dashboard",
  clients: "/api/clients",
  targets: "/api/targets",
  analytics: (range = "6m") => `/api/analytics?range=${range}`
} as const;

export function prefetchTab(tab: string) {
  switch (tab) {
    case "dashboard":
      prefetchApi(API.dashboard);
      break;
    case "clients":
      prefetchApi(API.clients);
      break;
    case "targets":
      prefetchApi(API.targets);
      break;
    case "analytics":
      prefetchApi(API.analytics());
      break;
  }
}

export function prefetchAllTabs() {
  prefetchApi(API.dashboard);
  prefetchApi(API.clients);
  prefetchApi(API.targets);
  prefetchApi(API.analytics());
}
