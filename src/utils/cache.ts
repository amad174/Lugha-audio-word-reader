/**
 * Lightweight stale-while-revalidate cache.
 * In-memory Map survives route transitions; sessionStorage survives reloads.
 * Pages render instantly from cache while fresh data loads in the background.
 */

const memory = new Map<string, unknown>();

const PREFIX = 'lugha_cache:';

export function getCache<T>(key: string): T | null {
  if (memory.has(key)) return memory.get(key) as T;
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (raw) {
      const parsed = JSON.parse(raw) as T;
      memory.set(key, parsed);
      return parsed;
    }
  } catch {
    // sessionStorage unavailable or corrupted — ignore
  }
  return null;
}

export function setCache<T>(key: string, value: T): void {
  memory.set(key, value);
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // quota exceeded — memory cache still works
  }
}

export function clearCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    memory.clear();
  } else {
    Array.from(memory.keys())
      .filter(k => k.startsWith(keyPrefix))
      .forEach(k => memory.delete(k));
  }
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(PREFIX + (keyPrefix ?? ''))) toRemove.push(k);
    }
    toRemove.forEach(k => sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
}
