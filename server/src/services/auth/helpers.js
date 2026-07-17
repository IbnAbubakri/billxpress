import { getDb } from '../../utils/db.js';
import logger from '../../utils/logger.js';
import { logAction, securityAlert } from '../audit.service.js';

export const SALT_ROUNDS = 12;
export const MAX_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;

export function normalizePhone(phone) {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+234' + cleaned.slice(1);
  } else if (cleaned.startsWith('234') && !cleaned.startsWith('+234')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

export function sanitizeValue(val) {
  if (typeof val !== 'string') return val;
  return val.trim();
}

export function sanitizeUser(full) {
  if (!full) return null;
  return {
    id: full.id, email: full.email, role: full.role, name: full.name, phone: full.phone,
    avatar: full.avatar, balance: full.balance, hasTransactionPin: full.hasTransactionPin,
    emailVerified: full.emailVerified, mfaEnabled: full.mfaEnabled,
    createdAt: full.createdAt, lastLogin: full.lastLogin,
    accountNumber: full.accountNumber, bankName: full.bankName, accountName: full.accountName,
  };
}

export function rowToUser(row) {
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
    dateOfBirth: row.dateofbirth || row.dateOfBirth || '',
    gender: row.gender || '',
    nin: row.nin || '',
    nextOfKin: (() => { try { return JSON.parse(row.nextofkin || row.nextOfKin || '{}'); } catch { logger.warn('Failed to parse nextOfKin'); return {}; } })(),
    employmentStatus: row.employmentstatus || row.employmentStatus || '',
    annualIncome: row.annualincome || row.annualIncome || '',
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

export function lockoutKey(email) {
  return email.toLowerCase();
}

export function getLockoutDuration(attemptCount) {
  const base = LOCKOUT_MINUTES;
  const extraAttempts = attemptCount - MAX_ATTEMPTS;
  return extraAttempts > 0 ? base * Math.pow(2, extraAttempts) : base;
}

export async function getUserByEmailRaw(email) {
  const db = getDb();
  const row = await db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  return rowToUser(row);
}

export async function isAccountLocked(email) {
  const db = getDb();
  const key = lockoutKey(email);
  const record = await db.prepare('SELECT * FROM login_attempts WHERE key = ?').get(key);
  if (!record || record.count < MAX_ATTEMPTS) return false;
  if (new Date(record.lockedUntil) > new Date()) return true;
  await db.prepare('DELETE FROM login_attempts WHERE key = ?').run(key);
  return false;
}

export async function recordFailedAttempt(email, ip, userAgent) {
  const db = getDb();
  const key = lockoutKey(email);
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
  `).run(key, now, JSON.stringify([ip || 'unknown']), JSON.stringify([ip || 'unknown']));

  const record = await db.prepare('SELECT * FROM login_attempts WHERE key = ?').get(key);

  logger.warn({ email: key, attempts: record.count, ip }, 'Failed login attempt');

  if (record.count >= MAX_ATTEMPTS) {
    const lockoutMin = getLockoutDuration(record.count);
    const lockedUntil = new Date(Date.now() + lockoutMin * 60 * 1000).toISOString();
    await db.prepare('UPDATE login_attempts SET lockedUntil = ? WHERE key = ?').run(lockedUntil, key);
    logger.warn({ email: key, attempts: record.count, lockoutMin, ip }, 'Account locked due to failed attempts');
    logAction({ userId: null, action: 'ACCOUNT_LOCKED', details: { email: key, attempts: record.count, lockoutMin, ip }, ip, userAgent, severity: 'critical' });
    securityAlert({
      type: 'ACCOUNT_LOCKED',
      email: key,
      details: `Account locked for ${lockoutMin} minutes after ${record.count} failed attempts from ${ip}`,
      ip,
    });
  }
}

export async function clearFailedAttempts(email) {
  const db = getDb();
  await db.prepare('DELETE FROM login_attempts WHERE key = ?').run(lockoutKey(email));
}
