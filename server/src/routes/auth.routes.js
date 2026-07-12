import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  handleLogin, handleAdminLogin, handleRegister, handleLogout, handleRefresh,
  handleMe, handleForgotPassword, handleResetPassword,
  handleSessions, handleDeleteSession, handleLogoutAll, handlePasswordPolicy,
  handleUpdateProfile, handleSendVerification, handleVerifyEmail,
  handleCheckPhone, handleCheckEmail, handleSendOtp, handleVerifyOtp,
  handleChangePassword, handleSetTransactionPin,
  handleGenerateMfaSecret, handleVerifyMfaSetup, handleDisableMfa,
  handleDeleteAccount,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateLogin, validateRegister, validatePasswordReset } from '../middleware/validate.middleware.js';
import { csrfToken, validateCsrf } from '../middleware/csrf.middleware.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait before trying again.' },
});

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 3,
  standardHeaders: true, legacyHeaders: false,
  keyGenerator: (req) => (req.body?.email && typeof req.body.email === 'string' ? req.body.email.toLowerCase() : req.ip),
  message: { error: 'Too many requests. Please wait before trying again.' },
});

const mfaVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many MFA verification attempts. Please wait before trying again.' },
});

const mfaManageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 3,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many MFA requests. Please wait before trying again.' },
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  standardHeaders: true, legacyHeaders: false,
  keyGenerator: (req) => req.body?.token || req.ip,
  message: { error: 'Too many reset attempts. Please wait before trying again.' },
});

router.get('/csrf-token', csrfToken);
router.get('/password-policy', handlePasswordPolicy);
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many registration attempts. Please wait before trying again.' },
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many admin login attempts. Please wait before trying again.' },
});

router.post('/register', registerLimiter, validateCsrf, validateRegister, handleRegister);
router.post('/login', loginLimiter, validateCsrf, validateLogin, handleLogin);
router.post('/admin-login', adminLoginLimiter, validateCsrf, validateLogin, handleAdminLogin);
router.post('/logout', authenticate, validateCsrf, handleLogout);
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many refresh attempts. Please wait before trying again.' },
});

router.post('/refresh', refreshLimiter, validateCsrf, handleRefresh);
router.get('/me', authenticate, handleMe);
router.post('/forgot-password', forgotLimiter, validateCsrf, handleForgotPassword);
router.post('/reset-password', resetLimiter, validateCsrf, validatePasswordReset, handleResetPassword);
router.post('/send-verification', validateCsrf, handleSendVerification);
router.post('/verify-email', validateCsrf, handleVerifyEmail);
router.put('/profile', authenticate, validateCsrf, handleUpdateProfile);
router.put('/password', authenticate, validateCsrf, handleChangePassword);
router.put('/transaction-pin', authenticate, validateCsrf, handleSetTransactionPin);
router.get('/sessions', authenticate, handleSessions);
router.delete('/sessions/:sessionId', authenticate, validateCsrf, handleDeleteSession);
router.post('/logout-all', authenticate, validateCsrf, handleLogoutAll);
router.post('/mfa/generate', mfaManageLimiter, authenticate, validateCsrf, handleGenerateMfaSecret);
router.post('/mfa/verify', mfaVerifyLimiter, authenticate, validateCsrf, handleVerifyMfaSetup);
router.post('/mfa/disable', mfaManageLimiter, authenticate, validateCsrf, handleDisableMfa);
router.delete('/account', authenticate, validateCsrf, handleDeleteAccount);

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 3,
  standardHeaders: true, legacyHeaders: false,
  keyGenerator: (req) => req.body?.phone || req.ip,
  message: { error: 'Too many OTP requests. Please wait before trying again.' },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  standardHeaders: true, legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  message: { error: 'Too many verification attempts. Please wait before trying again.' },
});

const checkPhoneLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 30,
  standardHeaders: true, legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  message: { error: 'Too many requests. Please wait before trying again.' },
});

const checkEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many email check requests. Please wait before trying again.' },
});

router.post('/check-phone', checkPhoneLimiter, validateCsrf, handleCheckPhone);
router.post('/check-email', checkEmailLimiter, validateCsrf, handleCheckEmail);
router.post('/send-otp', otpLimiter, validateCsrf, handleSendOtp);
router.post('/verify-otp', otpVerifyLimiter, validateCsrf, handleVerifyOtp);

export default router;
