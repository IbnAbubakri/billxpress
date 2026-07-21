// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockAuthService, mockTokenService } = vi.hoisted(() => ({
  mockAuthService: {
    authenticate: vi.fn(),
    register: vi.fn(),
    getUserById: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    updateUserProfile: vi.fn(),
    lookupUserForVerification: vi.fn(),
    generateVerificationToken: vi.fn(),
    verifyEmailToken: vi.fn(),
    sanitizeUser: vi.fn((u) => u),
    checkPhone: vi.fn(),
    checkEmail: vi.fn(),
    sendOtp: vi.fn(),
    verifyOtp: vi.fn(),
    changePassword: vi.fn(),
    setTransactionPin: vi.fn(),
    generateMfaSecret: vi.fn(),
    verifyMfaSetup: vi.fn(),
    disableMfa: vi.fn(),
    deleteAccount: vi.fn(),
    normalizePhone: vi.fn((p) => p),
    getPasswordPolicy: vi.fn(() => ({ minLength: 12 })),
  },
  mockTokenService: {
    generateAccessToken: vi.fn(),
    generateRefreshToken: vi.fn(),
    rotateRefreshToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
    revokeAllUserRefreshTokens: vi.fn(),
    getStoredRefreshToken: vi.fn(),
    createSession: vi.fn(),
    updateSessionActivity: vi.fn(),
    getSessionsByUserId: vi.fn(),
    getSessionById: vi.fn(),
    deleteSession: vi.fn(),
    deleteAllUserSessions: vi.fn(),
  },
}));

vi.mock('../services/auth.service.js', () => mockAuthService);
vi.mock('../services/token.service.js', () => mockTokenService);

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
}));

vi.mock('../services/audit.service.js', () => ({
  logAction: vi.fn(),
  securityAlert: vi.fn(),
}));

import {
  handleLogin, handleAdminLogin, handleRegister, handleLogout, handleRefresh,
  handleMe, handleForgotPassword, handleResetPassword,
  handleSessions, handleDeleteSession, handleLogoutAll,
  handleSendVerification, handleVerifyEmail,
  handleCheckPhone, handleCheckEmail, handleSendOtp, handleVerifyOtp,
  handleUpdateProfile, handleChangePassword, handleSetTransactionPin,
  handleGenerateMfaSecret, handleVerifyMfaSetup, handleDisableMfa,
  handleDeleteAccount, handlePasswordPolicy,
} from '../controllers/auth.controller.js';

function mockReq(overrides = {}) {
  return {
    body: {},
    cookies: {},
    user: null,
    clientIp: '127.0.0.1',
    clientUA: 'test-agent',
    ...overrides,
  };
}

function mockRes() {
  const res = { locals: {} };
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.cookie = vi.fn().mockReturnValue(res);
  res.clearCookie = vi.fn().mockReturnValue(res);
  return res;
}

const mockNext = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockTokenService.generateAccessToken.mockReturnValue('mock-access-token');
  mockTokenService.generateRefreshToken.mockReturnValue('mock-refresh-token');
  mockTokenService.createSession.mockReturnValue('mock-session-id');
  mockAuthService.getUserById.mockReturnValue({ id: 'user-1', email: 'test@example.com', role: 'user', name: 'Test' });
});

describe('handleLogin', () => {
  it('responds with user on successful login', async () => {
    mockAuthService.authenticate.mockResolvedValue({ id: 'user-1', email: 'test@example.com', role: 'user' });
    const req = mockReq({ body: { email: 'test@example.com', password: 'ValidP@ss1' } });
    const res = mockRes();

    await handleLogin(req, res, mockNext);

    expect(mockAuthService.authenticate).toHaveBeenCalledWith('test@example.com', 'ValidP@ss1', undefined, '127.0.0.1', 'test-agent');
    expect(mockTokenService.createSession).toHaveBeenCalled();
    expect(mockTokenService.generateAccessToken).toHaveBeenCalled();
    expect(mockTokenService.generateRefreshToken).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ user: expect.anything() }));
  });

  it('responds with mfaRequired when MFA is needed', async () => {
    mockAuthService.authenticate.mockResolvedValue({ mfaRequired: true, tempEmail: 'test@example.com' });
    const req = mockReq({ body: { email: 'test@example.com', password: 'ValidP@ss1' } });
    const res = mockRes();

    await handleLogin(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith({ mfaRequired: true, email: 'test@example.com' });
  });

  it('calls next with error on authentication failure', async () => {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    mockAuthService.authenticate.mockRejectedValue(err);
    const req = mockReq({ body: { email: 'test@example.com', password: 'wrong' } });
    const res = mockRes();

    await handleLogin(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(err);
  });
});

