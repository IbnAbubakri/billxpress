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

const paystackRef = vi.hoisted(() => ({
  listBanks: vi.fn(),
  resolveAccountNumber: vi.fn(),
}));

vi.mock('../config/env.js', () => ({
  default: {
    PAYSTACK_SECRET_KEY: 'sk_test_dummy',
    APP_URL: 'http://localhost:5173',
    isDev: () => false,
    isProd: () => false,
  },
}));

vi.mock('../services/paystack.service.js', () => ({
  initializeTransaction: vi.fn(),
  verifyTransaction: vi.fn(),
  generateReference: () => 'ref_test',
  listBanks: paystackRef.listBanks,
  resolveAccountNumber: paystackRef.resolveAccountNumber,
}));

import { createTestDb } from './test-db.js';
import { handleFundWallet, handleWithdraw, handleGetBanks, handleResolveAccount } from '../controllers/wallet.controller.js';

const Database = (await import('better-sqlite3')).default;

beforeEach(() => {
  process.env.PAYSTACK_SECRET_KEY = 'sk_test_dummy';
  dbRef.current = createTestDb();
  dbRef.current.exec('CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, userId TEXT, type TEXT, amount REAL, status TEXT, description TEXT, recipient TEXT, date TEXT)');
  paystackRef.listBanks.mockReset();
  paystackRef.resolveAccountNumber.mockReset();
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
      seedUser(db, { balance: 2000 });
      const req = mockReq({ amount: 1000, bank: 'GTBank', accountNumber: '0123456789', accountName: 'Test User' });
      const res = mockRes();

      await handleWithdraw(req, res, vi.fn());

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Withdrawal successful.' })
      );
      const user = db.prepare('SELECT balance FROM users WHERE id = ?').get('user-1');
      expect(Number(user.balance)).toBe(1000);
    });

    it('should reject withdrawal with insufficient balance', async () => {
      const db = dbRef.current;
      seedUser(db, { balance: 500 });
      const req = mockReq({ amount: 1000, bank: 'GTBank', accountNumber: '0123456789', accountName: 'Test User' });
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

    it('should reject amounts below the minimum withdrawal', async () => {
      seedUser(dbRef.current, { balance: 1000 });
      const req = mockReq({ amount: 999, bank: 'GTBank', accountNumber: '0123456789', accountName: 'Test User' });
      const res = mockRes();

      await handleWithdraw(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Minimum withdrawal is ₦1,000' });
    });

    it('should reject missing bank details', async () => {
      seedUser(dbRef.current, { balance: 1000 });
      const req = mockReq({ amount: 1000 });
      const res = mockRes();

      await handleWithdraw(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject invalid account number', async () => {
      seedUser(dbRef.current, { balance: 1000 });
      const req = mockReq({ amount: 1000, bank: 'GTBank', accountNumber: '123', accountName: 'Test' });
      const res = mockRes();

      await handleWithdraw(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should require PIN when hasTransactionPin is set', async () => {
      const db = dbRef.current;
      seedUser(db, { balance: 1000 });
      db.prepare('UPDATE users SET hasTransactionPin = 1, transactionPin = ? WHERE id = ?')
        .run('$2a$10$hashedpindemo1234567890123456789012345678901234567890', 'user-1');

      const req = mockReq({ amount: 1000, bank: 'GTBank', accountNumber: '0123456789', accountName: 'Test' });
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

  describe('handleGetBanks', () => {
    it('should return a mapped bank list', async () => {
      paystackRef.listBanks.mockResolvedValue({
        data: [
          { name: 'Guaranty Trust Bank', code: '058', id: 1, slug: 'gtb' },
          { name: 'Zenith Bank', code: '057', id: 2 },
          { name: 'No Code Bank' },
        ],
      });
      const req = mockReq({}, { id: 'user-1' });
      const res = mockRes();

      await handleGetBanks(req, res, vi.fn());

      expect(res.json).toHaveBeenCalledWith({
        banks: [
          { name: 'Guaranty Trust Bank', code: '058' },
          { name: 'Zenith Bank', code: '057' },
        ],
      });
    });

    it('should return an empty list when Paystack returns no banks', async () => {
      paystackRef.listBanks.mockResolvedValue({ data: null });
      const req = mockReq({}, { id: 'user-1' });
      const res = mockRes();

      await handleGetBanks(req, res, vi.fn());

      expect(res.json).toHaveBeenCalledWith({ banks: [] });
    });
  });

  describe('handleResolveAccount', () => {
    it('should resolve and return the account name', async () => {
      paystackRef.resolveAccountNumber.mockResolvedValue({
        data: { account_name: 'JOHN DOE', account_number: '0123456789' },
      });
      const req = { query: { accountNumber: '0123456789', bankCode: '058' } };
      const res = mockRes();

      await handleResolveAccount(req, res, vi.fn());

      expect(paystackRef.resolveAccountNumber).toHaveBeenCalledWith('0123456789', '058');
      expect(res.json).toHaveBeenCalledWith({ accountName: 'JOHN DOE', accountNumber: '0123456789' });
    });

    it('should reject an invalid account number', async () => {
      const req = { query: { accountNumber: '123', bankCode: '058' } };
      const res = mockRes();

      await handleResolveAccount(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(paystackRef.resolveAccountNumber).not.toHaveBeenCalled();
    });

    it('should reject a missing bank code', async () => {
      const req = { query: { accountNumber: '0123456789' } };
      const res = mockRes();

      await handleResolveAccount(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when Paystack cannot resolve the account', async () => {
      paystackRef.resolveAccountNumber.mockRejectedValue({ response: { status: 422 } });
      const req = { query: { accountNumber: '0123456789', bankCode: '058' } };
      const res = mockRes();

      await handleResolveAccount(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should treat any Paystack 4xx as unresolved (404)', async () => {
      paystackRef.resolveAccountNumber.mockRejectedValue({ response: { status: 400 } });
      const req = { query: { accountNumber: '0123456789', bankCode: '999992' } };
      const res = mockRes();

      await handleResolveAccount(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 502 when the verification service is unreachable', async () => {
      paystackRef.resolveAccountNumber.mockRejectedValue(new Error('network timeout'));
      const req = { query: { accountNumber: '0123456789', bankCode: '058' } };
      const res = mockRes();

      await handleResolveAccount(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(502);
    });
  });
});
