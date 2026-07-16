import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockHash } = vi.hoisted(() => ({
  mockHash: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: { hash: mockHash },
}));

const mockDb = {
  prepare: vi.fn(),
};

vi.mock('../utils/db.js', () => ({
  getDb: () => mockDb,
}));

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
}));

vi.mock('uuid', () => ({
  v4: () => 'mock-uuid-id',
}));

vi.mock('../services/audit.service.js', () => ({
  logAction: vi.fn().mockResolvedValue(undefined),
}));

import { handleCreateAdmin } from '../controllers/admin-create.controller.js';

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
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const mockNext = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('handleCreateAdmin', () => {
  it('creates admin with valid data', async () => {
    const getStub = vi.fn();
    getStub.mockReturnValueOnce(undefined);
    getStub.mockReturnValueOnce({ id: 'mock-uuid-id', email: 'admin@test.com', role: 'admin', name: 'Test Admin', phone: '+2348000000000', emailVerified: 1, createdAt: '2025-01-01' });

    const runStub = vi.fn().mockReturnValue({ changes: 1 });
    mockDb.prepare.mockReturnValue({ get: getStub, run: runStub });
    mockHash.mockResolvedValue('hashed-password');

    const req = mockReq({ body: { email: 'admin@test.com', password: 'StrongP@ss1!abc', name: 'Test Admin', phone: '+2348000000000' } });
    const res = mockRes();

    await handleCreateAdmin(req, res, mockNext);

    expect(mockHash).toHaveBeenCalledWith('StrongP@ss1!abc', 12);
    expect(runStub).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Admin account created successfully.',
    }));
  });

  it('rejects missing fields', async () => {
    const req = mockReq({ body: { email: '', password: '', name: '' } });
    const res = mockRes();

    await handleCreateAdmin(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('rejects invalid email format', async () => {
    const req = mockReq({ body: { email: 'not-an-email', password: 'StrongP@ss1!abc', name: 'Admin' } });
    const res = mockRes();

    await handleCreateAdmin(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('rejects weak password', async () => {
    const req = mockReq({ body: { email: 'admin@test.com', password: 'weak', name: 'Admin' } });
    const res = mockRes();

    await handleCreateAdmin(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('rejects duplicate email', async () => {
    mockDb.prepare.mockReturnValue({
      get: vi.fn().mockReturnValue({ id: 'existing-id' }),
    });

    const req = mockReq({ body: { email: 'existing@test.com', password: 'StrongP@ss1!abc', name: 'Admin' } });
    const res = mockRes();

    await handleCreateAdmin(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }));
  });

  it('calls next on unexpected error', async () => {
    mockDb.prepare.mockImplementation(() => { throw new Error('DB error'); });
    const req = mockReq({ body: { email: 'admin@test.com', password: 'StrongP@ss1!abc', name: 'Admin' } });
    const res = mockRes();

    await handleCreateAdmin(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});
