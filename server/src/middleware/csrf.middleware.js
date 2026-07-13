import randomToken from '../utils/randomToken.js';

const COOKIE_NAME = process.env.NODE_ENV === 'production' ? '__Host-csrf-token' : 'csrf-token';
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
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'Invalid CSRF token.' });
  }
  next();
}
