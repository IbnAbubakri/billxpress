import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'fs';
import { dirname, basename } from 'path';

const cache = {};

function resolvePath(path) {
  if (process.env.VERCEL) {
    const filename = basename(path);
    return `/tmp/data/${filename}`;
  }
  return path;
}

export function loadJSON(path, fallback) {
  const resolved = resolvePath(path);
  if (cache[resolved] !== undefined) return cache[resolved];
  if (!existsSync(resolved)) { cache[resolved] = fallback; return fallback; }
  try {
    const data = JSON.parse(readFileSync(resolved, 'utf-8'));
    cache[resolved] = data;
    return data;
  } catch {
    cache[resolved] = fallback;
    return fallback;
  }
}

export function saveJSON(path, data) {
  const resolved = resolvePath(path);
  const dir = dirname(resolved);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const tmp = resolved + '.tmp.' + process.pid;
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  renameSync(tmp, resolved);
  cache[resolved] = data;
}

export function clearCache(path) {
  if (path) delete cache[resolvePath(path)];
  else Object.keys(cache).forEach((k) => delete cache[k]);
}
