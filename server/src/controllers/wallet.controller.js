import { getDb } from '../utils/db.js';
import logger from '../utils/logger.js';

export async function handleFundWallet(req, res) {
  const { amount, method } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount.' });

  const db = getDb();
  const userId = req.user.id;
  const now = new Date().toISOString();

  await db.prepare('UPDATE users SET balance = balance + ?, updatedAt = ? WHERE id = ?').run(amount, now, userId);
  await db.prepare(
    'INSERT INTO transactions (userId, type, amount, status, description, recipient, date) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, 'wallet_funding', amount, 'completed', `Wallet Funding via ${method || 'Bank Transfer'}`, 'Self', now);

  const user = await db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
  logger.info({ userId, amount }, 'Wallet funded');
  res.json({ balance: Number(user.balance), message: 'Wallet funded successfully.' });
}

export async function handleWithdraw(req, res) {
  const { amount, bank, accountNumber, accountName } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount.' });
  if (!bank || !accountNumber || !accountName) return res.status(400).json({ error: 'Bank details required.' });

  const db = getDb();
  const userId = req.user.id;
  const user = await db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
  if (Number(user.balance) < amount) return res.status(400).json({ error: 'Insufficient balance.' });

  const now = new Date().toISOString();
  await db.prepare('UPDATE users SET balance = balance - ?, updatedAt = ? WHERE id = ?').run(amount, now, userId);
  await db.prepare(
    'INSERT INTO transactions (userId, type, amount, status, description, recipient, date) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, 'withdrawal', -amount, 'completed', `Withdrawal to ${bank} (${accountNumber})`, accountName, now);

  const updated = await db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
  logger.info({ userId, amount, bank }, 'Withdrawal completed');
  res.json({ balance: Number(updated.balance), message: 'Withdrawal successful.' });
}