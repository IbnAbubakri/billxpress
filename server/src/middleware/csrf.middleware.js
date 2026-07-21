// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import crypto from 'crypto';
import randomToken from '../utils/randomToken.js';
import env from '../config/env.js';

const COOKIE_NAME = env.isProd() ? '__Host-csrf-token' : 'csrf-token';
const HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

function setCsrfCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: 'strict',
    secure: true,
    path: '/',
    maxAge: 15 * 60 * 1000,
  });
}

export function csrfToken(req, res) {
  let token = req.cookies?.[COOKIE_NAME] || req.cookies?.['csrf-token'];
  if (!token || token.length < CSRF_TOKEN_LENGTH) {
    token = randomToken(CSRF_TOKEN_LENGTH);
  }
  setCsrfCookie(res, token);
  res.json({ csrfToken: token });
}

export function rotateCsrf(req, res) {
  const newToken = randomToken(CSRF_TOKEN_LENGTH);
  setCsrfCookie(res, newToken);
  res.locals.csrfToken = newToken;
}

export function validateCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const cookieToken = req.cookies?.[COOKIE_NAME] || req.cookies?.['csrf-token'];
  const headerToken = req.headers[HEADER_NAME];
  if (!cookieToken || !headerToken) {
    return res.status(403).json({ error: 'Invalid CSRF token.' });
  }
  const cookieBuf = Buffer.from(cookieToken);
  const headerBuf = Buffer.from(headerToken);
  if (cookieBuf.length !== headerBuf.length || !crypto.timingSafeEqual(cookieBuf, headerBuf)) {
    return res.status(403).json({ error: 'Invalid CSRF token.' });
  }
  next();
}
