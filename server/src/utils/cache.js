const store = new Map();
const timers = new Map();
const MAX_SIZE = 500;
const DEFAULT_TTL_SECONDS = 60;

function evictIfNeeded() {
  if (store.size <= MAX_SIZE) return;
  const oldest = store.keys().next().value;
  if (oldest !== undefined) {
    store.delete(oldest);
    if (timers.has(oldest)) {
      clearTimeout(timers.get(oldest));
      timers.delete(oldest);
    }
  }
}

// Each memoized function gets a unique id so that two zero-argument functions
// never share the same cache key ("[]"). Previously all four admin memoized
// queries collided on a single slot.
let memoizeIdCounter = 0;

export function memoize(fn, ttlSeconds) {
  const ttl = Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : DEFAULT_TTL_SECONDS;
  const cacheId = ++memoizeIdCounter;
  return async (...args) => {
    const key = `${cacheId}:${JSON.stringify(args)}`;
    const cached = store.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value;
    }
    const value = await fn(...args);
    store.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
    evictIfNeeded();
    if (timers.has(key)) clearTimeout(timers.get(key));
    timers.set(key, setTimeout(() => {
      store.delete(key);
      timers.delete(key);
    }, ttl * 1000).unref());
    return value;
  };
}

export function clearCache(pattern) {
  if (!pattern) {
    store.clear();
    for (const t of timers.values()) clearTimeout(t);
    timers.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.includes(pattern)) {
      store.delete(key);
      if (timers.has(key)) {
        clearTimeout(timers.get(key));
        timers.delete(key);
      }
    }
  }
}
