import bcrypt from 'bcryptjs';
import AppError from '../../utils/AppError.js';
import logger from '../../utils/logger.js';
import { logAction } from '../audit.service.js';
import { getDb } from '../../utils/db.js';
import { SALT_ROUNDS } from './helpers.js';

export async function setTransactionPin(id, pin, ip, userAgent, currentPin) {
  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) throw new AppError('PIN must be exactly 4 digits.', 400);

  const db = getDb();
  const user = await db.prepare('SELECT transactionPin, hasTransactionPin FROM users WHERE id = ?').get(id);
  if (!user) throw new AppError('User not found.', 404);
  if (user.hasTransactionPin) {
    if (!currentPin) throw new AppError('Current PIN is required to change your transaction PIN.', 400);
    const match = await bcrypt.compare(currentPin, user.transactionPin);
    if (!match) throw new AppError('Current PIN is incorrect.', 401);
  }
  const hashedPin = await bcrypt.hash(pin, 10);
  const now = new Date().toISOString();
  await db.prepare('UPDATE users SET transactionPin = ?, hasTransactionPin = 1, updatedAt = ? WHERE id = ?')
    .run(hashedPin, now, id);

  logAction({ userId: id, action: 'TRANSACTION_PIN_SET', details: {}, ip, userAgent });
  logger.info({ userId: id }, 'Transaction PIN set');
  return { success: true };
}

export async function deleteAccount(id, password, ip, userAgent) {
  const db = getDb();
  const user = await db.prepare('SELECT id, password FROM users WHERE id = ?').get(id);
  if (!user) throw new AppError('User not found.', 404);
  if (!password) throw new AppError('Password is required to delete your account.', 400);
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError('Invalid password.', 401);
  logAction({ userId: id, action: 'ACCOUNT_DELETED', details: {}, ip, userAgent, severity: 'critical' });
  await db.prepare('DELETE FROM sessions WHERE userId = ?').run(id);
  await db.prepare('DELETE FROM refresh_tokens WHERE userId = ?').run(id);
  await db.prepare('DELETE FROM transactions WHERE userId = ?').run(id);
  try {
    const phoneRow = db.prepare('SELECT phone FROM users WHERE id = ?').get(id);
    if (phoneRow && phoneRow.phone) {
      await db.prepare('DELETE FROM otps WHERE phone = ?').run(phoneRow.phone);
    }
  } catch (err) {
    logger.error({ err: err.message, userId: id }, 'Failed to clean up OTPs during account deletion');
  }
  await db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return { success: true };
}