describe('handleRegister', () => {
  it('registers and logs in user', async () => {
    mockAuthService.register.mockResolvedValue({ id: 'user-2', email: 'new@example.com', role: 'user' });
    const req = mockReq({ body: { email: 'new@example.com', password: 'ValidP@ss1' } });
    const res = mockRes();

    await handleRegister(req, res, mockNext);

    expect(mockAuthService.register).toHaveBeenCalledWith({
      email: 'new@example.com', password: 'ValidP@ss1',
      ip: '127.0.0.1', userAgent: 'test-agent',
    });
    expect(res.json).toHaveBeenCalled();
  });

  it('calls next on error', async () => {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    mockAuthService.register.mockRejectedValue(err);
    const req = mockReq({ body: { email: 'dup@example.com', password: 'ValidP@ss1' } });
    const res = mockRes();

    await handleRegister(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(err);
  });
});

describe('handleLogout', () => {
  it('clears cookies and revokes tokens', async () => {
    const req = mockReq({
      cookies: { refreshToken: 'old-refresh', sessionId: 'sess-1' },
      user: { id: 'user-1' },
    });
    const res = mockRes();

    await handleLogout(req, res, mockNext);

    expect(mockTokenService.revokeRefreshToken).toHaveBeenCalledWith('old-refresh');
    expect(mockTokenService.deleteSession).toHaveBeenCalledWith('sess-1');
    expect(res.clearCookie).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: 'Logged out.' });
  });
});

