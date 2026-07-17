const store = new Map();
const timers = new Map();
const MAX_SIZE = 500;

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

export function memoize(fn, ttlSeconds) {
  return async (...args) => {
    const key = JSON.stringify(args);
    const cached = store.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value;
    }
    const value = await fn(...args);
    store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    evictIfNeeded();
    if (timers.has(key)) clearTimeout(timers.get(key));
    timers.set(key, setTimeout(() => {
      store.delete(key);
      timers.delete(key);
    }, ttlSeconds * 1000).unref());
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
