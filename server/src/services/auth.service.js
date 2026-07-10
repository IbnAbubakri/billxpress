import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';
import { logAction, securityAlert } from './audit.service.js';
import { getDb } from '../utils/db.js';
import randomToken from '../utils/randomToken.js';

const SALT_ROUNDS = 12;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

const PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,
  minUppercase: 1,
  minLowercase: 1,
  minNumbers: 1,
  minSpecialChars: 1,
  historySize: 5,
  expiryDays: 90,
};

export function getPasswordPolicy() {
  return {
    minLength: PASSWORD_POLICY.minLength,
    maxLength: PASSWORD_POLICY.maxLength,
    minUppercase: PASSWORD_POLICY.minUppercase,
    minLowercase: PASSWORD_POLICY.minLowercase,
    minNumbers: PASSWORD_POLICY.minNumbers,
    minSpecialChars: PASSWORD_POLICY.minSpecialChars,
  };
}

export function validatePasswordComplexity(password) {
  const errors = [];
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters.`);
  }
  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_POLICY.maxLength} characters.`);
  }
  const upper = (password.match(/[A-Z]/g) || []).length;
  const lower = (password.match(/[a-z]/g) || []).length;
  const nums = (password.match(/[0-9]/g) || []).length;
  const special = (password.match(/[^A-Za-z0-9]/g) || []).length;
  if (upper < PASSWORD_POLICY.minUppercase) errors.push(`Must include at least ${PASSWORD_POLICY.minUppercase} uppercase letter(s).`);
  if (lower < PASSWORD_POLICY.minLowercase) errors.push(`Must include at least ${PASSWORD_POLICY.minLowercase} lowercase letter(s).`);
  if (nums < PASSWORD_POLICY.minNumbers) errors.push(`Must include at least ${PASSWORD_POLICY.minNumbers} number(s).`);
  if (special < PASSWORD_POLICY.minSpecialChars) errors.push(`Must include at least ${PASSWORD_POLICY.minSpecialChars} special character(s).`);
  return errors;
}

const HIBP_TIMEOUT_MS = 5000;

async function checkHIBP(password) {
  const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'User-Agent': 'BillXpress/1.0' },
      signal: AbortSignal.timeout(HIBP_TIMEOUT_MS),
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, 'HIBP API returned non-OK status');
      return null;
    }
    const text = await res.text();
    const found = text.split('\n').some((line) => {
      const [hashSuffix] = line.split(':');
      return hashSuffix === suffix;
    });
    if (found) logger.warn({ hashPrefix: prefix }, 'Password matches known data breach');
    return found;
  } catch (err) {
    logger.warn({ err: err.message }, 'HIBP API unreachable');
    return null;
  }
}

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    role: row.role,
    name: row.name || '',
    phone: row.phone || '',
    balance: row.balance ?? 0,
    hasTransactionPin: Boolean(row.hasTransactionPin),
    bvn: row.bvn || '',
    accountNumber: row.accountNumber || '',
    bankName: row.bankName || '',
    accountName: row.accountName || '',
    billingStreet: row.billingStreet || '',
    billingCity: row.billingCity || '',
    billingState: row.billingState || '',
    billingCountry: row.billingCountry || '',
    homeStreet: row.homeStreet || '',
    homeCity: row.homeCity || '',
    homeState: row.homeState || '',
    homeZip: row.homeZip || '',
    avatar: row.avatar || '',
    emailVerified: Boolean(row.emailVerified),
    emailVerificationToken: row.emailVerificationToken,
    emailVerificationExpires: row.emailVerificationExpires,
    mfaSecret: row.mfaSecret,
    mfaEnabled: Boolean(row.mfaEnabled),
    mfaBackupCodes: row.mfaBackupCodes ? JSON.parse(row.mfaBackupCodes) : [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastLogin: row.lastLogin,
    failedLoginAttempts: row.failedLoginAttempts ?? 0,
    lockedUntil: row.lockedUntil,
    passwordHistory: row.passwordHistory ? JSON.parse(row.passwordHistory) : [],
    passwordChangedAt: row.passwordChangedAt,
    resetToken: row.resetToken,
    resetTokenExpires: row.resetTokenExpires,
  };
}

