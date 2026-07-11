import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import env from '../config/env.js';
import { getDb } from '../utils/db.js';

export function generateAccessToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN });
}

export async function generateRefreshToken(userId) {
  const db = getDb();
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES_IN)).toISOString();
  await db.prepare('INSERT INTO refresh_tokens (token, userId, expiresAt) VALUES (?, ?, ?)').run(token, userId, expiresAt);
  return token;
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

export async function rotateRefreshToken(oldToken, userId) {
  const db = getDb();
  const deleted = await db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(oldToken);
  if (deleted.changes === 0) return null;
  const newToken = uuidv4();
  const expiresAt = new Date(Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES_IN)).toISOString();
  await db.prepare('INSERT INTO refresh_tokens (token, userId, expiresAt) VALUES (?, ?, ?)').run(newToken, userId, expiresAt);
  return newToken;
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

export async function createSession(userId, ip, userAgent) {
  const db = getDb();
  const now = new Date().toISOString();
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
  if (!s) return false;
  const elapsed = (new Date() - new Date(s.lastactivity ?? s.lastActivity)) / 60000;
  if (elapsed > idleMinutes) {
    await db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    return false;
  }
  return true;
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

function parseDuration(dur) {
  const match = dur.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const val = parseInt(match[1]);
  switch (match[2]) {
    case 's': return val * 1000;
    case 'm': return val * 60 * 1000;
    case 'h': return val * 60 * 60 * 1000;
    case 'd': return val * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}
