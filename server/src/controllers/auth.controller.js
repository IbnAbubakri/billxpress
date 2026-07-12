import {
  authenticate, register, getUserById, forgotPassword, resetPassword,
  updateUserProfile, generateVerificationToken, verifyEmailToken,
  checkPhone, checkEmail, sendOtp, verifyOtp, changePassword, setTransactionPin,
  generateMfaSecret, verifyMfaSetup, disableMfa, deleteAccount, normalizePhone,
} from '../services/auth.service.js';
import { getDb } from '../utils/db.js';
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

async function loginResponse(res, user, req) {
  const sessionId = await createSession(user.id, req.clientIp, req.clientUA);
  const payload = { sub: user.id, email: user.email, role: user.role, sessionId, ip: req.clientIp };
  const accessToken = generateAccessToken(payload);
  const refreshToken = await generateRefreshToken(user.id);
  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  setAuthCookies(res, accessToken, refreshToken);
  const fullUser = await getUserById(user.id);
  res.json({ user: fullUser || { id: user.id, email: user.email, role: user.role } });
}

export async function handleLogin(req, res, next) {
  try {
    const { login, email, password, totpCode } = req.body;
    const result = await authenticate(login || email, password, totpCode, req.clientIp, req.clientUA);
    if (result.mfaRequired) {
      return res.json({ mfaRequired: true, email: result.tempEmail });
    }
    await loginResponse(res, result, req);
    logger.info({ userId: result.id }, 'Login successful');
  } catch (err) { next(err); }
}

export async function handleRegister(req, res, next) {
  try {
    const { email, password, phone, name } = req.body;
    const user = await register({ email, password, phone, name, ip: req.clientIp, userAgent: req.clientUA });
    await loginResponse(res, user, req);
    logger.info({ userId: user.id }, 'Registration successful');
  } catch (err) { next(err); }
}

export async function handleCheckPhone(req, res, next) {
  try {
    const result = await checkPhone(req.body.phone);
    res.json(result);
  } catch (err) { next(err); }
}

export async function handleCheckEmail(req, res, next) {
  try {
    const result = await checkEmail(req.body.email);
    res.json(result);
  } catch (err) { next(err); }
}

export async function handleSendOtp(req, res, next) {
  try {
    const result = await sendOtp(req.body.phone);
    res.json(result);
  } catch (err) { next(err); }
}

export async function handleVerifyOtp(req, res, next) {
  try {
    const result = await verifyOtp(req.body.phone, req.body.code);
    res.json(result);
  } catch (err) { next(err); }
}

export async function handleLogout(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) await revokeRefreshToken(refreshToken);
    const sessionId = req.cookies?.sessionId;
    if (sessionId) await deleteSession(sessionId);
    clearAuthCookies(res);
    await logAction({ userId: req.user?.id, action: 'LOGOUT', details: {}, ip: req.clientIp, userAgent: req.clientUA });
    logger.info('Logout successful');
    res.json({ message: 'Logged out.' });
  } catch (err) { next(err); }
}

export async function handleRefresh(req, res, next) {
  try {
    const old = req.cookies?.refreshToken;
    if (!old) return res.status(401).json({ error: 'Refresh token required.' });
    const stored = await getStoredRefreshToken(old);
    if (!stored) { clearAuthCookies(res); return res.status(401).json({ error: 'Invalid or expired refresh token.' }); }
    const user = await getUserById(stored.userId);
    if (!user) { await revokeRefreshToken(old); clearAuthCookies(res); return res.status(401).json({ error: 'User not found.' }); }
    const newRefresh = await rotateRefreshToken(old, user.id);
    if (!newRefresh) { await revokeRefreshToken(old); clearAuthCookies(res); return res.status(401).json({ error: 'Token already rotated.' }); }
    const newSessionId = await createSession(user.id, req.clientIp, req.clientUA);
    const oldSessionId = req.cookies?.sessionId;
    if (oldSessionId) await deleteSession(oldSessionId);
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
    const full = await getUserById(req.user.id);
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
      await revokeAllUserRefreshTokens(result.userId);
      await deleteAllUserSessions(result.userId);
      await logAction({ userId: result.userId, action: 'PASSWORD_RESET_SESSIONS_REVOKED', details: {}, ip: req.clientIp, userAgent: req.clientUA, severity: 'high' });
    }
    clearAuthCookies(res);
    res.json({ message: result.message });
  } catch (err) { next(err); }
}