function getUserByEmailRaw(email) {
  const db = getDb();
  return rowToUser(db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()));
}

function getLockoutDuration(attemptCount) {
  const base = LOCKOUT_MINUTES;
  const extraAttempts = attemptCount - MAX_ATTEMPTS;
  return extraAttempts > 0 ? base * Math.pow(2, extraAttempts) : base;
}

function lockoutKey(email, ip) {
  return `${email.toLowerCase()}:${ip || 'unknown'}`;
}

function isAccountLocked(email, ip) {
  const db = getDb();
  const key = lockoutKey(email, ip);
  const record = db.prepare('SELECT * FROM login_attempts WHERE key = ?').get(key);
  if (!record || record.count < MAX_ATTEMPTS) return false;
  if (new Date(record.lockedUntil) > new Date()) return true;
  db.prepare('DELETE FROM login_attempts WHERE key = ?').run(key);
  return false;
}

const LOCKOUT_MULTI_IP_THRESHOLD = 3;

function recordFailedAttempt(email, ip, userAgent) {
  const db = getDb();
  const emailKey = email.toLowerCase();
  const ipKey = lockoutKey(email, ip);
  const now = new Date().toISOString();

  const upsert = db.prepare(`
    INSERT INTO login_attempts (key, count, lastAttempt, lockedUntil, ips)
    VALUES (?, 1, ?, NULL, ?)
    ON CONFLICT(key) DO UPDATE SET
      count = count + 1,
      lastAttempt = excluded.lastAttempt,
      ips = CASE
        WHEN json_valid(login_attempts.ips) AND json_valid(excluded.ips)
        THEN (
          SELECT json_group_array(DISTINCT value)
          FROM (
            SELECT value FROM json_each(login_attempts.ips)
            UNION
            SELECT value FROM json_each(excluded.ips)
          )
        )
        ELSE excluded.ips
      END
  `);

  upsert.run(ipKey, now, JSON.stringify([ip || 'unknown']));
  upsert.run(emailKey, now, JSON.stringify([ip || 'unknown']));

  const ipRecord = db.prepare('SELECT * FROM login_attempts WHERE key = ?').get(ipKey);
  const emailRecord = db.prepare('SELECT * FROM login_attempts WHERE key = ?').get(emailKey);

  logger.warn({ email: emailKey, attempts: ipRecord.count, ip }, 'Failed login attempt');

  if (ipRecord.count >= MAX_ATTEMPTS) {
    const lockoutMin = getLockoutDuration(ipRecord.count);
    const lockedUntil = new Date(Date.now() + lockoutMin * 60 * 1000).toISOString();
    db.prepare('UPDATE login_attempts SET lockedUntil = ? WHERE key = ?').run(lockedUntil, ipKey);
    logger.warn({ email: emailKey, attempts: ipRecord.count, lockoutMin, ip }, 'Account locked due to failed attempts');
    securityAlert({
      type: 'ACCOUNT_LOCKED',
      email: emailKey,
      details: `Account locked for ${lockoutMin} minutes after ${ipRecord.count} failed attempts from ${ip}`,
      ip,
    });
  }

  const ips = emailRecord.ips ? JSON.parse(emailRecord.ips) : [];
  if (ips.length >= LOCKOUT_MULTI_IP_THRESHOLD) {
    securityAlert({
      type: 'MULTI_IP_FAILED_LOGINS',
      email: emailKey,
      details: `Failed logins from ${ips.length} different IPs: ${ips.join(', ')}`,
      ip,
    });
  }
}

function clearFailedAttempts(email, ip) {
  const db = getDb();
  db.prepare('DELETE FROM login_attempts WHERE key = ?').run(lockoutKey(email, ip));
}

