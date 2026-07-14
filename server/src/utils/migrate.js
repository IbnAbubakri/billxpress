// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

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

export async function migrateFromJSON() {
  const db = getDb();

  const { count: userCount } = await db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount > 0) {
    logger.info('Database already has data, skipping migration');
    return;
  }

  const users = readJSON('users.json');
  if (users && users.length > 0) {
    const insert = db.prepare(`
      INSERT INTO users (id, email, password, role, name, phone, balance,
        hasTransactionPin, bvn, accountNumber, bankName, accountName,
        billingStreet, billingCity, billingState, billingCountry,
        homeStreet, homeCity, homeState, homeZip, avatar,
        emailVerified, emailVerificationToken, emailVerificationExpires,
        mfaSecret, mfaEnabled, mfaBackupCodes,
        createdAt, lastLogin, failedLoginAttempts, lockedUntil,
        passwordHistory, passwordChangedAt, resetToken, resetTokenExpires)
      VALUES (?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT DO NOTHING
    `);

    for (const u of users) {
      await insert.run(
        u.id,
        u.email,
        u.password,
        u.role || 'user',
        u.name || '',
        u.phone || '',
        u.balance ?? 0,
        u.hasTransactionPin ? 1 : 0,
        u.bvn || '',
        u.accountNumber || '',
        u.bankName || '',
        u.accountName || '',
        u.billingStreet || '',
        u.billingCity || '',
        u.billingState || '',
        u.billingCountry || '',
        u.homeStreet || '',
        u.homeCity || '',
        u.homeState || '',
        u.homeZip || '',
        u.avatar || '',
        u.emailVerified ? 1 : 0,
        u.emailVerificationToken || null,
        u.emailVerificationExpires || null,
        u.mfaSecret || null,
        u.mfaEnabled ? 1 : 0,
        JSON.stringify(u.mfaBackupCodes || []),
        u.createdAt || new Date().toISOString(),
        u.lastLogin || null,
        u.failedLoginAttempts ?? 0,
        u.lockedUntil || null,
        JSON.stringify(u.passwordHistory || []),
        u.passwordChangedAt || null,
        u.resetToken || null,
        u.resetTokenExpires || null,
      );
    }
    logger.info({ count: users.length }, 'Migrated users from JSON');
  }

  const existingUserIds = new Set(
    (await db.prepare('SELECT id FROM users').all()).map(r => r.id)
  );

  const refreshTokens = readJSON('refresh-tokens.json');
  if (refreshTokens && refreshTokens.length > 0) {
    const valid = refreshTokens.filter(rt => existingUserIds.has(rt.userId));
    if (valid.length > 0) {
      const insert = db.prepare(`
        INSERT INTO refresh_tokens (token, userId, expiresAt)
        VALUES (?, ?, ?)
        ON CONFLICT DO NOTHING
      `);
      for (const rt of valid) {
        await insert.run(rt.token, rt.userId, rt.expiresAt);
      }
    }
    logger.info({ total: refreshTokens.length, migrated: valid.length }, 'Migrated refresh tokens from JSON');
  }

  const sessions = readJSON('sessions.json');
  if (sessions && sessions.length > 0) {
    const valid = sessions.filter(s => existingUserIds.has(s.userId));
    if (valid.length > 0) {
      const insert = db.prepare(`
        INSERT INTO sessions (id, userId, createdAt, lastActivity, ip, userAgent)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT DO NOTHING
      `);
      for (const s of valid) {
        await insert.run(s.id, s.userId, s.createdAt, s.lastActivity, s.ip, s.userAgent);
      }
    }
    logger.info({ total: sessions.length, migrated: valid.length }, 'Migrated sessions from JSON');
  }

  const loginAttempts = readJSON('login-attempts.json');
  if (loginAttempts && Object.keys(loginAttempts).length > 0) {
    const insert = db.prepare(`
      INSERT INTO login_attempts (key, count, lastAttempt, lockedUntil, ips)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT DO NOTHING
    `);
    for (const [key, record] of Object.entries(loginAttempts)) {
      await insert.run(
        key,
        record.count || 0,
        record.lastAttempt || null,
        record.lockedUntil || null,
        JSON.stringify(record.ips || []),
      );
    }
    logger.info({ count: Object.keys(loginAttempts).length }, 'Migrated login attempts from JSON');
  }

  const auditLogs = readJSON('audit.json');
  if (auditLogs && auditLogs.length > 0) {
    const insert = db.prepare(`
      INSERT INTO audit_logs (timestamp, userId, action, details, ip, userAgent, severity)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const entry of auditLogs) {
      await insert.run(
        entry.timestamp,
        entry.userId || null,
        entry.action,
        JSON.stringify(entry.details || {}),
        entry.ip || null,
        entry.userAgent || null,
        entry.severity || 'info',
      );
    }
    logger.info({ count: auditLogs.length }, 'Migrated audit logs from JSON');
  }

  logger.info('Migration complete');
}

export default migrateFromJSON;
