// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: {
        use: vi.fn((onFulfilled, onRejected) => {
          mockAxiosInstance._responseInterceptor = { onFulfilled, onRejected };
        }),
      },
    },
    defaults: { baseURL: '', headers: { common: {} } },
  };
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
    create: vi.fn(() => mockAxiosInstance),
  };
});

const mockAxios = axios.create();

import { login, register, logout, getMe, forgotPassword, resetPassword } from '../api/client';

function mockCsrfToken() {
  mockAxios.get.mockResolvedValue({ data: { csrfToken: 'mock-csrf-token' } });
  mockAxios._responseInterceptor = null;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCsrfToken();
  if (!mockAxios._responseInterceptor) {
    mockAxios.interceptors.response.use.mockImplementation((onFulfilled, onRejected) => {
      mockAxios._responseInterceptor = { onFulfilled, onRejected };
      return 0;
    });
  }
});

describe('login', () => {
  it('posts to /login and returns data', async () => {
    mockAxios.post.mockResolvedValue({ data: { user: { id: '1', email: 'test@example.com' } } });

    const result = await login('test@example.com', 'password123');

    expect(mockAxios.get).toHaveBeenCalledWith('/csrf-token');
    expect(mockAxios.post).toHaveBeenCalledWith('/login', { email: 'test@example.com', password: 'password123' }, expect.any(Object));
    expect(result).toEqual({ user: { id: '1', email: 'test@example.com' } });
  });

  it('throws on error', async () => {
    mockAxios.post.mockRejectedValue(new Error('Invalid credentials'));

    await expect(login('test@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
  });
});

describe('register', () => {
  it('posts to /register and returns data', async () => {
    mockAxios.post.mockResolvedValue({ data: { user: { id: '2', email: 'new@example.com' } } });

    const result = await register('new@example.com', 'password123');

    expect(mockAxios.post).toHaveBeenCalledWith('/register', { email: 'new@example.com', password: 'password123' }, expect.any(Object));
    expect(result.user.email).toBe('new@example.com');
  });
});

describe('logout', () => {
  it('posts to /logout', async () => {
    mockAxios.post.mockResolvedValue({ data: { message: 'Logged out.' } });

    const result = await logout();

    expect(mockAxios.post).toHaveBeenCalledWith('/logout', {}, expect.any(Object));
    expect(result.message).toBe('Logged out.');
  });
});

describe('getMe', () => {
  it('gets current user', async () => {
    mockAxios.get.mockResolvedValue({ data: { user: { id: '1', email: 'test@example.com' } } });

    const result = await getMe();

    expect(mockAxios.get).toHaveBeenCalledWith('/me');
    expect(result.user.email).toBe('test@example.com');
  });
});

describe('forgotPassword', () => {
  it('posts to /forgot-password', async () => {
    mockAxios.post.mockResolvedValue({ data: { message: 'Reset link sent.' } });

    const result = await forgotPassword('test@example.com');

    expect(mockAxios.post).toHaveBeenCalledWith('/forgot-password', { email: 'test@example.com' }, expect.any(Object));
    expect(result.message).toBe('Reset link sent.');
  });
});

describe('resetPassword', () => {
  it('posts to /reset-password', async () => {
    mockAxios.post.mockResolvedValue({ data: { message: 'Password updated.' } });

    const result = await resetPassword('token-123', 'NewP@ss123');

    expect(mockAxios.post).toHaveBeenCalledWith('/reset-password', { token: 'token-123', password: 'NewP@ss123' }, expect.any(Object));
    expect(result.message).toBe('Password updated.');
  });
});
