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

export function normalizePhone(phone) {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+234' + cleaned.slice(1);
  } else if (cleaned.startsWith('234') && !cleaned.startsWith('+234')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
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
    hasTransactionPin: Boolean(row.hastransactionpin ?? row.hasTransactionPin),
    bvn: row.bvn || '',
    accountNumber: row.accountnumber || row.accountNumber || '',
    bankName: row.bankname || row.bankName || '',
    accountName: row.accountname || row.accountName || '',
    billingStreet: row.billingstreet || row.billingStreet || '',
    billingCity: row.billingcity || row.billingCity || '',
    billingState: row.billingstate || row.billingState || '',
    billingCountry: row.billingcountry || row.billingCountry || '',
    homeStreet: row.homestreet || row.homeStreet || '',
    homeCity: row.homecity || row.homeCity || '',
    homeState: row.homestate || row.homeState || '',
    homeZip: row.homezip || row.homeZip || '',
    avatar: row.avatar || '',
    emailVerified: Boolean(row.emailverified ?? row.emailVerified),
    emailVerificationToken: row.emailverificationtoken ?? row.emailVerificationToken,
    emailVerificationExpires: row.emailverificationexpires ?? row.emailVerificationExpires,
    mfaSecret: row.mfasecret ?? row.mfaSecret,
    mfaEnabled: Boolean(row.mfaenabled ?? row.mfaEnabled),
    mfaBackupCodes: row.mfabackupcodes ? JSON.parse(row.mfabackupcodes) : (row.mfaBackupCodes ? JSON.parse(row.mfaBackupCodes) : []),
    createdAt: row.createdat ?? row.createdAt,
    updatedAt: row.updatedat ?? row.updatedAt,
    lastLogin: row.lastlogin ?? row.lastLogin,
    failedLoginAttempts: (row.failedloginattempts ?? row.failedLoginAttempts) ?? 0,
    lockedUntil: row.lockeduntil ?? row.lockedUntil,
    passwordHistory: row.passwordhistory ? JSON.parse(row.passwordhistory) : (row.passwordHistory ? JSON.parse(row.passwordHistory) : []),
    passwordChangedAt: row.passwordchangedat ?? row.passwordChangedAt,
    resetToken: row.resettoken ?? row.resetToken,
    resetTokenExpires: row.resettokenexpires ?? row.resetTokenExpires,
  };
}

async function getUserByEmailRaw(email) {
  const db = getDb();
  const row = await db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  return rowToUser(row);
}

function getLockoutDuration(attemptCount) {
  const base = LOCKOUT_MINUTES;
  const extraAttempts = attemptCount - MAX_ATTEMPTS;
  return extraAttempts > 0 ? base * Math.pow(2, extraAttempts) : base;
}

function lockoutKey(email, ip) {
  return `${email.toLowerCase()}:${ip || 'unknown'}`;
}

async function isAccountLocked(email, ip) {
  const db = getDb();
  const key = lockoutKey(email, ip);
  const record = await db.prepare('SELECT * FROM login_attempts WHERE key = ?').get(key);
  if (!record || record.count < MAX_ATTEMPTS) return false;
  if (new Date(record.lockedUntil) > new Date()) return true;
  await db.prepare('DELETE FROM login_attempts WHERE key = ?').run(key);
  return false;
}

const LOCKOUT_MULTI_IP_THRESHOLD = 3;

