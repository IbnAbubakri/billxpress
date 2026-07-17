import bcrypt from 'bcryptjs';
import AppError from '../../utils/AppError.js';
import logger from '../../utils/logger.js';
import { logAction } from '../audit.service.js';
import { getDb } from '../../utils/db.js';
import randomToken from '../../utils/randomToken.js';
import { rowToUser, sanitizeValue, sanitizeUser, normalizePhone } from './helpers.js';

export { sanitizeUser };

export async function getUserById(id) {
  const db = getDb();
  const row = await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!row) return null;
  const user = rowToUser(row);
  const { password, emailVerificationToken, emailVerificationExpires, mfaSecret, mfaBackupCodes, resetToken, resetTokenExpires, passwordHistory, passwordChangedAt, failedLoginAttempts, lockedUntil, ...safe } = user;
  return safe;
}

export async function getUserByEmail(email) {
  return getUserByEmailRaw(email);
}

export async function updateUserProfile(id, profileData, ip, userAgent) {
  const db = getDb();
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) throw new AppError('User not found.', 404);

  if (profileData.email !== undefined && profileData.email !== user.email) {
    if (!profileData.currentPassword) throw new AppError('Current password is required to change email.', 400);
    const pwMatch = await bcrypt.compare(profileData.currentPassword, user.password);
    if (!pwMatch) throw new AppError('Current password is incorrect.', 401);
    const existing = await db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(profileData.email.toLowerCase(), id);
    if (existing) throw new AppError('Email is already in use.', 409);
  }

  const allowedFields = [
    'name', 'phone', 'bvn', 'accountNumber', 'bankName', 'accountName',
    'billingStreet', 'billingCity', 'billingState', 'billingCountry',
    'homeStreet', 'homeCity', 'homeState', 'homeZip', 'avatar',
    'email', 'dateOfBirth', 'gender', 'nin', 'nextOfKin', 'employmentStatus', 'annualIncome',
  ];

  const updates = [];
  const values = [];
  for (const field of allowedFields) {
    if (profileData[field] !== undefined) {
      if (!/^[a-zA-Z]+$/.test(field)) continue;
      updates.push(`${field} = ?`);
      values.push(sanitizeValue(profileData[field]));
    }
  }

  if (updates.length > 0) {
    updates.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);
    await db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }

  logAction({ userId: id, action: 'PROFILE_UPDATED', details: {}, ip, userAgent });
  logger.info({ userId: id }, 'User profile updated');
  return getUserById(id);
}

export async function lookupUserForVerification(identifier, userId) {
  const db = getDb();
  let user = null;
  if (identifier) {
    user = await db.prepare('SELECT * FROM users WHERE email = ?').get(identifier.toLowerCase());
    if (!user) {
      user = await db.prepare('SELECT * FROM users WHERE phone = ?').get(normalizePhone(identifier));
    }
  }
  if (!user && userId) {
    user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  }
  return user;
}

export async function generateVerificationToken(user) {
  const db = getDb();
  const found = await db.prepare('SELECT id FROM users WHERE id = ?').get(user.id);
  if (!found) throw new AppError('User not found.', 404);
  const token = randomToken(32);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await db.prepare('UPDATE users SET emailVerificationToken = ?, emailVerificationExpires = ? WHERE id = ?')
    .run(token, expires, user.id);
  return token;
}

export async function verifyEmailToken(token) {
  const db = getDb();
  const user = await db.prepare('SELECT * FROM users WHERE emailVerificationToken = ?').get(token);
  if (!user || new Date(user.emailVerificationExpires) < new Date()) {
    throw new AppError('Invalid or expired verification token.', 400);
  }
  await db.prepare('UPDATE users SET emailVerified = 1, emailVerificationToken = NULL, emailVerificationExpires = NULL WHERE id = ?')
    .run(user.id);
  return { id: user.id, email: user.email };
}


