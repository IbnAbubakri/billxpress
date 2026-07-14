// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../utils/db.js';
import env from '../config/env.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

const SALT_ROUNDS = 12;
const PASSWORD_MIN = 12;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?\d{7,15}$/;
const NAME_MIN = 2;
const NAME_MAX = 100;

function validatePassword(pw) {
  const errors = [];
  if (pw.length < PASSWORD_MIN) errors.push(`at least ${PASSWORD_MIN} characters`);
  if (!/[A-Z]/.test(pw)) errors.push('an uppercase letter');
  if (!/[a-z]/.test(pw)) errors.push('a lowercase letter');
  if (!/[0-9]/.test(pw)) errors.push('a number');
  if (!/[^A-Za-z0-9]/.test(pw)) errors.push('a special character');
  return errors;
}

export async function handleCreateAdmin(req, res, next) {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return next(new AppError('Email, password, and name are required.', 400));
    }

    if (!EMAIL_REGEX.test(email)) {
      return next(new AppError('Invalid email format.', 400));
    }

    if (email.length > 254) {
      return next(new AppError('Email is too long.', 400));
    }

    const pwErrors = validatePassword(password);
    if (pwErrors.length > 0) {
      return next(new AppError(`Password must contain: ${pwErrors.join(', ')}.`, 400));
    }

    if (name.length < NAME_MIN || name.length > NAME_MAX) {
      return next(new AppError(`Name must be between ${NAME_MIN} and ${NAME_MAX} characters.`, 400));
    }

    if (phone && !PHONE_REGEX.test(phone)) {
      return next(new AppError('Invalid phone number format.', 400));
    }

    const db = getDb();

    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return next(new AppError('A user with this email already exists.', 409));
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const now = new Date().toISOString();
    const id = uuidv4();

    await db.prepare(`
      INSERT INTO users (id, email, password, role, name, phone, emailVerified, createdAt, passwordChangedAt, passwordHistory)
      VALUES (?, ?, ?, 'admin', ?, ?, 1, ?, ?, '[]')
    `).run(id, email, hashedPassword, name, phone || null, now, now);

    logger.info({ adminId: id, email }, 'Admin account created');

    const { password: _, ...safeAdmin } = await db.prepare(
      'SELECT id, email, role, name, phone, emailVerified, createdAt FROM users WHERE id = ?'
    ).get(id);

    res.status(201).json({ message: 'Admin account created successfully.', admin: safeAdmin });
  } catch (err) {
    next(err);
  }
}