export async function register({ email, password, ip, userAgent }) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    throw new AppError('Email already registered.', 409);
  }
  const complexityErrors = validatePasswordComplexity(password);
  if (complexityErrors.length) {
    throw new AppError(complexityErrors.join(' '), 400);
  }
  const pwned = await checkHIBP(password);
  if (pwned === true) {
    logAction({ userId: null, action: 'REGISTER_BREACHED_PASSWORD', details: { email: email.toLowerCase() }, ip, userAgent, severity: 'high' });
    throw new AppError('Password has been exposed in a data breach. Choose a different one.', 400);
  }
  if (pwned === null) {
    throw new AppError('Cannot verify password security. Please try again later.', 503);
  }
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO users (id, email, password, role, createdAt, emailVerified, passwordChangedAt)
    VALUES (?, ?, ?, 'user', ?, 0, ?)
  `).run(id, email.toLowerCase(), hashedPassword, now, now);
  logAction({ userId: id, action: 'REGISTER', details: { email: email.toLowerCase() }, ip, userAgent });
  logger.info({ userId: id }, 'User registered');
  return { id, email: email.toLowerCase(), role: 'user', emailVerified: false };
}

export async function authenticate(email, password, totpCode, ip, userAgent) {
  const user = getUserByEmailRaw(email);
  if (!user) {
    await new Promise((r) => setTimeout(r, 500));
    throw new AppError('Invalid email or password.', 401);
  }
  if (isAccountLocked(email, ip)) {
    logAction({ userId: user.id, action: 'LOGIN_LOCKED', details: { email: email.toLowerCase() }, ip, userAgent, severity: 'high' });
    throw new AppError('Account temporarily locked. Try again later.', 423);
  }
  if (!user.emailVerified) {
    throw new AppError('Please verify your email before signing in.', 403);
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    recordFailedAttempt(email, ip, userAgent);
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
      const codeHash = crypto.createHash('sha256').update(totpCode).digest('hex');
      const idx = codes.findIndex((bc) => bc.hash === codeHash && !bc.used);
      if (idx === -1) {
        logAction({ userId: user.id, action: 'MFA_FAILED', details: { email: email.toLowerCase() }, ip, userAgent, severity: 'high' });
        throw new AppError('Invalid two-factor code.', 401);
      }
      codes[idx].used = true;
      const db = getDb();
      db.prepare('UPDATE users SET mfaBackupCodes = ? WHERE id = ?').run(JSON.stringify(codes), user.id);
      logAction({ userId: user.id, action: 'MFA_BACKUP_CODE_USED', details: {}, ip, userAgent, severity: 'high' });
    }
  }
  clearFailedAttempts(email, ip);
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare('UPDATE users SET lastLogin = ?, failedLoginAttempts = 0, lockedUntil = NULL WHERE id = ?').run(now, user.id);
  logAction({ userId: user.id, action: 'LOGIN', details: { email: user.email }, ip, userAgent });
  logger.info({ userId: user.id }, 'User authenticated');
  return { id: user.id, email: user.email, role: user.role };
}

export async function forgotPassword(email, ip, userAgent) {
  const user = getUserByEmailRaw(email);
  if (!user) return { message: 'If that email exists, a reset link has been sent.' };
  const resetToken = randomToken(32);
  const db = getDb();
  db.prepare('UPDATE users SET resetToken = ?, resetTokenExpires = ? WHERE id = ?')
    .run(resetToken, new Date(Date.now() + 15 * 60 * 1000).toISOString(), user.id);
  logAction({ userId: user.id, action: 'PASSWORD_RESET_REQUESTED', details: { email: user.email }, ip, userAgent, severity: 'high' });
  stubEmail(email, 'Password Reset', `Reset token: ${resetToken}`);
  logger.info({ userId: user.id }, 'Password reset requested');
  return { message: 'If that email exists, a reset link has been sent.' };
}

export async function resetPassword(token, newPassword, ip, userAgent) {
  const complexityErrors = validatePasswordComplexity(newPassword);
  if (complexityErrors.length) {
    throw new AppError(complexityErrors.join(' '), 400);
  }
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE resetToken = ?').get(token);
  if (!user || new Date(user.resetTokenExpires) < new Date()) {
    throw new AppError('Invalid or expired reset token.', 400);
  }
  const pwned = await checkHIBP(newPassword);
  if (pwned === true) {
    logAction({ userId: user.id, action: 'RESET_BREACHED_PASSWORD', details: {}, ip, userAgent, severity: 'high' });
    throw new AppError('Password has been exposed in a data breach. Choose a different one.', 400);
  }
  if (pwned === null) {
    throw new AppError('Cannot verify password security. Please try again later.', 503);
  }
  const passwordHistory = user.passwordHistory ? JSON.parse(user.passwordHistory) : [];
  for (const oldHash of passwordHistory) {
    if (await bcrypt.compare(newPassword, oldHash)) {
      throw new AppError('Cannot reuse a recent password.', 400);
    }
  }
  passwordHistory.push(user.password);
  if (passwordHistory.length > PASSWORD_POLICY.historySize) {
    passwordHistory.shift();
  }
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE users SET password = ?, passwordChangedAt = ?, resetToken = NULL,
      resetTokenExpires = NULL, emailVerified = 1, passwordHistory = ?
    WHERE id = ?
  `).run(hashedPassword, now, JSON.stringify(passwordHistory), user.id);
  logAction({ userId: user.id, action: 'PASSWORD_RESET_COMPLETED', details: {}, ip, userAgent, severity: 'high' });
  logger.info({ userId: user.id }, 'Password reset completed');
  return { userId: user.id, message: 'Password updated.' };
}

