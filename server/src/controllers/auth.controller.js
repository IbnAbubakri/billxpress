import {
  authenticate, register, getUserById, forgotPassword, resetPassword,
  updateUserProfile, generateVerificationToken, verifyEmailToken,
} from '../services/auth.service.js';
import {
  generateAccessToken, generateRefreshToken,
  rotateRefreshToken, revokeRefreshToken,
  revokeAllUserRefreshTokens, getStoredRefreshToken,
  createSession, updateSessionActivity, getSessionsByUserId, getSessionById,
  deleteSession, deleteAllUserSessions,
} from '../services/token.service.js';
import logger from '../utils/logger.js';
import { logAction } from '../services/audit.service.js';

function setAuthCookies(res, accessToken, refreshToken) {
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  };
  res.cookie('accessToken', accessToken, { ...opts, maxAge: 15 * 60 * 1000 });
  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      ...opts, maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/auth',
    });
  }
}

function clearAuthCookies(res) {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.clearCookie('sessionId', { path: '/' });
}

function loginResponse(res, user, req) {
  const sessionId = createSession(user.id, req.clientIp, req.clientUA);
  const payload = { sub: user.id, email: user.email, role: user.role, sessionId, ip: req.clientIp };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(user.id);
  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  setAuthCookies(res, accessToken, refreshToken);
  const fullUser = getUserById(user.id);
  res.json({ user: fullUser || { id: user.id, email: user.email, role: user.role } });
}

export async function handleLogin(req, res, next) {
  try {
    const { email, password, totpCode } = req.body;
    const result = await authenticate(email, password, totpCode, req.clientIp, req.clientUA);
    if (result.mfaRequired) {
      return res.json({ mfaRequired: true, email: result.tempEmail });
    }
    loginResponse(res, result, req);
    logger.info({ userId: result.id }, 'Login successful');
  } catch (err) { next(err); }
}

export async function handleRegister(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await register({ email, password, ip: req.clientIp, userAgent: req.clientUA });
    loginResponse(res, user, req);
    logger.info({ userId: user.id }, 'Registration successful');
  } catch (err) { next(err); }
}

export async function handleLogout(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) revokeRefreshToken(refreshToken);
    const sessionId = req.cookies?.sessionId;
    if (sessionId) deleteSession(sessionId);
    clearAuthCookies(res);
    logAction({ userId: req.user?.id, action: 'LOGOUT', details: {}, ip: req.clientIp, userAgent: req.clientUA });
    logger.info('Logout successful');
    res.json({ message: 'Logged out.' });
  } catch (err) { next(err); }
}

export async function handleRefresh(req, res, next) {
  try {
    const old = req.cookies?.refreshToken;
    if (!old) return res.status(401).json({ error: 'Refresh token required.' });
    const stored = getStoredRefreshToken(old);
    if (!stored) { clearAuthCookies(res); return res.status(401).json({ error: 'Invalid or expired refresh token.' }); }
    const user = getUserById(stored.userId);
    if (!user) { revokeRefreshToken(old); clearAuthCookies(res); return res.status(401).json({ error: 'User not found.' }); }
    const newRefresh = rotateRefreshToken(old, user.id);
    if (!newRefresh) { revokeRefreshToken(old); clearAuthCookies(res); return res.status(401).json({ error: 'Token already rotated.' }); }
    const newSessionId = createSession(user.id, req.clientIp, req.clientUA);
    const oldSessionId = req.cookies?.sessionId;
    if (oldSessionId) deleteSession(oldSessionId);
    res.cookie('sessionId', newSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const accessToken = generateAccessToken({ sub: user.id, email: user.email, role: user.role, sessionId: newSessionId, ip: req.clientIp });
    setAuthCookies(res, accessToken, newRefresh);
    res.json({ user });
  } catch (err) { next(err); }
}

export async function handleMe(req, res, next) {
  try {
    const full = getUserById(req.user.id);
    res.json({ user: full });
  } catch (err) { next(err); }
}

export async function handleForgotPassword(req, res, next) {
  try {
    const result = await forgotPassword(req.body.email, req.clientIp, req.clientUA);
    res.json(result);
  } catch (err) { next(err); }
}

export async function handleResetPassword(req, res, next) {
  try {
    const result = await resetPassword(req.body.token, req.body.password, req.clientIp, req.clientUA);
    if (result.userId) {
      revokeAllUserRefreshTokens(result.userId);
      deleteAllUserSessions(result.userId);
      logAction({ userId: result.userId, action: 'PASSWORD_RESET_SESSIONS_REVOKED', details: {}, ip: req.clientIp, userAgent: req.clientUA, severity: 'high' });
    }
    clearAuthCookies(res);
    res.json({ message: result.message });
  } catch (err) { next(err); }
}

export async function handleSessions(req, res, next) {
  try {
    const sessions = getSessionsByUserId(req.user.id);
    res.json({ sessions });
  } catch (err) { next(err); }
}

export async function handleDeleteSession(req, res, next) {
  try {
    const session = getSessionById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    if (session.userId !== req.user.id) {
      logAction({ userId: req.user.id, action: 'SESSION_DELETE_FOREIGN', details: { targetSessionId: req.params.sessionId }, ip: req.clientIp, userAgent: req.clientUA, severity: 'high' });
      return res.status(403).json({ error: 'Cannot delete another user\'s session.' });
    }
    deleteSession(req.params.sessionId);
    logAction({ userId: req.user.id, action: 'SESSION_DELETED', details: { sessionId: req.params.sessionId }, ip: req.clientIp, userAgent: req.clientUA });
    res.json({ message: 'Session removed.' });
  } catch (err) { next(err); }
}

export async function handleLogoutAll(req, res, next) {
  try {
    revokeAllUserRefreshTokens(req.user.id);
    deleteAllUserSessions(req.user.id);
    clearAuthCookies(res);
    logAction({ userId: req.user.id, action: 'LOGOUT_ALL_DEVICES', details: {}, ip: req.clientIp, userAgent: req.clientUA });
    logger.info({ userId: req.user.id }, 'Logged out from all devices');
    res.json({ message: 'Logged out from all devices.' });
  } catch (err) { next(err); }
}

export async function handlePasswordPolicy(req, res, next) {
  try {
    res.json(getPasswordPolicy());
  } catch (err) { next(err); }
}

export async function handleSendVerification(req, res, next) {
  try {
    const user = getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.emailVerified) return res.json({ message: 'Email already verified.' });
    const token = generateVerificationToken(user);
    stubEmail(user.email, 'Verify Your Email', `Verification token: ${token}`);
    logAction({ userId: req.user.id, action: 'VERIFICATION_EMAIL_SENT', details: {}, ip: req.clientIp, userAgent: req.clientUA });
    res.json({ message: 'Verification email sent.' });
  } catch (err) { next(err); }
}

export async function handleVerifyEmail(req, res, next) {
  try {
    const result = verifyEmailToken(req.body.token);
    logAction({ userId: result.id, action: 'EMAIL_VERIFIED', details: {}, ip: req.clientIp, userAgent: req.clientUA });
    res.json({ message: 'Email verified successfully.', user: result });
  } catch (err) { next(err); }
}

export async function handleUpdateProfile(req, res, next) {
  try {
    const user = updateUserProfile(req.user.id, req.body, req.clientIp, req.clientUA);
    res.json({ user });
  } catch (err) { next(err); }
}

function stubEmail(to, subject, body) {
  logger.info({ emailTo: to, subject }, `[EMAIL STUB] ${body}`);
}
