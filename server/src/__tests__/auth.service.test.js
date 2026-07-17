// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { vi, describe, it, expect, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

const dbRef = vi.hoisted(() => ({ current: null }));

const mockFetch = vi.hoisted(() => vi.fn());
vi.stubGlobal('fetch', mockFetch);

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

vi.mock('./audit.service.js', () => ({
  logAction: vi.fn(),
  securityAlert: vi.fn(),
}));

vi.mock('otplib', () => ({
  authenticator: {
    check: vi.fn().mockReturnValue(true),
    generateSecret: vi.fn().mockReturnValue('mock-secret'),
    keyuri: vi.fn().mockReturnValue('otpauth://totp/test?secret=mock'),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: (pwd) => Promise.resolve(`hashed:${pwd}`),
    compare: (pwd, hash) => Promise.resolve(hash === `hashed:${pwd}`),
  },
  hash: (pwd) => Promise.resolve(`hashed:${pwd}`),
  compare: (pwd, hash) => Promise.resolve(hash === `hashed:${pwd}`),
}));

import { createTestDb } from './test-db.js';

const Database = (await import('better-sqlite3')).default;

beforeEach(() => {
  dbRef.current = createTestDb();
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve('') });
});

import {
  validatePasswordComplexity, getPasswordPolicy,
  register, authenticate,
  forgotPassword, resetPassword,
  getUserById, updateUserProfile,
  generateVerificationToken, verifyEmailToken,
} from '../services/auth.service.js';

describe('validatePasswordComplexity', () => {
  it('returns empty array for valid password', () => {
    expect(validatePasswordComplexity('StrongP@ssword1')).toEqual([]);
  });

  it('requires at least 12 characters', () => {
    const errors = validatePasswordComplexity('Short1@');
    expect(errors.some(e => e.includes('12'))).toBe(true);
  });

  it('requires at least one uppercase letter', () => {
    const errors = validatePasswordComplexity('alllowercase1@');
    expect(errors.some(e => e.includes('uppercase'))).toBe(true);
  });

  it('requires at least one lowercase letter', () => {
    const errors = validatePasswordComplexity('ALLUPPERCASE1@');
    expect(errors.some(e => e.includes('lowercase'))).toBe(true);
  });

  it('requires at least one number', () => {
    const errors = validatePasswordComplexity('NoNumbers@');
    expect(errors.some(e => e.includes('number'))).toBe(true);
  });

  it('requires at least one special character', () => {
    const errors = validatePasswordComplexity('NoSpecialChar1');
    expect(errors.some(e => e.includes('special'))).toBe(true);
  });
});

describe('getPasswordPolicy', () => {
  it('returns policy with minLength 12', () => {
    const policy = getPasswordPolicy();
    expect(policy.minLength).toBe(12);
  });
});

