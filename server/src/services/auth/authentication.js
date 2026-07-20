import bcrypt from 'bcryptjs';
import AppError from '../../utils/AppError.js';
import logger from '../../utils/logger.js';
import { logAction } from '../audit.service.js';
import { getDb } from '../../utils/db.js';
import randomToken from '../../utils/randomToken.js';
import env from '../../config/env.js';
import {
  normalizePhone, getUserByEmailRaw, rowToUser,
  isAccountLocked, recordFailedAttempt, clearFailedAttempts,
  SALT_ROUNDS,
} from './helpers.js';
import { validatePasswordComplexity, checkHIBP, PASSWORD_POLICY } from './password.js';

export { PASSWORD_POLICY };

export async function authenticate(login, password, totpCode, ip, userAgent) {
  const isPhone = /^[\d\+\-\(\)\s]+$/.test(login) && login.replace(/[\s\-\(\)]/g, '').length >= 10;
  const identifier = isPhone ? normalizePhone(login) : login.toLowerCase();
  let user;
  if (isPhone) {
    const db = getDb();
    let row = await db.prepare('SELECT * FROM users WHERE phone = ?').get(identifier);
    if (!row) {
      row = await db.prepare('SELECT * FROM users WHERE phone = ?').get(login.trim());
    }
    user = rowToUser(row);
  } else {
    user = await getUserByEmailRaw(identifier);
  }
  if (!user) {
    await new Promise((r) => setTimeout(r, 500));
    throw new AppError('Invalid email or password.', 401);
  }
  if (await isAccountLocked(identifier)) {
    logAction({ userId: user.id, action: 'LOGIN_LOCKED', details: { email: identifier }, ip, userAgent, severity: 'high' });
    throw new AppError('Invalid credentials.', 401);
  }
  const isDemo = env.DEMO_MODE;
  if (!user.emailVerified && !isDemo) {
    throw new AppError('Invalid credentials.', 401);
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    await recordFailedAttempt(identifier, ip, userAgent);
    throw new AppError('Invalid email or password.', 401);
  }
  if (user.mfaEnabled) {
    if (!totpCode) {
      return { mfaRequired: true, tempEmail: user.email };
    }
    const { authenticator } = await import('otplib');
    const isValid = authenticator.check(totpCode, user.mfaSecret);
    if (!isValid) {
      const codes = user.mfaBackupCodes || [];
      let matched = false;
      for (const bc of codes) {
        if (!bc.used && await bcrypt.compare(totpCode, bc.hash)) {
          bc.used = true;
          const db = getDb();
          await db.prepare('UPDATE users SET mfaBackupCodes = ? WHERE id = ?').run(JSON.stringify(codes), user.id);
          logAction({ userId: user.id, action: 'MFA_BACKUP_CODE_USED', details: {}, ip, userAgent, severity: 'high' });
          matched = true;
          break;
        }
      }
      if (!matched) {
        logAction({ userId: user.id, action: 'MFA_FAILED', details: { email: identifier }, ip, userAgent, severity: 'high' });
        throw new AppError('Invalid two-factor code.', 401);
      }
    }
  }
  await clearFailedAttempts(identifier);
  const db = getDb();
  const now = new Date().toISOString();

  if (user.passwordChangedAt) {
    const changed = new Date(user.passwordChangedAt).getTime();
    const elapsed = Date.now() - changed;
    if (elapsed > PASSWORD_POLICY.expiryDays * 24 * 60 * 60 * 1000) {
      throw new AppError('Your password has expired. Please reset it.', 403);
    }
  }

  await db.prepare('UPDATE users SET lastLogin = ?, failedLoginAttempts = 0, lockedUntil = NULL WHERE id = ?').run(now, user.id);
  logAction({ userId: user.id, action: 'LOGIN', details: { email: user.email }, ip, userAgent });
  logger.info({ userId: user.id }, 'User authenticated');
  return { id: user.id, email: user.email, role: user.role };
}

export async function forgotPassword(email, ip, userAgent) {
  const user = await getUserByEmailRaw(email);
  if (!user) return { message: 'If that email exists, a reset link has been sent.' };
  const resetToken = randomToken(32);
  const db = getDb();
  await db.prepare('UPDATE users SET resetToken = ?, resetTokenExpires = ? WHERE id = ?')
    .run(resetToken, new Date(Date.now() + 15 * 60 * 1000).toISOString(), user.id);
  logAction({ userId: user.id, action: 'PASSWORD_RESET_REQUESTED', details: { email: user.email }, ip, userAgent, severity: 'high' });
  stubEmailReset(email, resetToken);
  logger.info({ userId: user.id }, 'Password reset requested');
  return { message: 'If that email exists, a reset link has been sent.' };
}

