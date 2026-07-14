// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import AppError from '../utils/AppError.js';
import { getPasswordPolicy, validatePasswordComplexity, sanitizeValue } from '../services/auth.service.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

function commonValidation(email, password) {
  const policy = getPasswordPolicy();
  const errors = [];
  if (!email || typeof email !== 'string') errors.push('Email is required.');
  else if (email.length > MAX_EMAIL_LENGTH) errors.push('Email is too long.');
  else if (!EMAIL_REGEX.test(sanitizeValue(email))) errors.push('Invalid email format.');
  if (password !== undefined) {
    if (!password || typeof password !== 'string') errors.push('Password is required.');
    else if (password.length > policy.maxLength) errors.push('Password is too long.');
    else errors.push(...validatePasswordComplexity(password));
  }
  return errors;
}

export function validateLogin(req, res, next) {
  const login = req.body.login || req.body.email;
  const isPhone = login && /^[\d\+\-\(\)\s]+$/.test(login) && login.replace(/[\s\-\(\)]/g, '').length >= 10;
  if (!isPhone) {
    const errors = commonValidation(login);
    if (!req.body.password || typeof req.body.password !== 'string') {
      errors.push('Password is required.');
    }
    if (errors.length) return next(new AppError(errors.join(' '), 400));
    if (login) req.body.email = sanitizeValue(login).toLowerCase();
  } else {
    const errors = [];
    if (!login || typeof login !== 'string') errors.push('Phone number or email is required.');
    if (!req.body.password || typeof req.body.password !== 'string') errors.push('Password is required.');
    if (errors.length) return next(new AppError(errors.join(' '), 400));
  }
  next();
}

export function validateRegister(req, res, next) {
  const errors = commonValidation(req.body.email, req.body.password);
  if (req.body.phone) {
    const cleaned = req.body.phone.replace(/[\s\-\(\)]/g, '');
    if (!/^(\+234|234|0)[7-9][01]\d{8}$/.test(cleaned)) {
      errors.push('Please enter a valid Nigerian phone number.');
    }
  }
  if (errors.length) return next(new AppError(errors.join(' '), 400));
  req.body.email = sanitizeValue(req.body.email).toLowerCase();
  next();
}

export function validatePasswordReset(req, res, next) {
  const { token, password } = req.body;
  const errors = [];
  if (!token || typeof token !== 'string') errors.push('Reset token is required.');
  if (!password || typeof password !== 'string') errors.push('Password is required.');
  else errors.push(...validatePasswordComplexity(password));
  if (errors.length) return next(new AppError(errors.join(' '), 400));
  next();
}