export function getUserById(id) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    emailVerified: Boolean(user.emailVerified),
    mfaEnabled: Boolean(user.mfaEnabled),
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
    name: user.name || '',
    phone: user.phone || '',
    balance: user.balance ?? 0,
    hasTransactionPin: Boolean(user.hasTransactionPin),
    bvn: user.bvn || '',
    accountNumber: user.accountNumber || '',
    bankName: user.bankName || '',
    accountName: user.accountName || '',
    billingStreet: user.billingStreet || '',
    billingCity: user.billingCity || '',
    billingState: user.billingState || '',
    billingCountry: user.billingCountry || '',
    homeStreet: user.homeStreet || '',
    homeCity: user.homeCity || '',
    homeState: user.homeState || '',
    homeZip: user.homeZip || '',
    avatar: user.avatar || '',
  };
}

export function updateUserProfile(id, profileData, ip, userAgent) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) throw new AppError('User not found.', 404);

  const allowedFields = [
    'name', 'phone', 'bvn', 'accountNumber', 'bankName', 'accountName',
    'billingStreet', 'billingCity', 'billingState', 'billingCountry',
    'homeStreet', 'homeCity', 'homeState', 'homeZip', 'avatar',
  ];

  const updates = [];
  const values = [];
  for (const field of allowedFields) {
    if (profileData[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(profileData[field]);
    }
  }

  if (updates.length > 0) {
    updates.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }

  logAction({ userId: id, action: 'PROFILE_UPDATED', details: {}, ip, userAgent });
  logger.info({ userId: id }, 'User profile updated');
  return getUserById(id);
}

export function getUserByEmail(email) {
  return getUserByEmailRaw(email);
}

export function generateVerificationToken(user) {
  const db = getDb();
  const found = db.prepare('SELECT id FROM users WHERE id = ?').get(user.id);
  if (!found) throw new AppError('User not found.', 404);
  const token = randomToken(32);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  db.prepare('UPDATE users SET emailVerificationToken = ?, emailVerificationExpires = ? WHERE id = ?')
    .run(token, expires, user.id);
  return token;
}

export function verifyEmailToken(token) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE emailVerificationToken = ?').get(token);
  if (!user || new Date(user.emailVerificationExpires) < new Date()) {
    throw new AppError('Invalid or expired verification token.', 400);
  }
  db.prepare('UPDATE users SET emailVerified = 1, emailVerificationToken = NULL, emailVerificationExpires = NULL WHERE id = ?')
    .run(user.id);
  return { id: user.id, email: user.email };
}

function stubEmail(to, subject, body) {
  logger.info({ emailTo: to, subject }, `[EMAIL STUB] ${body}`);
}
