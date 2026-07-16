import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import AppError from '../../utils/AppError.js';
import logger from '../../utils/logger.js';
import { getDb } from '../../utils/db.js';

export async function generateMfaSecret(id) {
  const { authenticator } = await import('otplib');
  const secret = authenticator.generateSecret();
  const db = getDb();
  await db.prepare('UPDATE users SET mfaSecret = ?, updatedAt = ? WHERE id = ?')
    .run(secret, new Date().toISOString(), id);
  const user = await db.prepare('SELECT email FROM users WHERE id = ?').get(id);
  const uri = authenticator.keyuri(user.email, 'BillXpress', secret);
  return { secret, uri };
}

export async function verifyMfaSetup(id, token) {
  const { authenticator } = await import('otplib');
  const db = getDb();
  const user = await db.prepare('SELECT mfaSecret FROM users WHERE id = ?').get(id);
  if (!user || !user.mfaSecret) throw new AppError('MFA not initialized. Generate a secret first.', 400);
  const isValid = authenticator.check(token, user.mfaSecret);
  if (!isValid) throw new AppError('Invalid verification code.', 400);
  const rawCodes = Array.from({ length: 8 }, () => {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 8);
    return { code };
  });
  const backupCodes = await Promise.all(rawCodes.map(async (item) => ({
    ...item, hash: await bcrypt.hash(item.code, 8), used: false,
  })));
  await db.prepare('UPDATE users SET mfaEnabled = 1, mfaBackupCodes = ?, updatedAt = ? WHERE id = ?')
    .run(JSON.stringify(backupCodes.map(({ hash, used }) => ({ hash, used }))), new Date().toISOString(), id);
  const plainCodes = backupCodes.map((bc) => bc.code);
  return { success: true, backupCodes: plainCodes };
}

export async function disableMfa(id, password, totpCode) {
  const db = getDb();
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) throw new AppError('User not found.', 404);
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError('Invalid password.', 401);
  if (user.mfaEnabled && totpCode) {
    const { authenticator } = await import('otplib');
    const valid = authenticator.check(totpCode, user.mfaSecret);
    if (!valid) throw new AppError('Invalid TOTP code.', 401);
  } else if (user.mfaEnabled && !totpCode) {
    throw new AppError('TOTP code is required to disable MFA.', 400);
  }
  await db.prepare('UPDATE users SET mfaSecret = NULL, mfaEnabled = 0, mfaBackupCodes = ?, updatedAt = ? WHERE id = ?')
    .run('[]', new Date().toISOString(), id);
  return { success: true };
}
