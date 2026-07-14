// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { resolve, dirname } from 'path';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import { getDb } from '../utils/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../data');
const ARCHIVE_DIR = resolve(DATA_DIR, 'audit-archive');

function ensureArchiveDir() {
  if (!existsSync(ARCHIVE_DIR)) {
    mkdirSync(ARCHIVE_DIR, { recursive: true });
  }
}

async function rotateIfNeeded() {
  const db = getDb();
  const { count } = await db.prepare('SELECT COUNT(*) as count FROM audit_logs').get();
  if (count <= 10000) return;

  const date = new Date().toISOString().slice(0, 10);
  const archivePath = resolve(ARCHIVE_DIR, `audit-${date}.json`);
  ensureArchiveDir();

  const toRotate = await db.prepare(`
    SELECT * FROM audit_logs ORDER BY timestamp ASC LIMIT ?
  `).all(count - 10000);

  const keptRows = await db.prepare(`
    SELECT id FROM audit_logs ORDER BY timestamp DESC LIMIT 10000
  `).all();
  const keptIds = keptRows.map(r => r.id);

  const archive = toRotate.map(r => ({
    timestamp: r.timestamp,
    userId: r.userId,
    action: r.action,
    details: JSON.parse(r.details || '{}'),
    ip: r.ip,
    userAgent: r.userAgent,
    severity: r.severity,
  }));

  let existingArchive = [];
  if (existsSync(archivePath)) {
    try {
      existingArchive = JSON.parse(readFileSync(archivePath, 'utf-8'));
    } catch { }
  }

  try {
    writeFileSync(archivePath, JSON.stringify([...existingArchive, ...archive], null, 2), 'utf-8');
    logger.info({ rotatedCount: archive.length, archivePath }, 'Audit log rotated');
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to rotate audit log');
    return;
  }

  const placeholders = keptIds.map((_, i) => `$${i + 1}`).join(',');
  await db.prepare(`DELETE FROM audit_logs WHERE id NOT IN (${placeholders})`).run(...keptIds);
}

export async function logAction({ userId, action, details, ip, userAgent, severity = 'info' }) {
  const db = getDb();
  const timestamp = new Date().toISOString();
  await db.prepare(`
    INSERT INTO audit_logs (timestamp, userId, action, details, ip, userAgent, severity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(timestamp, userId, action, JSON.stringify(details || {}), ip, userAgent, severity);

  await rotateIfNeeded();

  const level = severity === 'high' ? 'warn' : 'info';
  logger[level]({ userId, action, details, ip }, `[AUDIT] ${action}`);
}

export async function securityAlert({ type, email, userId, ip, details }) {
  logger.error(
    { securityEvent: type, email, userId, ip, details },
    `[SECURITY ALERT] ${type}: ${details}`
  );
  await logAction({
    userId,
    action: `SECURITY_ALERT:${type}`,
    details,
    ip,
    userAgent: 'system',
    severity: 'high',
  });
}
