import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockTokenService, mockAuthService } = vi.hoisted(() => ({
  mockTokenService: {
    verifyAccessToken: vi.fn(),
    checkSessionActivity: vi.fn(),
    updateSessionActivity: vi.fn(),
  },
  mockAuthService: {
    getUserById: vi.fn(),
  },
}));

vi.mock('../services/token.service.js', () => mockTokenService);
vi.mock('../services/auth.service.js', () => mockAuthService);

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
}));

import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';

function mockReq(overrides = {}) {
  return {
    cookies: {},
    clientIp: '127.0.0.1',
    clientUA: 'test-agent',
    ...overrides,
  };
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.cookie = vi.fn().mockReturnValue(res);
  res.clearCookie = vi.fn().mockReturnValue(res);
  return res;
}

const mockNext = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authenticate', () => {
  it('passes with valid token and active session', async () => {
    const user = { id: 'user-1', email: 'test@test.com', role: 'user' };
    mockTokenService.verifyAccessToken.mockReturnValue({ sub: 'user-1', sessionId: 'sess-1', ip: '127.0.0.1' });
    mockAuthService.getUserById.mockReturnValue(user);
    mockTokenService.checkSessionActivity.mockReturnValue({
      id: 'sess-1', userid: 'user-1',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    });
    mockTokenService.updateSessionActivity.mockResolvedValue();

    const req = mockReq({ cookies: { accessToken: 'valid-token' } });
    const res = mockRes();

    await authenticate(req, res, mockNext);

    expect(req.user).toEqual(user);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('passes with valid token without session (stateless mode)', async () => {
    const user = { id: 'user-1', email: 'test@test.com', role: 'user' };
    mockTokenService.verifyAccessToken.mockReturnValue({ sub: 'user-1' });
    mockAuthService.getUserById.mockReturnValue(user);

    const req = mockReq({ cookies: { accessToken: 'valid-token' } });
    const res = mockRes();

    await authenticate(req, res, mockNext);

    expect(req.user).toEqual(user);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('returns 401 when no token provided', async () => {
    const req = mockReq();
    const res = mockRes();

    await authenticate(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('returns 401 when token is expired', async () => {
    mockTokenService.verifyAccessToken.mockImplementation(() => {
      const err = new Error('jwt expired');
      err.name = 'TokenExpiredError';
      throw err;
    });

    const req = mockReq({ cookies: { accessToken: 'expired-token' } });
    const res = mockRes();

    await authenticate(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('returns 401 when token is invalid', async () => {
    mockTokenService.verifyAccessToken.mockImplementation(() => {
      throw new Error('invalid signature');
    });

    const req = mockReq({ cookies: { accessToken: 'bad-token' } });
    const res = mockRes();

    await authenticate(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('returns 401 when user not found', async () => {
    mockTokenService.verifyAccessToken.mockReturnValue({ sub: 'deleted-user' });
    mockAuthService.getUserById.mockReturnValue(null);

    const req = mockReq({ cookies: { accessToken: 'valid-token' } });
    const res = mockRes();

    await authenticate(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('returns 401 when session expired', async () => {
    mockTokenService.verifyAccessToken.mockReturnValue({ sub: 'user-1', sessionId: 'expired-sess' });
    mockAuthService.getUserById.mockReturnValue({ id: 'user-1', email: 'test@test.com', role: 'user' });
    mockTokenService.checkSessionActivity.mockReturnValue(null);

    const req = mockReq({ cookies: { accessToken: 'valid-token' } });
    const res = mockRes();

    await authenticate(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});

describe('optionalAuth', () => {
  it('sets user when valid token provided', async () => {
    mockTokenService.verifyAccessToken.mockReturnValue({ sub: 'user-1' });
    mockAuthService.getUserById.mockReturnValue({ id: 'user-1', email: 'test@test.com', role: 'user' });

    const req = mockReq({ cookies: { accessToken: 'valid-token' } });
    const res = mockRes();

    await optionalAuth(req, res, mockNext);

    expect(req.user).toEqual(expect.objectContaining({ id: 'user-1' }));
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('continues without user when no token', async () => {
    const req = mockReq();
    const res = mockRes();

    await optionalAuth(req, res, mockNext);

    expect(req.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('continues without user when token is invalid', async () => {
    mockTokenService.verifyAccessToken.mockImplementation(() => {
      throw new Error('invalid token');
    });

    const req = mockReq({ cookies: { accessToken: 'bad-token' } });
    const res = mockRes();

    await optionalAuth(req, res, mockNext);

    expect(req.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('continues without user when user not found', async () => {
    mockTokenService.verifyAccessToken.mockReturnValue({ sub: 'deleted-user' });
    mockAuthService.getUserById.mockReturnValue(null);

    const req = mockReq({ cookies: { accessToken: 'valid-token' } });
    const res = mockRes();

    await optionalAuth(req, res, mockNext);

    expect(req.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalledWith();
  });
});
