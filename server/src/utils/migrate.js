import { resolve, dirname } from 'path';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import logger from './logger.js';
import { getDb } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../data');

function readJSON(filename) {
  const path = resolve(DATA_DIR, filename);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch (err) {
    logger.warn({ filename, err: err.message }, 'Failed to parse JSON file');
    return null;
  }
}

export function migrateFromJSON() {
  const db = getDb();

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    logger.info('Database already has data, skipping migration');
    return;
  }

  const users = readJSON('users.json');
  if (users && users.length > 0) {
    const insert = db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password, role, name, phone, balance,
        hasTransactionPin, bvn, accountNumber, bankName, accountName,
        billingStreet, billingCity, billingState, billingCountry,
        homeStreet, homeCity, homeState, homeZip, avatar,
        emailVerified, emailVerificationToken, emailVerificationExpires,
        mfaSecret, mfaEnabled, mfaBackupCodes,
        createdAt, lastLogin, failedLoginAttempts, lockedUntil,
        passwordHistory, passwordChangedAt, resetToken, resetTokenExpires)
      VALUES (@id, @email, @password, @role, @name, @phone, @balance,
        @hasTransactionPin, @bvn, @accountNumber, @bankName, @accountName,
        @billingStreet, @billingCity, @billingState, @billingCountry,
        @homeStreet, @homeCity, @homeState, @homeZip, @avatar,
        @emailVerified, @emailVerificationToken, @emailVerificationExpires,
        @mfaSecret, @mfaEnabled, @mfaBackupCodes,
        @createdAt, @lastLogin, @failedLoginAttempts, @lockedUntil,
        @passwordHistory, @passwordChangedAt, @resetToken, @resetTokenExpires)
    `);

    const tx = db.transaction(() => {
      for (const u of users) {
        insert.run({
          id: u.id,
          email: u.email,
          password: u.password,
          role: u.role || 'user',
          name: u.name || '',
          phone: u.phone || '',
          balance: u.balance ?? 0,
          hasTransactionPin: u.hasTransactionPin ? 1 : 0,
          bvn: u.bvn || '',
          accountNumber: u.accountNumber || '',
          bankName: u.bankName || '',
          accountName: u.accountName || '',
          billingStreet: u.billingStreet || '',
          billingCity: u.billingCity || '',
          billingState: u.billingState || '',
          billingCountry: u.billingCountry || '',
          homeStreet: u.homeStreet || '',
          homeCity: u.homeCity || '',
          homeState: u.homeState || '',
          homeZip: u.homeZip || '',
          avatar: u.avatar || '',
          emailVerified: u.emailVerified ? 1 : 0,
          emailVerificationToken: u.emailVerificationToken || null,
          emailVerificationExpires: u.emailVerificationExpires || null,
          mfaSecret: u.mfaSecret || null,
          mfaEnabled: u.mfaEnabled ? 1 : 0,
          mfaBackupCodes: JSON.stringify(u.mfaBackupCodes || []),
          createdAt: u.createdAt || new Date().toISOString(),
          lastLogin: u.lastLogin || null,
          failedLoginAttempts: u.failedLoginAttempts ?? 0,
          lockedUntil: u.lockedUntil || null,
          passwordHistory: JSON.stringify(u.passwordHistory || []),
          passwordChangedAt: u.passwordChangedAt || null,
          resetToken: u.resetToken || null,
          resetTokenExpires: u.resetTokenExpires || null,
        });
      }
    });
    tx();
    logger.info({ count: users.length }, 'Migrated users from JSON');
  }

  const existingUserIds = new Set(
    db.prepare('SELECT id FROM users').all().map(r => r.id)
  );

  const refreshTokens = readJSON('refresh-tokens.json');
  if (refreshTokens && refreshTokens.length > 0) {
    const valid = refreshTokens.filter(rt => existingUserIds.has(rt.userId));
    if (valid.length > 0) {
      const insert = db.prepare(`
        INSERT OR IGNORE INTO refresh_tokens (token, userId, expiresAt)
        VALUES (@token, @userId, @expiresAt)
      `);
      const tx = db.transaction(() => {
        for (const rt of valid) insert.run(rt);
      });
      tx();
    }
    logger.info({ total: refreshTokens.length, migrated: valid.length }, 'Migrated refresh tokens from JSON');
  }

  const sessions = readJSON('sessions.json');
  if (sessions && sessions.length > 0) {
    const valid = sessions.filter(s => existingUserIds.has(s.userId));
    if (valid.length > 0) {
      const insert = db.prepare(`
        INSERT OR IGNORE INTO sessions (id, userId, createdAt, lastActivity, ip, userAgent)
        VALUES (@id, @userId, @createdAt, @lastActivity, @ip, @userAgent)
      `);
      const tx = db.transaction(() => {
        for (const s of valid) insert.run(s);
      });
      tx();
    }
    logger.info({ total: sessions.length, migrated: valid.length }, 'Migrated sessions from JSON');
  }

  const loginAttempts = readJSON('login-attempts.json');
  if (loginAttempts && Object.keys(loginAttempts).length > 0) {
    const insert = db.prepare(`
      INSERT OR IGNORE INTO login_attempts (key, count, lastAttempt, lockedUntil, ips)
      VALUES (@key, @count, @lastAttempt, @lockedUntil, @ips)
    `);
    const tx = db.transaction(() => {
      for (const [key, record] of Object.entries(loginAttempts)) {
        insert.run({
          key,
          count: record.count || 0,
          lastAttempt: record.lastAttempt || null,
          lockedUntil: record.lockedUntil || null,
          ips: JSON.stringify(record.ips || []),
        });
      }
    });
    tx();
    logger.info({ count: Object.keys(loginAttempts).length }, 'Migrated login attempts from JSON');
  }

  const auditLogs = readJSON('audit.json');
  if (auditLogs && auditLogs.length > 0) {
    const insert = db.prepare(`
      INSERT INTO audit_logs (timestamp, userId, action, details, ip, userAgent, severity)
      VALUES (@timestamp, @userId, @action, @details, @ip, @userAgent, @severity)
    `);
    const tx = db.transaction(() => {
      for (const entry of auditLogs) {
        insert.run({
          timestamp: entry.timestamp,
          userId: entry.userId || null,
          action: entry.action,
          details: JSON.stringify(entry.details || {}),
          ip: entry.ip || null,
          userAgent: entry.userAgent || null,
          severity: entry.severity || 'info',
        });
      }
    });
    tx();
    logger.info({ count: auditLogs.length }, 'Migrated audit logs from JSON');
  }

  logger.info('Migration complete');
}

export default migrateFromJSON;