describe('handleRefresh', () => {
  it('refreshes tokens successfully', async () => {
    mockTokenService.getStoredRefreshToken.mockReturnValue({ userId: 'user-1' });
    mockTokenService.rotateRefreshToken.mockReturnValue('new-refresh-token');
    const req = mockReq({ cookies: { refreshToken: 'valid-refresh', sessionId: 'old-session' } });
    const res = mockRes();

    await handleRefresh(req, res, mockNext);

    expect(mockTokenService.getStoredRefreshToken).toHaveBeenCalledWith('valid-refresh');
    expect(mockTokenService.rotateRefreshToken).toHaveBeenCalledWith('valid-refresh', 'user-1');
    expect(res.json).toHaveBeenCalledWith({ user: expect.anything() });
  });

  it('returns 401 when refresh token is missing', async () => {
    const req = mockReq({ cookies: {} });
    const res = mockRes();

    await handleRefresh(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Refresh token required.' });
  });

  it('returns 401 when token is invalid', async () => {
    mockTokenService.getStoredRefreshToken.mockReturnValue(null);
    const req = mockReq({ cookies: { refreshToken: 'invalid' } });
    const res = mockRes();

    await handleRefresh(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when user not found', async () => {
    mockTokenService.getStoredRefreshToken.mockReturnValue({ userId: 'missing-user' });
    mockAuthService.getUserById.mockReturnValue(null);
    const req = mockReq({ cookies: { refreshToken: 'valid-refresh' } });
    const res = mockRes();

    await handleRefresh(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('handleMe', () => {
  it('returns user data', async () => {
    mockAuthService.getUserById.mockReturnValue({ id: 'user-1', email: 'test@example.com', name: 'Test' });
    const req = mockReq({ user: { id: 'user-1' } });
    const res = mockRes();

    await handleMe(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith({ user: expect.objectContaining({ id: 'user-1' }) });
  });

  it('calls next on error', async () => {
    mockAuthService.getUserById.mockImplementation(() => { throw new Error('DB error'); });
    const req = mockReq({ user: { id: 'user-1' } });
    const res = mockRes();

    await handleMe(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});

describe('handleForgotPassword', () => {
  it('sends reset response', async () => {
    mockAuthService.forgotPassword.mockResolvedValue({ message: 'If that email exists, a reset link has been sent.' });
    const req = mockReq({ body: { email: 'test@example.com' } });
    const res = mockRes();

    await handleForgotPassword(req, res, mockNext);

    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith('test@example.com', '127.0.0.1', 'test-agent');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });
});

describe('handleResetPassword', () => {
  it('resets password and clears sessions', async () => {
    mockAuthService.resetPassword.mockResolvedValue({ userId: 'user-1', message: 'Password updated.' });
    const req = mockReq({ body: { token: 'valid-token', password: 'NewStrongP@ss1' } });
    const res = mockRes();

    await handleResetPassword(req, res, mockNext);

    expect(mockAuthService.resetPassword).toHaveBeenCalledWith('valid-token', 'NewStrongP@ss1', '127.0.0.1', 'test-agent');
    expect(mockTokenService.revokeAllUserRefreshTokens).toHaveBeenCalledWith('user-1');
    expect(mockTokenService.deleteAllUserSessions).toHaveBeenCalledWith('user-1');
    expect(res.clearCookie).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: 'Password updated.' });
  });
});

describe('handleSessions', () => {
  it('returns user sessions', async () => {
    mockTokenService.getSessionsByUserId.mockReturnValue([
      { id: 'sess-1', userId: 'user-1', createdAt: '2025-01-01', lastActivity: '2025-01-01', ip: '::1', userAgent: 'test' },
    ]);
    const req = mockReq({ user: { id: 'user-1' } });
    const res = mockRes();

    await handleSessions(req, res, mockNext);

    expect(mockTokenService.getSessionsByUserId).toHaveBeenCalledWith('user-1');
    expect(res.json).toHaveBeenCalledWith({ sessions: expect.arrayContaining([expect.objectContaining({ id: 'sess-1' })]) });
  });
});

describe('handleDeleteSession', () => {
  it('deletes own session', async () => {
    mockTokenService.getSessionById.mockReturnValue({ id: 'sess-1', userId: 'user-1' });
    const req = mockReq({ params: { sessionId: 'sess-1' }, user: { id: 'user-1' } });
    const res = mockRes();

    await handleDeleteSession(req, res, mockNext);

    expect(mockTokenService.deleteSession).toHaveBeenCalledWith('sess-1');
    expect(res.json).toHaveBeenCalledWith({ message: 'Session removed.' });
  });

  it('returns 404 for missing session', async () => {
    mockTokenService.getSessionById.mockReturnValue(null);
    const req = mockReq({ params: { sessionId: 'ghost' }, user: { id: 'user-1' } });
    const res = mockRes();

    await handleDeleteSession(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 for another users session', async () => {
    mockTokenService.getSessionById.mockReturnValue({ id: 'sess-2', userId: 'other-user' });
    const req = mockReq({ params: { sessionId: 'sess-2' }, user: { id: 'user-1' } });
    const res = mockRes();

    await handleDeleteSession(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('handleLogoutAll', () => {
  it('revokes all tokens and sessions', async () => {
    const req = mockReq({ user: { id: 'user-1' } });
    const res = mockRes();

    await handleLogoutAll(req, res, mockNext);

    expect(mockTokenService.revokeAllUserRefreshTokens).toHaveBeenCalledWith('user-1');
    expect(mockTokenService.deleteAllUserSessions).toHaveBeenCalledWith('user-1');
    expect(res.json).toHaveBeenCalledWith({ message: 'Logged out from all devices.' });
  });
});

describe('handleSendVerification', () => {
  it('sends verification email', async () => {
    mockAuthService.lookupUserForVerification.mockReturnValue({ id: 'user-1', emailVerified: false });
    mockAuthService.generateVerificationToken.mockReturnValue('verify-token-123');
    const req = mockReq({ user: { id: 'user-1' } });
    const res = mockRes();

    await handleSendVerification(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith({ message: 'Verification email sent.' });
  });

  it('returns message if already verified', async () => {
    mockAuthService.lookupUserForVerification.mockReturnValue({ id: 'user-1', emailVerified: true });
    const req = mockReq({ user: { id: 'user-1' } });
    const res = mockRes();

    await handleSendVerification(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith({ message: 'Email already verified.' });
  });
});

describe('handleVerifyEmail', () => {
  it('verifies email with valid token', async () => {
    mockAuthService.verifyEmailToken.mockReturnValue({ id: 'user-1', email: 'test@example.com' });
    const req = mockReq({ body: { token: 'valid-token' } });
    const res = mockRes();

    await handleVerifyEmail(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Email verified successfully.',
      user: { id: 'user-1', email: 'test@example.com' },
    });
  });
});

describe('handleAdminLogin', () => {
  it('logs in admin user', async () => {
    mockAuthService.authenticate.mockResolvedValue({ id: 'admin-1', email: 'admin@example.com', role: 'admin' });
    const req = mockReq({ body: { email: 'admin@example.com', password: 'ValidP@ss1' } });
    const res = mockRes();

    await handleAdminLogin(req, res, mockNext);

    expect(mockAuthService.authenticate).toHaveBeenCalledWith('admin@example.com', 'ValidP@ss1', undefined, '127.0.0.1', 'test-agent');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ user: expect.anything() }));
  });

  it('blocks non-admin user', async () => {
    mockAuthService.authenticate.mockResolvedValue({ id: 'user-1', email: 'user@example.com', role: 'user' });
    const req = mockReq({ body: { email: 'user@example.com', password: 'ValidP@ss1' } });
    const res = mockRes();

    await handleAdminLogin(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. Admin credentials required.' });
  });

  it('calls next on error', async () => {
    mockAuthService.authenticate.mockRejectedValue(new Error('Invalid'));
    const req = mockReq({ body: { email: 'admin@example.com', password: 'wrong' } });
    const res = mockRes();

    await handleAdminLogin(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});

describe('handleCheckPhone', () => {
  it('returns check result', async () => {
    mockAuthService.checkPhone.mockResolvedValue({ ok: true });
    const req = mockReq({ body: { phone: '+2348012345678' } });
    const res = mockRes();

    await handleCheckPhone(req, res, mockNext);

    expect(mockAuthService.checkPhone).toHaveBeenCalledWith('+2348012345678');
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
});

describe('handleCheckEmail', () => {
  it('returns check result', async () => {
    mockAuthService.checkEmail.mockResolvedValue({ ok: true });
    const req = mockReq({ body: { email: 'test@example.com' } });
    const res = mockRes();

    await handleCheckEmail(req, res, mockNext);

    expect(mockAuthService.checkEmail).toHaveBeenCalledWith('test@example.com');
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
});

describe('handleSendOtp', () => {
  it('sends OTP and returns result', async () => {
    mockAuthService.sendOtp.mockResolvedValue({ message: 'OTP sent successfully', expiresIn: 600 });
    const req = mockReq({ body: { phone: '+2348012345678' } });
    const res = mockRes();

    await handleSendOtp(req, res, mockNext);

    expect(mockAuthService.sendOtp).toHaveBeenCalledWith('+2348012345678');
    expect(res.json).toHaveBeenCalledWith({ message: 'OTP sent successfully', expiresIn: 600 });
  });

  it('calls next on error', async () => {
    mockAuthService.sendOtp.mockRejectedValue(new Error('Too many requests'));
    const req = mockReq({ body: { phone: '+2348012345678' } });
    const res = mockRes();

    await handleSendOtp(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});

describe('handleVerifyOtp', () => {
  it('verifies OTP code', async () => {
    mockAuthService.verifyOtp.mockResolvedValue({ verified: true });
    const req = mockReq({ body: { phone: '+2348012345678', code: '123456' } });
    const res = mockRes();

    await handleVerifyOtp(req, res, mockNext);

    expect(mockAuthService.verifyOtp).toHaveBeenCalledWith('+2348012345678', '123456');
    expect(res.json).toHaveBeenCalledWith({ verified: true });
  });
});

describe('handleUpdateProfile', () => {
  it('updates user profile', async () => {
    mockAuthService.updateUserProfile.mockResolvedValue({ id: 'user-1', name: 'Updated' });
    const req = mockReq({ user: { id: 'user-1' }, body: { name: 'Updated' } });
    const res = mockRes();

    await handleUpdateProfile(req, res, mockNext);

    expect(mockAuthService.updateUserProfile).toHaveBeenCalledWith('user-1', { name: 'Updated' }, '127.0.0.1', 'test-agent');
    expect(res.json).toHaveBeenCalledWith({ user: { id: 'user-1', name: 'Updated' } });
  });
});

describe('handleChangePassword', () => {
  it('changes password and revokes sessions', async () => {
    mockAuthService.changePassword.mockResolvedValue({ message: 'Password changed.' });
    const req = mockReq({ user: { id: 'user-1' }, body: { currentPassword: 'old', newPassword: 'NewStrongP@ss1' } });
    const res = mockRes();

    await handleChangePassword(req, res, mockNext);

    expect(mockAuthService.changePassword).toHaveBeenCalledWith('user-1', 'old', 'NewStrongP@ss1', '127.0.0.1', 'test-agent');
    expect(mockTokenService.revokeAllUserRefreshTokens).toHaveBeenCalledWith('user-1');
    expect(mockTokenService.deleteAllUserSessions).toHaveBeenCalledWith('user-1');
    expect(res.json).toHaveBeenCalledWith({ message: 'Password changed successfully.' });
  });

  it('returns 400 when passwords missing', async () => {
    const req = mockReq({ user: { id: 'user-1' }, body: {} });
    const res = mockRes();

    await handleChangePassword(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Both current and new password are required.' });
  });
});

describe('handleSetTransactionPin', () => {
  it('sets transaction PIN', async () => {
    mockAuthService.setTransactionPin.mockResolvedValue({ message: 'PIN set.' });
    const req = mockReq({ user: { id: 'user-1' }, body: { pin: '1234' } });
    const res = mockRes();

    await handleSetTransactionPin(req, res, mockNext);

    expect(mockAuthService.setTransactionPin).toHaveBeenCalledWith('user-1', '1234', '127.0.0.1', 'test-agent', undefined);
    expect(res.json).toHaveBeenCalledWith({ message: 'Transaction PIN set successfully.' });
  });
});

describe('handleGenerateMfaSecret', () => {
  it('generates MFA secret', async () => {
    mockAuthService.generateMfaSecret.mockResolvedValue({ secret: 'JBSWY3DPEHPK3PXP', qrCode: 'data:image/png;base64,...' });
    const req = mockReq({ user: { id: 'user-1' } });
    const res = mockRes();

    await handleGenerateMfaSecret(req, res, mockNext);

    expect(mockAuthService.generateMfaSecret).toHaveBeenCalledWith('user-1');
    expect(res.json).toHaveBeenCalledWith({ secret: 'JBSWY3DPEHPK3PXP', qrCode: 'data:image/png;base64,...' });
  });
});

describe('handleVerifyMfaSetup', () => {
  it('verifies MFA setup', async () => {
    mockAuthService.verifyMfaSetup.mockResolvedValue({ message: 'MFA enabled.' });
    const req = mockReq({ user: { id: 'user-1' }, body: { token: '123456' } });
    const res = mockRes();

    await handleVerifyMfaSetup(req, res, mockNext);

    expect(mockAuthService.verifyMfaSetup).toHaveBeenCalledWith('user-1', '123456');
    expect(res.json).toHaveBeenCalledWith({ message: 'MFA enabled.' });
  });

  it('returns 400 when token missing', async () => {
    const req = mockReq({ user: { id: 'user-1' }, body: {} });
    const res = mockRes();

    await handleVerifyMfaSetup(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Verification code required.' });
  });
});

describe('handleDisableMfa', () => {
  it('disables MFA', async () => {
    mockAuthService.disableMfa.mockResolvedValue({ message: 'MFA disabled.' });
    const req = mockReq({ user: { id: 'user-1' }, body: { password: 'ValidP@ss1' } });
    const res = mockRes();

    await handleDisableMfa(req, res, mockNext);

    expect(mockAuthService.disableMfa).toHaveBeenCalledWith('user-1', 'ValidP@ss1', undefined);
    expect(res.json).toHaveBeenCalledWith({ message: 'MFA disabled.' });
  });

  it('returns 400 when password missing', async () => {
    const req = mockReq({ user: { id: 'user-1' }, body: {} });
    const res = mockRes();

    await handleDisableMfa(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Password is required to disable MFA.' });
  });
});

describe('handleDeleteAccount', () => {
  it('deletes account', async () => {
    mockAuthService.deleteAccount.mockResolvedValue({ message: 'Account deleted.' });
    const req = mockReq({ user: { id: 'user-1' }, body: { password: 'ValidP@ss1', confirmText: 'DELETE' } });
    const res = mockRes();

    await handleDeleteAccount(req, res, mockNext);

    expect(mockAuthService.deleteAccount).toHaveBeenCalledWith('user-1', 'ValidP@ss1', '127.0.0.1', 'test-agent');
    expect(res.json).toHaveBeenCalledWith({ message: 'Account deleted.' });
  });

  it('returns 400 when password missing', async () => {
    const req = mockReq({ user: { id: 'user-1' }, body: {} });
    const res = mockRes();

    await handleDeleteAccount(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Password is required to delete your account.' });
  });

  it('returns 400 when confirmText is not DELETE', async () => {
    const req = mockReq({ user: { id: 'user-1' }, body: { password: 'ValidP@ss1', confirmText: 'wrong' } });
    const res = mockRes();

    await handleDeleteAccount(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Please type DELETE to confirm account deletion.' });
  });
});

describe('handlePasswordPolicy', () => {
  it('returns password policy', async () => {
    const req = mockReq();
    const res = mockRes();

    await handlePasswordPolicy(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith({ minLength: 12 });
  });
});