export async function handleSessions(req, res, next) {
  try {
    const sessions = await getSessionsByUserId(req.user.id);
    res.json({ sessions });
  } catch (err) { next(err); }
}

export async function handleDeleteSession(req, res, next) {
  try {
    const session = await getSessionById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    if ((session.userid ?? session.userId) !== req.user.id) {
      await logAction({ userId: req.user.id, action: 'SESSION_DELETE_FOREIGN', details: { targetSessionId: req.params.sessionId }, ip: req.clientIp, userAgent: req.clientUA, severity: 'high' });
      return res.status(403).json({ error: 'Cannot delete another user\'s session.' });
    }
    await deleteSession(req.params.sessionId);
    await logAction({ userId: req.user.id, action: 'SESSION_DELETED', details: { sessionId: req.params.sessionId }, ip: req.clientIp, userAgent: req.clientUA });
    res.json({ message: 'Session removed.' });
  } catch (err) { next(err); }
}

export async function handleLogoutAll(req, res, next) {
  try {
    await revokeAllUserRefreshTokens(req.user.id);
    await deleteAllUserSessions(req.user.id);
    clearAuthCookies(res);
    await logAction({ userId: req.user.id, action: 'LOGOUT_ALL_DEVICES', details: {}, ip: req.clientIp, userAgent: req.clientUA });
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
    const identifier = req.body?.email || req.body?.login;
    let user = identifier
      ? getDb().prepare('SELECT * FROM users WHERE email = ?').get(identifier.toLowerCase())
      : null;
    if (identifier && !user) {
      user = getDb().prepare('SELECT * FROM users WHERE phone = ?').get(normalizePhone(identifier));
    }
    if (!user && req.user?.id) {
      user = await getUserById(req.user.id);
    }
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.emailverified ?? user.emailVerified) return res.json({ message: 'Email already verified.' });
    const token = await generateVerificationToken(user);
    if (!process.env.SMS_PROVIDER) {
      return res.json({ message: 'Verification email sent.', token });
    }
    await logAction({ userId: user.id, action: 'VERIFICATION_EMAIL_SENT', details: {}, ip: req.clientIp, userAgent: req.clientUA });
    res.json({ message: 'Verification email sent.' });
  } catch (err) { next(err); }
}

export async function handleVerifyEmail(req, res, next) {
  try {
    const result = await verifyEmailToken(req.body.token);
    await logAction({ userId: result.id, action: 'EMAIL_VERIFIED', details: {}, ip: req.clientIp, userAgent: req.clientUA });
    res.json({ message: 'Email verified successfully.', user: result });
  } catch (err) { next(err); }
}

export async function handleUpdateProfile(req, res, next) {
  try {
    const user = await updateUserProfile(req.user.id, req.body, req.clientIp, req.clientUA);
    res.json({ user });
  } catch (err) { next(err); }
}

export async function handleChangePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both current and new password are required.' });
    await changePassword(req.user.id, currentPassword, newPassword, req.clientIp, req.clientUA);
    res.json({ message: 'Password changed successfully.' });
  } catch (err) { next(err); }
}

export async function handleSetTransactionPin(req, res, next) {
  try {
    const { pin } = req.body;
    await setTransactionPin(req.user.id, pin, req.clientIp, req.clientUA);
    res.json({ message: 'Transaction PIN set successfully.' });
  } catch (err) { next(err); }
}

export async function handleGenerateMfaSecret(req, res, next) {
  try {
    const result = await generateMfaSecret(req.user.id);
    res.json(result);
  } catch (err) { next(err); }
}

export async function handleVerifyMfaSetup(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Verification code required.' });
    const result = await verifyMfaSetup(req.user.id, token);
    res.json(result);
  } catch (err) { next(err); }
}

export async function handleDisableMfa(req, res, next) {
  try {
    const result = await disableMfa(req.user.id);
    res.json(result);
  } catch (err) { next(err); }
}

export async function handleDeleteAccount(req, res, next) {
  try {
    await deleteAccount(req.user.id);
    clearAuthCookies(res);
    res.json({ message: 'Account deleted.' });
  } catch (err) { next(err); }
}


