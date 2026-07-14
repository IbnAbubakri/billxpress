// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { getDb } from '../utils/db.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcryptjs';
import env from '../config/env.js';
import { initializeTransaction, verifyTransaction, generateReference } from '../services/paystack.service.js';

const MAX_AMOUNT = 500_000;
const ACCOUNT_NUMBER_REGEX = /^\d{10}$/;

const METHOD_CHANNEL_MAP = {
  card: ['card'],
  bank_transfer: ['bank_transfer'],
  ussd: ['ussd'],
};

function validateWalletInputs(amount, bank, accountNumber) {
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    return 'Invalid amount. Must be between 0 and 500,000.';
  }
  if (bank != null && (typeof bank !== 'string' || bank.length > 100)) {
    return 'Invalid bank name.';
  }
  if (accountNumber != null && !ACCOUNT_NUMBER_REGEX.test(String(accountNumber))) {
    return 'Invalid account number. Must be 10 digits.';
  }
  return null;
}

export async function handleInitializeFunding(req, res, next) {
  try {
    const { amount, method } = req.body;
    const userId = req.user.id;
    const email = req.user.email;

    if (!env.PAYSTACK_SECRET_KEY) {
      return res.status(503).json({ error: 'Payment gateway not configured. Please set PAYSTACK_SECRET_KEY.' });
    }

    const numAmount = parseFloat(amount);
    if (!Number.isFinite(numAmount) || numAmount < 100 || numAmount > MAX_AMOUNT) {
      return res.status(400).json({ error: `Amount must be between ₦100 and ₦${MAX_AMOUNT.toLocaleString()}` });
    }

    const reference = generateReference(userId);
    const callbackUrl = `${env.APP_URL}/wallet/fund/verify`;
    const channels = METHOD_CHANNEL_MAP[method] || undefined;

    const result = await initializeTransaction({
      email,
      amount: numAmount,
      reference,
      callbackUrl,
      channels,
      metadata: { user_id: userId, purpose: 'wallet_funding' },
    });

    const db = getDb();
    await db.prepare(
      `INSERT INTO wallet_funding_transactions
       (user_id, paystack_reference, amount, currency, status)
       VALUES (?, ?, ?, ?, ?)`
    ).run(userId, reference, numAmount, 'NGN', 'pending');

    res.json({
      authorization_url: result.data.authorization_url,
      reference,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleVerifyFunding(req, res, next) {
  try {
    if (!env.PAYSTACK_SECRET_KEY) {
      return res.status(503).json({ error: 'Payment gateway not configured. Please set PAYSTACK_SECRET_KEY.' });
    }
    const { reference } = req.query;
    if (!reference) return res.status(400).json({ error: 'Reference is required' });

    const verification = await verifyTransaction(reference);

    if (verification.data.status === 'success') {
      const { amount, paid_at, channel } = verification.data;
      const userId = verification.data.metadata?.user_id;
      if (!userId) return res.status(400).json({ error: 'Missing user_id in metadata' });

      const amountInNaira = amount / 100;
      const paidAtDate = paid_at || new Date().toISOString();

      const db = getDb();
      let result;
      await db.transaction(async (tx) => {
        const existing = await tx.get(
          'SELECT id, status, user_id FROM wallet_funding_transactions WHERE paystack_reference = ? FOR UPDATE',
          reference
        );

        const txRecord = existing || { id: null };

        if (existing && existing.status === 'completed') {
          result = { credited: false, existing: true };
          return;
        }

        if (existing) {
          await tx.run(
            `UPDATE wallet_funding_transactions SET status = ?, payment_method = ?, gateway_response = ?, paid_at = ? WHERE id = ?`,
            'completed', channel, 'Successful', paidAtDate, existing.id
          );
        } else {
          await tx.run(
            `INSERT INTO wallet_funding_transactions
             (user_id, paystack_reference, amount, currency, status, payment_method, gateway_response, paid_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            userId, reference, amountInNaira, 'NGN', 'completed', channel, 'Successful', paidAtDate
          );
        }

        await tx.run(
          'UPDATE users SET balance = balance + ?, updatedAt = ? WHERE id = ?',
          amountInNaira, new Date().toISOString(), userId
        );

        await tx.run(
          `INSERT INTO transactions (userId, type, amount, status, description, recipient, date)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          userId, 'wallet_funding', amountInNaira, 'completed',
          `Wallet Funding via ${channel}`, 'Self', paidAtDate
        );

        result = { credited: true, existing: false };
      });

      if (result.existing) {
        const currentUser = await db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
        return res.json({ status: 'completed', message: 'Payment already processed', balance: Number(currentUser.balance), amountFunded: 0 });
      }

      const updatedUser = await db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
      return res.json({ status: 'completed', message: 'Payment verified successfully', balance: Number(updatedUser.balance), amountFunded: Number(amountInNaira) });
    }

    res.json({ status: verification.data.status, message: 'Payment not successful' });
  } catch (error) {
    next(error);
  }
}

export async function handleFundWallet(req, res, next) {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can perform direct wallet funding' });
    }
    const amount = parseFloat(req.body.amount);
    const method = typeof req.body.method === 'string' ? req.body.method.slice(0, 50) : 'Bank Transfer';
    const inputError = validateWalletInputs(amount, null, null);
    if (inputError) return res.status(400).json({ error: inputError });

    const db = getDb();
    const userId = req.user.id;
    const now = new Date().toISOString();

    await db.transaction(async (tx) => {
      const user = await tx.get('SELECT balance FROM users WHERE id = ? FOR UPDATE', userId);
      if (!user) throw new AppError('User not found.', 404);

      await tx.run('UPDATE users SET balance = balance + ?, updatedAt = ? WHERE id = ?', amount, now, userId);
      await tx.run(
        'INSERT INTO transactions (userId, type, amount, status, description, recipient, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        userId, 'wallet_funding', amount, 'completed', `Wallet Funding via ${method}`, 'Self', now
      );
    });

    const updated = await db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
    logger.info({ userId, amount }, 'Wallet funded by admin');
    res.json({ balance: Number(updated.balance), message: 'Wallet funded successfully.' });
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

    await db.transaction(async (tx) => {
      const user = await tx.get(
        'SELECT balance, hasTransactionPin, transactionPin FROM users WHERE id = ? FOR UPDATE', userId
      );
      if (!user) throw new AppError('User not found.', 404);
      if (Number(user.balance) < amount) throw new AppError('Insufficient balance.', 400);

      if (user.hasTransactionPin) {
        const pin = req.body.transactionPin;
        if (!pin || typeof pin !== 'string') {
          throw new AppError('Transaction PIN is required for withdrawal.', 400);
        }
        const valid = await bcrypt.compare(pin, user.transactionPin);
        if (!valid) throw new AppError('Invalid transaction PIN.', 403);
      }

      const now = new Date().toISOString();
      await tx.run('UPDATE users SET balance = balance - ?, updatedAt = ? WHERE id = ?', amount, now, userId);
      await tx.run(
        'INSERT INTO transactions (userId, type, amount, status, description, recipient, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        userId, 'withdrawal', -amount, 'completed', `Withdrawal to ${bank} (${accountNumber})`, accountName, now
      );
    });

    const updated = await db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
    logger.info({ userId, amount, bank }, 'Withdrawal completed');
    res.json({ balance: Number(updated.balance), message: 'Withdrawal successful.' });
  } catch (err) {
    next(err);
  }
}
