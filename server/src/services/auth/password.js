import crypto from 'crypto';
import AppError from '../../utils/AppError.js';
import logger from '../../utils/logger.js';
import { logAction } from '../audit.service.js';

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

const HIBP_TIMEOUT_MS = 2000;

export function getPasswordPolicy() {
  return {
    minLength: PASSWORD_POLICY.minLength,
    maxLength: PASSWORD_POLICY.maxLength,
    minUppercase: PASSWORD_POLICY.minUppercase,
    minLowercase: PASSWORD_POLICY.minLowercase,
    minNumbers: PASSWORD_POLICY.minNumbers,
    minSpecialChars: PASSWORD_POLICY.minSpecialChars,
    historySize: PASSWORD_POLICY.historySize,
    expiryDays: PASSWORD_POLICY.expiryDays,
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

export async function checkHIBP(password) {
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

export async function validateNewPassword(newPlain, currentHash, passwordHistory, { ip, userAgent } = {}) {
  const complexityErrors = validatePasswordComplexity(newPlain);
  if (complexityErrors.length) {
    throw new AppError(complexityErrors.join(' '), 400);
  }

  const pwned = await checkHIBP(newPlain);
  if (pwned === true) throw new AppError('Password has been exposed in a data breach. Choose a different one.', 400);

  if (currentHash) {
    const bcrypt = await import('bcryptjs').then(m => m.default || m);
    if (await bcrypt.compare(newPlain, currentHash)) {
      throw new AppError('Cannot reuse your current password.', 400);
    }
    const history = passwordHistory || [];
    const reuse = await Promise.all(history.map((h) => bcrypt.compare(newPlain, h)));
    if (reuse.some(Boolean)) {
      throw new AppError('Cannot reuse a recent password.', 400);
    }
  }

  return { ok: true };
}

export { PASSWORD_POLICY };
