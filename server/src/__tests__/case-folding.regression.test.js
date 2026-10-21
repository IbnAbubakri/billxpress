// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507
//
// Regression coverage for the PostgreSQL identifier case-folding bug class.
// PostgreSQL folds UNQUOTED identifiers to lowercase (lockeduntil, mfasecret,
// hastransactionpin, ...) while SQLite preserves case. The test DB folds rows
// to lowercase exactly like PG, so these tests fail if the application reads a
// camelCase column that PG would have folded, or writes one that PG would have
// matched case-insensitively.

import { vi, describe, it, expect, beforeEach } from 'vitest';

const dbRef = vi.hoisted(() => ({ current: null }));

vi.mock('../utils/db.js', () => ({
  getDb: () => dbRef.current,
  initDatabase: () => dbRef.current,
  closeDb: () => {},
  default: dbRef,
}));

vi.mock('../config/env.js', () => ({
  default: {
    DEMO_MODE: false,
    isDev: () => false,
    isProd: () => false,
    JWT_SECRET: 'test-secret-that-is-long-enough-for-testing',
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
    CORS_ORIGIN: 'http://localhost:5173',
    APP_URL: 'http://localhost:5173',
    MASTER_SECRET: 'test-master-secret-long-enough-for-testing',
    NODE_ENV: 'test',
    PAYSTACK_SECRET_KEY: 'sk_test_xxxx',
    PAYSTACK_PUBLIC_KEY: 'pk_test_xxxx',
    PAYSTACK_WEBHOOK_SECRET: 'whsec_test',
  },
}));

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
}));

vi.mock('../services/audit.service.js', () => ({
  logAction: vi.fn(),
  securityAlert: vi.fn(),
}));

import { createTestDb } from './test-db.js';
import { isAccountLocked, MAX_ATTEMPTS } from '../services/auth/helpers.js';
import { getDb } from '../utils/db.js';

function seedUser(db, overrides = {}) {
  const now = new Date().toISOString();
  const user = {
    id: 'u-1', email: 'locked@example.com', password: 'hashed', role: 'user',
    name: 'Test', phone: '+2348012345678', balance: 0,
    hasTransactionPin: 0, createdAt: now,
    failedLoginAttempts: 0, lockedUntil: null,
    mfaEnabled: 0, mfaSecret: null,
    passwordHistory: '[]', resetToken: null, resetTokenExpires: null,
    emailVerified: 0, emailVerificationExpires: null,
    ...overrides,
  };
  const cols = Object.keys(user);
  db.prepare(`INSERT INTO users (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`)
    .run(...cols.map(c => user[c]));
  return user;
}

describe('case-folding regression (PG folds identifiers to lowercase)', () => {
  beforeEach(() => {
    dbRef.current = createTestDb();
  });

  it('isAccountLocked sees lockedUntil written as camelCase', async () => {
    const db = getDb();
    seedUser(db);
    const email = 'locked@example.com';
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    // Simulate a locked account: count >= MAX_ATTEMPTS and a future lockedUntil.
    db.prepare('UPDATE login_attempts SET lockedUntil = ? WHERE key = ?').run(future, email);
    db.prepare('INSERT INTO login_attempts (key, count, lastAttempt, lockedUntil) VALUES (?,?,?,?)')
      .run(email, MAX_ATTEMPTS, new Date().toISOString(), future);

    await expect(isAccountLocked(email)).resolves.toBe(true);
  });

  it('isAccountLocked returns false when lockout window has passed', async () => {
    const db = getDb();
    seedUser(db);
    const email = 'locked@example.com';
    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO login_attempts (key, count, lastAttempt, lockedUntil) VALUES (?,?,?,?)')
      .run(email, MAX_ATTEMPTS, past, past);

    await expect(isAccountLocked(email)).resolves.toBe(false);
    // Expired lockout is cleared.
    const row = db.prepare('SELECT * FROM login_attempts WHERE key = ?').get(email);
    expect(row).toBeUndefined();
  });
});
