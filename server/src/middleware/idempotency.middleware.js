import crypto from 'node:crypto';
import { getDb } from '../utils/db.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export async function cleanupStaleIdempotencyKeys() {
  try {
    const db = getDb();
    const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();
    await db.prepare('DELETE FROM idempotency_keys WHERE created_at < ?').run(cutoff);
  } catch {}
}

function hashBody(body) {
  return crypto.createHash('sha256').update(JSON.stringify(body ?? {})).digest('hex');
}

export async function idempotency(req, res, next) {
  const key = req.headers['idempotency-key'];
  if (!key) return next();

  if (!UUID_RE.test(key)) {
    return res.status(400).json({ error: 'Invalid Idempotency-Key format. Must be a UUID.' });
  }

  if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH' && req.method !== 'DELETE') {
    return res.status(400).json({ error: 'Idempotency-Key is only supported for mutating requests.' });
  }

  const bodyHash = hashBody(req.body);
  const db = getDb();
  const now = new Date().toISOString();

  try {
    await db.prepare(`
      INSERT INTO idempotency_keys (key, user_id, method, path, request_body_hash, status, response_status, response_body, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', 0, '{}', ?)
    `).run(key, null, req.method, req.originalUrl || req.path, bodyHash, now);
  } catch (err) {
    const existing = await db.prepare('SELECT * FROM idempotency_keys WHERE key = ?').get(key);
    if (!existing) {
      return res.status(500).json({ error: 'Idempotency check failed.' });
    }
    if (existing.request_body_hash !== bodyHash) {
      return res.status(422).json({ error: 'Idempotency key already used with a different request body.' });
    }
    if (existing.status === 'pending') {
      return res.status(409).json({ error: 'Request is already being processed.' });
    }
    return res.status(existing.response_status).json(JSON.parse(existing.response_body));
  }

  const originalJson = res.json.bind(res);
  res.json = function (body) {
    const statusCode = res.statusCode;
    const responseBody = JSON.stringify(body);
    const userId = req.user?.id || null;

    try {
      const result = db.prepare(`
        UPDATE idempotency_keys
        SET user_id = ?, response_status = ?, response_body = ?, status = 'completed'
        WHERE key = ?
      `).run(userId, statusCode, responseBody, key);
      if (result && typeof result.catch === 'function') {
        result.catch(() => {});
      }
    } catch {}

    return originalJson(body);
  };

  next();
}