describe('register', () => {
  const validEmail = 'test@example.com';
  const validPassword = 'StrongP@ss123';

  it('creates a user successfully', async () => {
    const result = await register({ email: validEmail, password: validPassword, ip: '::1', userAgent: 'test' });
    expect(result).toHaveProperty('id');
    expect(result.email).toBe(validEmail);
    expect(result.role).toBe('user');
  });

  it('throws 409 for duplicate email', async () => {
    await register({ email: validEmail, password: validPassword, ip: '::1', userAgent: 'test' });
    await expect(register({ email: validEmail, password: validPassword, ip: '::1', userAgent: 'test' }))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  it('throws 400 for weak password', async () => {
    await expect(register({ email: 'weak@example.com', password: 'short', ip: '::1', userAgent: 'test' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('stores hashed password', async () => {
    const result = await register({ email: validEmail, password: validPassword, ip: '::1', userAgent: 'test' });
    const db = dbRef.current;
    const row = db.prepare('SELECT password FROM users WHERE id = ?').get(result.id);
    expect(row.password).not.toBe(validPassword);
    expect(await bcrypt.compare(validPassword, row.password)).toBe(true);
  });
});

describe('authenticate', () => {
  const email = 'auth@example.com';
  const password = 'StrongP@ss123';

  beforeEach(async () => {
    vi.stubEnv('SMS_PROVIDER', 'true');
    await register({ email, password, ip: '::1', userAgent: 'test' });
    const db = dbRef.current;
    db.prepare('UPDATE users SET emailVerified = 1 WHERE email = ?').run(email);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns user data on valid credentials', async () => {
    const result = await authenticate(email, password, null, '::1', 'test');
    expect(result).toHaveProperty('id');
    expect(result.email).toBe(email);
  });

  it('throws 401 for invalid password', async () => {
    await expect(authenticate(email, 'WrongP@ss1', null, '::1', 'test'))
      .rejects.toThrow();
  });

  it('throws 401 for non-existent user', async () => {
    await expect(authenticate('nobody@example.com', password, null, '::1', 'test'))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 401 for unverified email', async () => {
    const db = dbRef.current;
    db.prepare('UPDATE users SET emailVerified = 0 WHERE email = ?').run(email);
    await expect(authenticate(email, password, null, '::1', 'test'))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('returns mfaRequired when MFA is enabled and no totpCode', async () => {
    const db = dbRef.current;
    db.prepare('UPDATE users SET mfaEnabled = 1, mfaSecret = ? WHERE email = ?').run('secret', email);
    const result = await authenticate(email, password, null, '::1', 'test');
    expect(result.mfaRequired).toBe(true);
  });
});

describe('forgotPassword', () => {
  it('returns success message even for unknown email', async () => {
    const result = await forgotPassword('unknown@example.com', '::1', 'test');
    expect(result.message).toContain('reset link');
  });

  it('creates reset token for known user', async () => {
    await register({ email: 'reset@example.com', password: 'StrongP@ss123', ip: '::1', userAgent: 'test' });
    const result = await forgotPassword('reset@example.com', '::1', 'test');
    expect(result.message).toContain('reset link');
    const db = dbRef.current;
    const user = db.prepare('SELECT resetToken FROM users WHERE email = ?').get('reset@example.com');
    expect(user.resetToken).toBeTruthy();
  });
});

describe('resetPassword', () => {
  const email = 'resetpwd@example.com';
  const password = 'StrongP@ss123';
  const newPassword = 'NewStrongP@ss1';

  beforeEach(async () => {
    await register({ email, password, ip: '::1', userAgent: 'test' });
  });

  it('resets password with valid token', async () => {
    await forgotPassword(email, '::1', 'test');
    const db = dbRef.current;
    const user = db.prepare('SELECT resetToken FROM users WHERE email = ?').get(email);
    const result = await resetPassword(user.resetToken, newPassword, '::1', 'test');
    expect(result.userId).toBeTruthy();
    expect(result.message).toContain('Password updated');
  });

  it('throws 400 for invalid token', async () => {
    await expect(resetPassword('invalidtoken123', newPassword, '::1', 'test'))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 for weak new password', async () => {
    await forgotPassword(email, '::1', 'test');
    const db = dbRef.current;
    const user = db.prepare('SELECT resetToken FROM users WHERE email = ?').get(email);
    await expect(resetPassword(user.resetToken, 'short', '::1', 'test'))
      .rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('getUserById', () => {
  it('returns null for non-existent user', async () => {
    const user = await getUserById('nonexistent-id');
    expect(user).toBeNull();
  });

  it('returns user data for existing user', async () => {
    const result = await register({ email: 'getbyid@example.com', password: 'StrongP@ss123', ip: '::1', userAgent: 'test' });
    const user = await getUserById(result.id);
    expect(user).not.toBeNull();
    expect(user.email).toBe('getbyid@example.com');
  });
});

describe('updateUserProfile', () => {
  it('updates allowed fields', async () => {
    const result = await register({ email: 'profile@example.com', password: 'StrongP@ss123', ip: '::1', userAgent: 'test' });
    const updated = await updateUserProfile(result.id, { name: 'New Name', phone: '+2348012345678' }, '::1', 'test');
    expect(updated.name).toBe('New Name');
    expect(updated.phone).toBe('+2348012345678');
  });

  it('throws 404 for non-existent user', async () => {
    await expect(updateUserProfile('bad-id', { name: 'Test' }, '::1', 'test'))
      .rejects.toThrow(/not found/);
  });
});

describe('generateVerificationToken / verifyEmailToken', () => {
  it('generates and verifies a token', async () => {
    const result = await register({ email: 'verify@example.com', password: 'StrongP@ss123', ip: '::1', userAgent: 'test' });
    const token = await generateVerificationToken({ id: result.id });
    expect(token).toBeTruthy();
    const verified = await verifyEmailToken(token);
    expect(verified).toHaveProperty('id');
    expect(verified.email).toBe('verify@example.com');
  });

  it('throws 400 for expired/invalid token', async () => {
    await expect(verifyEmailToken('badtoken')).rejects.toThrow();
  });
});
