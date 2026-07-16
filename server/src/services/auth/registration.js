import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import AppError from '../../utils/AppError.js';
import logger from '../../utils/logger.js';
import { logAction } from '../audit.service.js';
import { getDb } from '../../utils/db.js';
import randomToken from '../../utils/randomToken.js';
import { normalizePhone, SALT_ROUNDS } from './helpers.js';
import { validatePasswordComplexity, checkHIBP } from './password.js';

function stubEmail(to, subject, body) {
  logger.info({ emailTo: to, subject }, `[EMAIL STUB] ${body}`);
}

function stubSms(to, body) {
  logger.info({ smsTo: to }, `[DEV SMS] ${body}`);
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
    ).get(normalized, new Date(Date.now() - 10 * 60 * 1000).toISOString());
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
  const isDemo = !process.env.SMS_PROVIDER;
  if (pwned === null) {
    logger.warn({ email: email.toLowerCase() }, 'HIBP check failed, allowing registration');
  }
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const id = uuidv4();
  const now = new Date().toISOString();
  const verificationToken = randomToken(32);
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await db.prepare(`
    INSERT INTO users (id, email, password, name, phone, role, createdAt, emailVerified, emailVerificationToken, emailVerificationExpires, passwordChangedAt)
    VALUES (?, ?, ?, ?, ?, 'user', ?, ?, ?, ?, ?)
  `).run(id, email.toLowerCase(), hashedPassword, name || '', phone ? normalizePhone(phone) : '', now, isDemo ? 1 : 0, verificationToken, verificationExpires, now);
  stubEmail(email.toLowerCase(), 'Verify Your Email', `Verification token: ${verificationToken}`);
  logAction({ userId: id, action: 'REGISTER', details: { email: email.toLowerCase(), phone: phone || '' }, ip, userAgent });
  logger.info({ userId: id }, 'User registered');
  return { id, email: email.toLowerCase(), role: 'user', emailVerified: Boolean(isDemo) };
}

export async function checkEmail(email) {
  const db = getDb();
  await new Promise(r => setTimeout(r, 200));
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  return { exists: Boolean(existing) };
}

export async function checkPhone(phone) {
  const db = getDb();
  const normalized = normalizePhone(phone);
  await new Promise(r => setTimeout(r, 200));
  const user = await db.prepare('SELECT id FROM users WHERE phone = ?').get(normalized);
  return { exists: Boolean(user), hasEmail: false };
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
  const code = String(crypto.randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await db.prepare('INSERT INTO otps (phone, code, expiresAt) VALUES (?, ?, ?)').run(normalized, code, expiresAt);
  stubSms(normalized, `Your BillXpress verification code is: ${code}. It expires in 10 minutes.`);
  logger.info({ phone: normalized }, 'OTP sent');
  const response = { message: 'OTP sent successfully', expiresIn: 600 };
  if (!process.env.SMS_PROVIDER) {
    response.code = code;
  }
  return response;
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
