import { vi, describe, it, expect, beforeEach } from 'vitest';

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

vi.mock('../services/audit.service.js', () => ({
  logAction: vi.fn(),
  securityAlert: vi.fn(),
}));

vi.mock('../utils/cache.js', () => ({
  memoize: (fn) => fn,
}));

import {
  handleGetStats, handleGetRevenueChart, handleGetServiceDistribution,
  handleGetAdminTransactions, handleGetAdminUsers, handleGetAnalytics,
} from '../controllers/admin.controller.js';

function mockReq(overrides = {}) {
  return {
    body: {},
    query: {},
    cookies: {},
    user: { id: 'admin-1', role: 'admin', email: 'admin@test.com' },
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

describe('handleGetStats', () => {
  it('returns stats for admin dashboard', async () => {
    mockDb.prepare.mockReturnValue({
      get: vi.fn().mockReturnValue({ totalusers: 10, totaltransactions: 50, totalrevenue: 100000, successrate: '95.0' }),
    });

    const req = mockReq();
    const res = mockRes();

    await handleGetStats(req, res, mockNext);

    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    expect(res.json).toHaveBeenCalledWith({
      stats: expect.objectContaining({
        totalUsers: 10,
        totalTransactions: 50,
      }),
    });
  });
});

describe('handleGetAdminUsers', () => {
  it('returns users without cursor', async () => {
    mockDb.prepare.mockReturnValue({
      all: vi.fn().mockReturnValue([
        { id: '1', name: 'Alice', email: 'alice@test.com', balance: 100, role: 'user', joined_date: '2025-01-01', last_login: '2025-06-01' },
      ]),
    });

    const req = mockReq();
    const res = mockRes();

    await handleGetAdminUsers(req, res, mockNext);

    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('ORDER BY createdAt DESC, id DESC'));
    expect(res.json).toHaveBeenCalledWith({
      users: expect.any(Array),
      nextCursor: null,
      hasMore: false,
      pagination: { limit: 50 },
    });
  });

  it('returns users with compound cursor', async () => {
    mockDb.prepare.mockReturnValue({
      all: vi.fn().mockReturnValue([
        { id: '5', name: 'Charlie', email: 'charlie@test.com', balance: 300, role: 'user', joined_date: '2025-03-01', last_login: '2025-06-03' },
      ]),
    });

    const req = mockReq({ query: { cursor: '2025-03-01|5' } });
    const res = mockRes();

    await handleGetAdminUsers(req, res, mockNext);

    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE (createdAt < ?) OR (createdAt = ? AND id < ?)'));
    expect(res.json).toHaveBeenCalled();
  });
});

describe('handleGetAdminTransactions', () => {
  it('returns transactions with pagination', async () => {
    mockDb.prepare.mockReturnValue({
      all: vi.fn().mockReturnValue([
        { id: 100, user_name: 'Alice', user_email: 'alice@test.com', service: 'Airtime', service_type: 'airtime', amount: 500, status: 'completed', created_at: '2025-06-01' },
      ]),
    });

    const req = mockReq({ query: { limit: '10' } });
    const res = mockRes();

    await handleGetAdminTransactions(req, res, mockNext);

    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('JOIN users'));
    expect(res.json).toHaveBeenCalledWith({
      transactions: expect.any(Array),
      nextCursor: null,
      hasMore: false,
      pagination: { limit: 10 },
    });
  });

  it('returns transactions with cursor', async () => {
    mockDb.prepare.mockReturnValue({
      all: vi.fn().mockReturnValue([
        { id: 50, user_name: 'Bob', user_email: 'bob@test.com', service: 'Data', service_type: 'data', amount: 1000, status: 'completed', created_at: '2025-05-01' },
      ]),
    });

    const req = mockReq({ query: { cursor: '50' } });
    const res = mockRes();

    await handleGetAdminTransactions(req, res, mockNext);

    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE t.id < ?'));
    expect(res.json).toHaveBeenCalled();
  });
});

describe('handleGetAnalytics', () => {
  it('returns analytics data', async () => {
    mockDb.prepare.mockReturnValue({
      all: vi.fn().mockReturnValue([]),
    });

    const req = mockReq();
    const res = mockRes();

    await handleGetAnalytics(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith({
      daily: expect.any(Array),
      serviceStats: expect.any(Array),
      userGrowth: expect.any(Array),
    });
  });
});

describe('handleGetRevenueChart', () => {
  it('returns revenue chart data', async () => {
    mockDb.prepare.mockReturnValue({
      all: vi.fn().mockReturnValue([{ month: '2025-01', revenue: 50000, transactions: 10 }]),
    });

    const req = mockReq();
    const res = mockRes();

    await handleGetRevenueChart(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith({
      data: expect.arrayContaining([expect.objectContaining({ month: '2025-01' })]),
    });
  });
});

describe('handleGetServiceDistribution', () => {
  it('returns service distribution data', async () => {
    mockDb.prepare.mockReturnValue({
      all: vi.fn().mockReturnValue([{ name: 'Airtime', value: 30 }, { name: 'Data', value: 20 }]),
    });

    const req = mockReq();
    const res = mockRes();

    await handleGetServiceDistribution(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith({
      data: expect.arrayContaining([expect.objectContaining({ name: 'Airtime', value: 30 })]),
    });
  });
});
