import { verifyAccessToken } from '../services/token.service.js';
import { getUserById } from '../services/auth.service.js';
import { checkSessionActivity, updateSessionActivity } from '../services/token.service.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

const IDLE_TIMEOUT_MINUTES = 30;
const ABSOLUTE_LIFETIME_HOURS = 24;

export async function authenticate(req, res, next) {
  const token = req.cookies?.accessToken;
  if (!token) return next(new AppError('Authentication required.', 401));

  try {
    const decoded = verifyAccessToken(token);
    const user = await getUserById(decoded.sub);
    if (!user) return next(new AppError('User not found.', 401));

    const normalizeIp = (ip) => (typeof ip === 'string' ? ip.replace(/^::ffff:/, '') : '');
    if (decoded.ip && normalizeIp(decoded.ip) !== normalizeIp(req.clientIp)) {
      logger.warn({ userId: decoded.sub, tokenIp: decoded.ip, reqIp: req.clientIp }, 'IP address mismatch in JWT');
    }

    const sessionId = decoded.sessionId;
    if (sessionId) {
      const session = await checkSessionActivity(sessionId, IDLE_TIMEOUT_MINUTES);
      if (!session) {
        return next(new AppError('Session expired due to inactivity.', 401));
      }
      const sessionUserId = session.userid ?? session.userId;
      if (sessionUserId !== decoded.sub) {
        logger.warn({ userId: decoded.sub, sessionUserId }, 'Session user mismatch');
        return next(new AppError('Session invalid.', 401));
      }
      const ageHours = (Date.now() - new Date(session.createdat ?? session.createdAt).getTime()) / 3600000;
      if (ageHours > ABSOLUTE_LIFETIME_HOURS) {
        return next(new AppError('Session lifetime exceeded. Please sign in again.', 401));
      }
      await updateSessionActivity(sessionId);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(new AppError('Token expired.', 401));
    return next(new AppError('Invalid token.', 401));
  }
}

export async function optionalAuth(req, res, next) {
  const token = req.cookies?.accessToken;
  if (!token) return next();
  try {
    const decoded = verifyAccessToken(token);
    const user = await getUserById(decoded.sub);
    if (user) req.user = user;
  } catch (err) {
    logger.warn({ err }, 'optionalAuth: failed to verify token');
  }
  next();
}