async function recordFailedAttempt(email, ip, userAgent) {
  const db = getDb();
  const emailKey = email.toLowerCase();
  const ipKey = lockoutKey(email, ip);
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO login_attempts (key, count, lastAttempt, lockedUntil, ips)
    VALUES (?, 1, ?, NULL, ?)
    ON CONFLICT(key) DO UPDATE SET
      count = login_attempts.count + 1,
      lastAttempt = EXCLUDED.lastAttempt,
      ips = (
        SELECT COALESCE(json_agg(DISTINCT elem)::text, ?)
        FROM (
          SELECT jsonb_array_elements_text(login_attempts.ips::jsonb) AS elem
          UNION
          SELECT jsonb_array_elements_text(EXCLUDED.ips::jsonb) AS elem
        ) AS combined
      )
  `).run(ipKey, now, JSON.stringify([ip || 'unknown']), JSON.stringify([ip || 'unknown']));
  await db.prepare(`
    INSERT INTO login_attempts (key, count, lastAttempt, lockedUntil, ips)
    VALUES (?, 1, ?, NULL, ?)
    ON CONFLICT(key) DO UPDATE SET
      count = login_attempts.count + 1,
      lastAttempt = EXCLUDED.lastAttempt,
      ips = (
        SELECT COALESCE(json_agg(DISTINCT elem)::text, ?)
        FROM (
          SELECT jsonb_array_elements_text(login_attempts.ips::jsonb) AS elem
          UNION
          SELECT jsonb_array_elements_text(EXCLUDED.ips::jsonb) AS elem
        ) AS combined
      )
  `).run(emailKey, now, JSON.stringify([ip || 'unknown']), JSON.stringify([ip || 'unknown']));

  const ipRecord = await db.prepare('SELECT * FROM login_attempts WHERE key = ?').get(ipKey);
  const emailRecord = await db.prepare('SELECT * FROM login_attempts WHERE key = ?').get(emailKey);

  logger.warn({ email: emailKey, attempts: ipRecord.count, ip }, 'Failed login attempt');

  if (ipRecord.count >= MAX_ATTEMPTS) {
    const lockoutMin = getLockoutDuration(ipRecord.count);
    const lockedUntil = new Date(Date.now() + lockoutMin * 60 * 1000).toISOString();
    await db.prepare('UPDATE login_attempts SET lockedUntil = ? WHERE key = ?').run(lockedUntil, ipKey);
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

async function clearFailedAttempts(email, ip) {
  const db = getDb();
  await db.prepare('DELETE FROM login_attempts WHERE key = ?').run(lockoutKey(email, ip));
}

export async function register({ email, password, phone, name, ip, userAgent }) {
  const db = getDb();
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    throw new AppError('Email already registered.', 409);
  }
  if (phone) {
    const normalized = normalizePhone(phone);
    const existingPhone = await db.prepare('SELECT id FROM users WHERE phone = ?').get(normalized);
    if (existingPhone) throw new AppError('Phone number already registered.', 409);
    const verifiedOtp = await db.prepare(
      'SELECT id FROM otps WHERE phone = ? AND verified = 1 AND usedAt > ?'
    ).get(normalized, new Date(Date.now() - 15 * 60 * 1000).toISOString());
    if (!verifiedOtp) {
      throw new AppError('Phone number not verified. Please complete OTP verification.', 400);
    }
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
  const verificationToken = randomToken(32);
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await db.prepare(`
    INSERT INTO users (id, email, password, name, phone, role, createdAt, emailVerified, emailVerificationToken, emailVerificationExpires, passwordChangedAt)
    VALUES (?, ?, ?, ?, ?, 'user', ?, 0, ?, ?, ?)
  `).run(id, email.toLowerCase(), hashedPassword, name || '', phone ? normalizePhone(phone) : '', now, verificationToken, verificationExpires, now);
  stubEmail(email.toLowerCase(), 'Verify Your Email', `Verification token: ${verificationToken}`);
  logAction({ userId: id, action: 'REGISTER', details: { email: email.toLowerCase(), phone: phone || '' }, ip, userAgent });
  logger.info({ userId: id }, 'User registered');
  return { id, email: email.toLowerCase(), role: 'user', emailVerified: false };
}

export async function authenticate(login, password, totpCode, ip, userAgent) {
  const isPhone = /^[\d\+\-\(\)\s]+$/.test(login) && login.replace(/[\s\-\(\)]/g, '').length >= 10;
  const identifier = isPhone ? normalizePhone(login) : login.toLowerCase();
  let user;
  if (isPhone) {
    const db = getDb();
    user = await db.prepare('SELECT * FROM users WHERE phone = ?').get(identifier);
  } else {
    user = await getUserByEmailRaw(identifier);
  }
  if (!user) {
    await new Promise((r) => setTimeout(r, 500));
    throw new AppError('Invalid email or password.', 401);
  }
  if (await isAccountLocked(identifier, ip)) {
    logAction({ userId: user.id, action: 'LOGIN_LOCKED', details: { email: identifier }, ip, userAgent, severity: 'high' });
    throw new AppError('Account temporarily locked. Try again later.', 423);
  }
  if (!user.emailVerified) {
    throw new AppError('Please verify your email before signing in.', 403);
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
  await clearFailedAttempts(identifier, ip);
  const db = getDb();
  const now = new Date().toISOString();
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
  await db.prepare(`
    UPDATE users SET password = ?, passwordChangedAt = ?, resetToken = NULL,
      resetTokenExpires = NULL, emailVerified = 1, passwordHistory = ?
    WHERE id = ?
  `).run(hashedPassword, now, JSON.stringify(passwordHistory), user.id);
  logAction({ userId: user.id, action: 'PASSWORD_RESET_COMPLETED', details: {}, ip, userAgent, severity: 'high' });
  logger.info({ userId: user.id }, 'Password reset completed');
  return { userId: user.id, message: 'Password updated.' };
}

export async function getUserById(id) {
  const db = getDb();
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    emailVerified: Boolean(user.emailverified ?? user.emailVerified),
    mfaEnabled: Boolean(user.mfaenabled ?? user.mfaEnabled),
    createdAt: user.createdat ?? user.createdAt,
    lastLogin: user.lastlogin ?? user.lastLogin,
    name: user.name || '',
    phone: user.phone || '',
    balance: user.balance ?? 0,
    hasTransactionPin: Boolean(user.hastransactionpin ?? user.hasTransactionPin),
    bvn: user.bvn || '',
    accountNumber: user.accountnumber || user.accountNumber || '',
    bankName: user.bankname || user.bankName || '',
    accountName: user.accountname || user.accountName || '',
    billingStreet: user.billingstreet || user.billingStreet || '',
    billingCity: user.billingcity || user.billingCity || '',
    billingState: user.billingstate || user.billingState || '',
    billingCountry: user.billingcountry || user.billingCountry || '',
    homeStreet: user.homestreet || user.homeStreet || '',
    homeCity: user.homecity || user.homeCity || '',
    homeState: user.homestate || user.homeState || '',
    homeZip: user.homezip || user.homeZip || '',
    avatar: user.avatar || '',
  };
}

export async function updateUserProfile(id, profileData, ip, userAgent) {
  const db = getDb();
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
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
    await db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }

  logAction({ userId: id, action: 'PROFILE_UPDATED', details: {}, ip, userAgent });
  logger.info({ userId: id }, 'User profile updated');
  return getUserById(id);
}

export async function changePassword(id, currentPassword, newPassword, ip, userAgent) {
  const db = getDb();
  const user = await db.prepare('SELECT id, password FROM users WHERE id = ?').get(id);
  if (!user) throw new AppError('User not found.', 404);

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) throw new AppError('Current password is incorrect.', 400);

  const complexityErrors = validatePasswordComplexity(newPassword);
  if (complexityErrors.length) throw new AppError(complexityErrors.join(' '), 400);

  const pwned = await checkHIBP(newPassword);
  if (pwned === true) throw new AppError('Password has been exposed in a data breach. Choose a different one.', 400);
  if (pwned === null) throw new AppError('Cannot verify password security. Please try again later.', 503);

  const passwordHistory = user.passwordHistory ? JSON.parse(user.passwordHistory) : [];
  for (const oldHash of passwordHistory) {
    if (await bcrypt.compare(newPassword, oldHash)) throw new AppError('Cannot reuse a recent password.', 400);
  }
  passwordHistory.push(user.password);
  if (passwordHistory.length > PASSWORD_POLICY.historySize) passwordHistory.shift();

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const now = new Date().toISOString();
  await db.prepare(`
    UPDATE users SET password = ?, passwordChangedAt = ?, passwordHistory = ?, updatedAt = ? WHERE id = ?
  `).run(hashedPassword, now, JSON.stringify(passwordHistory), now, id);

  logAction({ userId: id, action: 'PASSWORD_CHANGED', details: {}, ip, userAgent, severity: 'high' });
  logger.info({ userId: id }, 'Password changed');
  return { success: true };
}

export async function setTransactionPin(id, pin, ip, userAgent) {
  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) throw new AppError('PIN must be exactly 4 digits.', 400);

  const db = getDb();
  const hashedPin = await bcrypt.hash(pin, 10);
  const now = new Date().toISOString();
  await db.prepare('UPDATE users SET transactionPin = ?, hasTransactionPin = 1, updatedAt = ? WHERE id = ?')
    .run(hashedPin, now, id);

  logAction({ userId: id, action: 'TRANSACTION_PIN_SET', details: {}, ip, userAgent });
  logger.info({ userId: id }, 'Transaction PIN set');
  return { success: true };
}

export async function getUserByEmail(email) {
  return getUserByEmailRaw(email);
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

function stubEmail(to, subject, body) {
  logger.info({ emailTo: to, subject }, `[EMAIL STUB] ${body}`);
}

export async function checkPhone(phone) {
  const db = getDb();
  const normalized = normalizePhone(phone);
  const user = await db.prepare('SELECT id, email, name FROM users WHERE phone = ?').get(normalized);
  if (user) {
    return { exists: true, hasEmail: Boolean(user.email), email: user.email || undefined, name: user.name || undefined };
  }
  return { exists: false };
}

export async function sendOtp(phone) {
  const db = getDb();
  const normalized = normalizePhone(phone);
  await db.prepare('DELETE FROM otps WHERE phone = ? AND expiresAt < ?').run(normalized, new Date().toISOString());
  const recent = await db.prepare(
    'SELECT COUNT(*) as cnt FROM otps WHERE phone = ? AND createdAt > ?'
  ).get(normalized, new Date(Date.now() - 15 * 60 * 1000).toISOString());
  if (recent.cnt >= 3) {
    throw new AppError('Too many OTP requests. Please wait before trying again.', 429);
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await db.prepare('INSERT INTO otps (phone, code, expiresAt) VALUES (?, ?, ?)').run(normalized, code, expiresAt);
  stubSms(normalized, `Your BillXpress verification code is: ${code}. It expires in 10 minutes.`);
  logger.info({ phone: normalized }, 'OTP sent');
  return { message: 'OTP sent successfully', expiresIn: 600, code };
}

export async function verifyOtp(phone, code) {
  const db = getDb();
  const normalized = normalizePhone(phone);
  const now = new Date().toISOString();
  const otp = await db.prepare(
    'SELECT * FROM otps WHERE phone = ? AND code = ? AND verified = 0 AND expiresAt > ? ORDER BY id DESC LIMIT 1'
  ).get(normalized, code, now);
  if (!otp) {
    throw new AppError('Invalid or expired OTP.', 400);
  }
  await db.prepare('UPDATE otps SET verified = 1, usedAt = ? WHERE id = ?').run(now, otp.id);
  logger.info({ phone: normalized }, 'OTP verified');
  return { verified: true };
}

function stubSms(to, body) {
  logger.info({ smsTo: to }, `[SMS STUB] ${body}`);
}
