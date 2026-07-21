// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import env from '../config/env.js';
import { getDb } from '../utils/db.js';
import logger from '../utils/logger.js';

export function generateAccessToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN });
}

export async function generateRefreshToken(userId) {
  const db = getDb();
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_MS).toISOString();
  await db.prepare('INSERT INTO refresh_tokens (token, userId, expiresAt) VALUES (?, ?, ?)').run(token, userId, expiresAt);
  return token;
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

export async function rotateRefreshToken(oldToken, userId) {
  const db = getDb();
  return await db.transaction(async (tx) => {
    const deleted = await tx.run('DELETE FROM refresh_tokens WHERE token = ?', oldToken);
    if (deleted.changes === 0) return null;
    const newToken = uuidv4();
    const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_MS).toISOString();
    await tx.run('INSERT INTO refresh_tokens (token, userId, expiresAt) VALUES (?, ?, ?)', newToken, userId, expiresAt);
    return newToken;
  });
}

export async function revokeRefreshToken(token) {
  const db = getDb();
  await db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(token);
}

export async function revokeAllUserRefreshTokens(userId) {
  const db = getDb();
  await db.prepare('DELETE FROM refresh_tokens WHERE userId = ?').run(userId);
}

export async function getStoredRefreshToken(token) {
  const db = getDb();
  const found = await db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(token);
  if (!found) return null;
  if (new Date(found.expiresat ?? found.expiresAt) < new Date()) {
    await db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(token);
    return null;
  }
  return found;
}

const MAX_SESSIONS_PER_USER = 10;

export async function createSession(userId, ip, userAgent) {
  const db = getDb();
  const now = new Date().toISOString();
  const count = await db.prepare('SELECT COUNT(*) as cnt FROM sessions WHERE userId = ?').get(userId);
  if (count.cnt >= MAX_SESSIONS_PER_USER) {
    const oldest = await db.prepare('SELECT id FROM sessions WHERE userId = ? ORDER BY lastActivity ASC LIMIT 1').get(userId);
    if (oldest) {
      logger.warn({ userId, sessionId: oldest.id }, 'Session limit reached — evicting oldest session');
      await db.prepare('DELETE FROM sessions WHERE id = ?').run(oldest.id);
    }
  }
  const id = uuidv4();
  await db.prepare('INSERT INTO sessions (id, userId, createdAt, lastActivity, ip, userAgent) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, userId, now, now, ip, userAgent);
  return id;
}

export async function updateSessionActivity(sessionId) {
  const db = getDb();
  await db.prepare('UPDATE sessions SET lastActivity = ? WHERE id = ?').run(new Date().toISOString(), sessionId);
}

export async function checkSessionActivity(sessionId, idleMinutes) {
  const db = getDb();
  const s = await db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  if (!s) return null;
  const idleElapsed = (new Date() - new Date(s.lastactivity ?? s.lastActivity)) / 60000;
  if (idleElapsed > idleMinutes) {
    await db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    return null;
  }
  const absoluteAgeHours = (new Date() - new Date(s.createdat ?? s.createdAt)) / 3600000;
  if (absoluteAgeHours > 24) {
    await db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    return null;
  }
  return s;
}

export async function getSessionsByUserId(userId) {
  const db = getDb();
  return await db.prepare('SELECT * FROM sessions WHERE userId = ?').all(userId);
}

export async function getSessionById(sessionId) {
  const db = getDb();
  return await db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) || null;
}

export async function deleteSession(sessionId) {
  const db = getDb();
  await db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

export async function deleteAllUserSessions(userId) {
  const db = getDb();
  await db.prepare('DELETE FROM sessions WHERE userId = ?').run(userId);
}
