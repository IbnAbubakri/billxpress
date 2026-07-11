import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../.env') });

import app from '../app.js';

let server;

beforeAll(() => {
  server = app.listen(0);
});

afterAll(() => {
  server?.close();
});

describe('API Integration Tests', () => {
  it('health endpoint returns ok', async () => {
    const res = await fetch(`http://localhost:${server.address().port}/api/health`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('status', 'ok');
  });

  it('openapi spec is served', async () => {
    const res = await fetch(`http://localhost:${server.address().port}/api/openapi.json`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveProperty('openapi', '3.0.3');
  });

  it('returns 404 for unknown API route', async () => {
    const res = await fetch(`http://localhost:${server.address().port}/api/nonexistent`);
    expect(res.status).toBe(404);
  });

  it('csrf-token endpoint sets cookie', async () => {
    const res = await fetch(`http://localhost:${server.address().port}/api/auth/csrf-token`);
    const cookies = res.headers.get('set-cookie') || '';
    expect(cookies).toContain('csrf-token');
  });
});
