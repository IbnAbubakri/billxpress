import { vi, describe, it, expect, beforeEach } from 'vitest';

const dbRef = vi.hoisted(() => ({ current: null }));

vi.mock('../utils/db.js', () => ({
  getDb: () => dbRef.current,
  initDatabase: () => dbRef.current,
  closeDb: () => {},
  default: dbRef,
}));

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
}));

import { createTestDb } from './test-db.js';
import { idempotency } from '../middleware/idempotency.middleware.js';

function mockReq(overrides = {}) {
  const req = {
    headers: {},
    method: 'POST',
    body: {},
    originalUrl: '/api/test',
    user: { id: 'user-1' },
    ...overrides,
    headers: { ...overrides.headers },
  };
  return req;
}

function mockRes() {
  const state = { statusCode: 200, body: null };
  const res = {
    statusCode: 200,
    status(code) {
      res.statusCode = code;
      state.statusCode = code;
      return res;
    },
    json(body) {
      state.body = body;
      return res;
    },
    state,
  };
  return res;
}

function mockNext() {
  return vi.fn();
}

beforeEach(() => {
  dbRef.current = createTestDb();
});

describe('idempotency middleware', () => {
  it('passes through when no Idempotency-Key header is set', async () => {
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    await idempotency(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('rejects non-UUID key format', async () => {
    const req = mockReq({ headers: { 'idempotency-key': 'not-a-uuid' } });
    const res = mockRes();
    const next = mockNext();

    await idempotency(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.state.body).toEqual({ error: 'Invalid Idempotency-Key format. Must be a UUID.' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects GET requests with Idempotency-Key', async () => {
    const req = mockReq({ method: 'GET', headers: { 'idempotency-key': '550e8400-e29b-41d4-a716-446655440000' } });
    const res = mockRes();
    const next = mockNext();

    await idempotency(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.state.body).toEqual({ error: 'Idempotency-Key is only supported for mutating requests.' });
    expect(res.statusCode).toBe(400);
  });

  it('allows request through for valid UUID key and stores response', async () => {
    const req = mockReq({ headers: { 'idempotency-key': '550e8400-e29b-41d4-a716-446655440000' } });
    const res = mockRes();
    const next = mockNext();

    await idempotency(req, res, next);

    expect(next).toHaveBeenCalledOnce();

    res.json({ success: true, message: 'Done' });

    const stored = dbRef.current.prepare('SELECT * FROM idempotency_keys WHERE key = ?').get('550e8400-e29b-41d4-a716-446655440000');
    expect(stored).toBeTruthy();
    expect(stored.status).toBe('completed');
    expect(stored.response_status).toBe(200);
    expect(stored.method).toBe('POST');
    expect(stored.path).toBe('/api/test');
  });

  it('returns cached response for duplicate key with same body', async () => {
    const key = '550e8400-e29b-41d4-a716-446655440000';
    const req1 = mockReq({ headers: { 'idempotency-key': key }, body: { amount: 100 } });
    const res1 = mockRes();
    const next1 = mockNext();

    await idempotency(req1, res1, next1);
    res1.statusCode = 200;
    res1.json({ success: true, reference: 'ref-123' });

    const req2 = mockReq({ headers: { 'idempotency-key': key }, body: { amount: 100 } });
    const res2 = mockRes();
    const next2 = mockNext();

    await idempotency(req2, res2, next2);

    expect(next2).not.toHaveBeenCalled();
    expect(res2.state.body).toEqual({ success: true, reference: 'ref-123' });
    expect(res2.statusCode).toBe(200);
  });

  it('returns 422 when same key used with different body', async () => {
    const key = '550e8400-e29b-41d4-a716-446655440000';
    const req1 = mockReq({ headers: { 'idempotency-key': key }, body: { amount: 100 } });
    const res1 = mockRes();
    const next1 = mockNext();

    await idempotency(req1, res1, next1);
    res1.statusCode = 200;
    res1.json({ success: true });

    const req2 = mockReq({ headers: { 'idempotency-key': key }, body: { amount: 200 } });
    const res2 = mockRes();
    const next2 = mockNext();

    await idempotency(req2, res2, next2);

    expect(next2).not.toHaveBeenCalled();
    expect(res2.state.body).toEqual({ error: 'Idempotency key already used with a different request body.' });
    expect(res2.statusCode).toBe(422);
  });

  it('returns 409 when key is still pending (concurrent request)', async () => {
    const key = '550e8400-e29b-41d4-a716-446655440000';
    const bodyHash = '44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a';

    dbRef.current.prepare(`
      INSERT INTO idempotency_keys (key, user_id, method, path, request_body_hash, status, response_status, response_body)
      VALUES (?, ?, ?, ?, ?, 'pending', 0, '{}')
    `).run(key, null, 'POST', '/api/test', bodyHash);

    const req = mockReq({ headers: { 'idempotency-key': key } });
    const res = mockRes();
    const next = mockNext();

    await idempotency(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.state.body).toEqual({ error: 'Request is already being processed.' });
    expect(res.statusCode).toBe(409);
  });

  it('stores correct error response status codes', async () => {
    const key = '550e8400-e29b-41d4-a716-446655440001';
    const req = mockReq({ headers: { 'idempotency-key': key } });
    const res = mockRes();
    const next = mockNext();

    await idempotency(req, res, next);

    res.statusCode = 422;
    res.json({ error: 'Validation failed' });

    const stored = dbRef.current.prepare('SELECT * FROM idempotency_keys WHERE key = ?').get(key);
    expect(stored.response_status).toBe(422);
    expect(stored.status).toBe('completed');
  });

  it('works with empty body', async () => {
    const key = '550e8400-e29b-41d4-a716-446655440002';
    const req = mockReq({ headers: { 'idempotency-key': key }, body: null });
    const res = mockRes();
    const next = mockNext();

    await idempotency(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('stores the user ID from req.user on completion', async () => {
    const key = '550e8400-e29b-41d4-a716-446655440003';
    const req = mockReq({ headers: { 'idempotency-key': key }, user: { id: 'user-42' } });
    const res = mockRes();
    const next = mockNext();

    await idempotency(req, res, next);
    res.json({ ok: true });

    const stored = dbRef.current.prepare('SELECT * FROM idempotency_keys WHERE key = ?').get(key);
    expect(stored.user_id).toBe('user-42');
  });
});
