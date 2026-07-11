import { getDb } from '../utils/db.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

const MAX_AMOUNT = 1_000_000;
const ACCOUNT_NUMBER_REGEX = /^\d{10}$/;

function validateWalletInputs(amount, bank, accountNumber) {
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    return 'Invalid amount. Must be between 0 and 1,000,000.';
  }
  if (bank != null && (typeof bank !== 'string' || bank.length > 100)) {
    return 'Invalid bank name.';
  }
  if (accountNumber != null && !ACCOUNT_NUMBER_REGEX.test(String(accountNumber))) {
    return 'Invalid account number. Must be 10 digits.';
  }
  return null;
}

export async function handleFundWallet(req, res, next) {
  try {
    const amount = parseFloat(req.body.amount);
    const method = typeof req.body.method === 'string' ? req.body.method.slice(0, 50) : 'Bank Transfer';
    const inputError = validateWalletInputs(amount, null, null);
    if (inputError) return res.status(400).json({ error: inputError });

    const db = getDb();
    const userId = req.user.id;
    const now = new Date().toISOString();

    await db.prepare('UPDATE users SET balance = balance + ?, updatedAt = ? WHERE id = ?').run(amount, now, userId);
    await db.prepare(
      'INSERT INTO transactions (userId, type, amount, status, description, recipient, date) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(userId, 'wallet_funding', amount, 'completed', `Wallet Funding via ${method}`, 'Self', now);

    const user = await db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
    logger.info({ userId, amount }, 'Wallet funded');
    res.json({ balance: Number(user.balance), message: 'Wallet funded successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function handleWithdraw(req, res, next) {
  try {
    const amount = parseFloat(req.body.amount);
    const bank = typeof req.body.bank === 'string' ? req.body.bank.trim() : '';
    const accountNumber = String(req.body.accountNumber || '').trim();
    const accountName = typeof req.body.accountName === 'string' ? req.body.accountName.trim() : '';

    const inputError = validateWalletInputs(amount, bank, accountNumber);
    if (inputError) return res.status(400).json({ error: inputError });
    if (!bank) return res.status(400).json({ error: 'Bank name is required.' });
    if (!accountName) return res.status(400).json({ error: 'Account name is required.' });

    const db = getDb();
    const userId = req.user.id;

    const user = await db.prepare(
      'SELECT balance, hasTransactionPin, transactionPin FROM users WHERE id = ?'
    ).get(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (Number(user.balance) < amount) return res.status(400).json({ error: 'Insufficient balance.' });

    if (user.hasTransactionPin) {
      const pin = req.body.transactionPin;
      if (!pin || typeof pin !== 'string') {
        return res.status(400).json({ error: 'Transaction PIN is required for withdrawal.' });
      }
      const bcrypt = await import('bcryptjs');
      const valid = await bcrypt.compare(pin, user.transactionPin);
      if (!valid) return res.status(403).json({ error: 'Invalid transaction PIN.' });
    }

    const now = new Date().toISOString();
    await db.prepare('UPDATE users SET balance = balance - ?, updatedAt = ? WHERE id = ?').run(amount, now, userId);
    await db.prepare(
      'INSERT INTO transactions (userId, type, amount, status, description, recipient, date) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(userId, 'withdrawal', -amount, 'completed', `Withdrawal to ${bank} (${accountNumber})`, accountName, now);

    const updated = await db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
    logger.info({ userId, amount, bank }, 'Withdrawal completed');
    res.json({ balance: Number(updated.balance), message: 'Withdrawal successful.' });
  } catch (err) {
    next(err);
  }
}