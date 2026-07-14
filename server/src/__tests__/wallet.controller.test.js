// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

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
import { handleFundWallet, handleWithdraw } from '../controllers/wallet.controller.js';

const Database = (await import('better-sqlite3')).default;

beforeEach(() => {
  dbRef.current = createTestDb();
  dbRef.current.exec('CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, userId TEXT, type TEXT, amount REAL, status TEXT, description TEXT, recipient TEXT, date TEXT)');
});

function mockReq(body = {}, user = { id: 'user-1' }) {
  return { body, user: { ...user, role: user.role || 'user' } };
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function seedUser(db, overrides = {}) {
  db.prepare(`INSERT INTO users (id, email, password, name, phone, balance, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    overrides.id || 'user-1',
    overrides.email || 'test@example.com',
    'hashedpass',
    'Test User',
    '1234567890',
    overrides.balance ?? 1000,
    new Date().toISOString()
  );
}

describe('wallet.controller', () => {
  describe('handleFundWallet', () => {
    it('should reject non-admin users', async () => {
      const db = dbRef.current;
      seedUser(db, { balance: 500 });
      const req = mockReq({ amount: 200, method: 'Bank Transfer' }, { id: 'user-1', role: 'user' });
      const res = mockRes();

      await handleFundWallet(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Only admins can perform direct wallet funding' });
    });

    it('should fund wallet successfully for admin', async () => {
      const db = dbRef.current;
      seedUser(db, { balance: 500 });
      const req = mockReq({ amount: 200, method: 'Bank Transfer' }, { id: 'user-1', role: 'admin' });
      const res = mockRes();

      await handleFundWallet(req, res, vi.fn());

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Wallet funded successfully.' })
      );
      const user = db.prepare('SELECT balance FROM users WHERE id = ?').get('user-1');
      expect(Number(user.balance)).toBe(700);
    });

    it('should reject zero amount', async () => {
      const req = mockReq({ amount: 0 }, { id: 'user-1', role: 'admin' });
      const res = mockRes();

      await handleFundWallet(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid amount. Must be between 0 and 500,000.' });
    });

    it('should reject negative amount', async () => {
      const req = mockReq({ amount: -100 }, { id: 'user-1', role: 'admin' });
      const res = mockRes();

      await handleFundWallet(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject excessive amount', async () => {
      const req = mockReq({ amount: 1_500_000 }, { id: 'user-1', role: 'admin' });
      const res = mockRes();

      await handleFundWallet(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('handleWithdraw', () => {
    it('should withdraw successfully when no PIN set', async () => {
      const db = dbRef.current;
      seedUser(db, { balance: 1000 });
      const req = mockReq({ amount: 300, bank: 'GTBank', accountNumber: '0123456789', accountName: 'Test User' });
      const res = mockRes();

      await handleWithdraw(req, res, vi.fn());

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Withdrawal successful.' })
      );
      const user = db.prepare('SELECT balance FROM users WHERE id = ?').get('user-1');
      expect(Number(user.balance)).toBe(700);
    });

    it('should reject withdrawal with insufficient balance', async () => {
      const db = dbRef.current;
      seedUser(db, { balance: 100 });
      const req = mockReq({ amount: 999, bank: 'GTBank', accountNumber: '0123456789', accountName: 'Test User' });
      const res = mockRes();

      const next = vi.fn();
      await handleWithdraw(req, res, next);

      if (res.status.mock.calls.length > 0) {
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient balance.' });
      } else {
        expect(next).toHaveBeenCalled();
      }
    });

    it('should reject invalid amount', async () => {
      seedUser(dbRef.current, { balance: 1000 });
      const req = mockReq({ amount: 0, bank: 'GTBank', accountNumber: '0123456789', accountName: 'Test User' });
      const res = mockRes();

      await handleWithdraw(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject missing bank details', async () => {
      seedUser(dbRef.current, { balance: 1000 });
      const req = mockReq({ amount: 100 });
      const res = mockRes();

      await handleWithdraw(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject invalid account number', async () => {
      seedUser(dbRef.current, { balance: 1000 });
      const req = mockReq({ amount: 100, bank: 'GTBank', accountNumber: '123', accountName: 'Test' });
      const res = mockRes();

      await handleWithdraw(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should require PIN when hasTransactionPin is set', async () => {
      const db = dbRef.current;
      seedUser(db, { balance: 1000 });
      db.prepare('UPDATE users SET hasTransactionPin = 1, transactionPin = ? WHERE id = ?')
        .run('$2a$10$hashedpindemo1234567890123456789012345678901234567890', 'user-1');

      const req = mockReq({ amount: 100, bank: 'GTBank', accountNumber: '0123456789', accountName: 'Test' });
      const res = mockRes();

      const next = vi.fn();
      await handleWithdraw(req, res, next);

      if (res.status.mock.calls.length > 0) {
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Transaction PIN is required for withdrawal.' });
      } else {
        expect(next).toHaveBeenCalled();
      }
    });
  });
});