export async function resetPassword(token, newPassword, ip, userAgent) {
  const complexityErrors = validatePasswordComplexity(newPassword);
  if (complexityErrors.length) {
    throw new AppError(complexityErrors.join(' '), 400);
  }
  const db = getDb();
  const user = await db.prepare('SELECT * FROM users WHERE resetToken = ?').get(token);
  if (!user || new Date(user.resetTokenExpires) < new Date()) {
    throw new AppError('Invalid or expired reset token.', 400);
  }
  const pwned = await checkHIBP(newPassword);
  if (pwned === true) {
    logAction({ userId: user.id, action: 'RESET_BREACHED_PASSWORD', details: {}, ip, userAgent, severity: 'high' });
    throw new AppError('Password has been exposed in a data breach. Choose a different one.', 400);
  }
  if (pwned === null) {
    logger.warn({ userId: user.id }, 'HIBP check failed during password reset, allowing');
  }
  if (await bcrypt.compare(newPassword, user.password)) {
    throw new AppError('Cannot reuse your current password.', 400);
  }
  const passwordHistory = user.passwordHistory ? JSON.parse(user.passwordHistory) : [];
  const reuse = await Promise.all(passwordHistory.map((h) => bcrypt.compare(newPassword, h)));
  if (reuse.some(Boolean)) {
    throw new AppError('Cannot reuse a recent password.', 400);
  }
  passwordHistory.push(user.password);
  if (passwordHistory.length > PASSWORD_POLICY.historySize) {
    passwordHistory.shift();
  }
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const now = new Date().toISOString();
  await db.prepare(`
    UPDATE users SET password = ?, passwordChangedAt = ?, resetToken = NULL,
      resetTokenExpires = ?, passwordHistory = ?
    WHERE id = ?
  `).run(hashedPassword, now, now, JSON.stringify(passwordHistory), user.id);
  await clearFailedAttempts(user.email);
  logAction({ userId: user.id, action: 'PASSWORD_RESET_COMPLETED', details: {}, ip, userAgent, severity: 'high' });
  logger.info({ userId: user.id }, 'Password reset completed');
  return { userId: user.id, message: 'Password updated.' };
}

export async function changePassword(id, currentPassword, newPassword, ip, userAgent) {
  const db = getDb();
  const user = await db.prepare('SELECT id, password, passwordHistory FROM users WHERE id = ?').get(id);
  if (!user) throw new AppError('User not found.', 404);

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) throw new AppError('Current password is incorrect.', 400);

  if (await bcrypt.compare(newPassword, user.password)) {
    throw new AppError('Cannot reuse your current password.', 400);
  }

  const complexityErrors = validatePasswordComplexity(newPassword);
  if (complexityErrors.length) throw new AppError(complexityErrors.join(' '), 400);

  const pwned = await checkHIBP(newPassword);
  if (pwned === true) throw new AppError('Password has been exposed in a data breach. Choose a different one.', 400);
  if (pwned === null) {
    logger.warn({ userId: id }, 'HIBP check failed during password change, allowing');
  }

  const passwordHistory = user.passwordHistory ? JSON.parse(user.passwordHistory) : [];
  const reuse = await Promise.all(passwordHistory.map((h) => bcrypt.compare(newPassword, h)));
  if (reuse.some(Boolean)) throw new AppError('Cannot reuse a recent password.', 400);
  passwordHistory.push(user.password);
  if (passwordHistory.length > PASSWORD_POLICY.historySize) passwordHistory.shift();

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const now = new Date().toISOString();
  await db.prepare(`
    UPDATE users SET password = ?, passwordChangedAt = ?, passwordHistory = ?, updatedAt = ? WHERE id = ?
  `).run(hashedPassword, now, JSON.stringify(passwordHistory), now, id);

  logAction({ userId: id, action: 'PASSWORD_CHANGED', details: {}, ip, userAgent, severity: 'high' });
  logger.info({ userId: id }, 'Password changed');
  const userEmail = await db.prepare('SELECT email FROM users WHERE id = ?').get(id);
  if (userEmail) {
    stubEmail(userEmail.email, 'Your password was changed', 'Your BillXpress account password was changed successfully. If you did not make this change, please contact support immediately.');
  }
  return { success: true };
}

function stubEmail(email, subject, body) {
  logger.info({ emailTo: email, subject }, `[EMAIL STUB] ${body}`);
}

function stubEmailReset(email, resetToken) {
  stubEmail(email, 'Password Reset', `Password reset token: ${resetToken}`);
}
