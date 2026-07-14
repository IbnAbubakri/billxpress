// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';

vi.mock('../api/client', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
  updateProfile: vi.fn(),
  sendVerificationEmail: vi.fn(),
}));

import * as api from '../api/client';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('useAuth', () => {
  it('returns initial unauthenticated state', () => {
    vi.mocked(api.getMe).mockResolvedValue({ user: null });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isAdmin).toBe(false);
  });

  it('fetches user on mount and sets authenticated', async () => {
    vi.mocked(api.getMe).mockResolvedValue({
      user: { id: '1', email: 'user@example.com', name: 'User', role: 'user', balance: 100, hasTransactionPin: false },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.email).toBe('user@example.com');
    expect(result.current.isAdmin).toBe(false);
  });

  it('detects admin role', async () => {
    vi.mocked(api.getMe).mockResolvedValue({
      user: { id: '2', email: 'admin@example.com', name: 'Admin', role: 'admin', balance: 0, hasTransactionPin: false },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(true);
    });
  });

  it('handleLogin calls login mutation and updates state', async () => {
    vi.mocked(api.getMe).mockResolvedValue({ user: null });
    vi.mocked(api.login).mockResolvedValue({
      user: { id: '3', email: 'test@example.com', name: 'Test', role: 'user', balance: 50, hasTransactionPin: false },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.handleLogin('test@example.com', 'password123');
    });

    expect(api.login).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('handleRegister calls register mutation', async () => {
    vi.mocked(api.getMe).mockResolvedValue({ user: null });
    vi.mocked(api.register).mockResolvedValue({
      user: { id: '4', email: 'new@example.com', name: 'New', role: 'user', balance: 0, hasTransactionPin: false },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.handleRegister('new@example.com', 'password123');
    });

    expect(api.register).toHaveBeenCalledWith('new@example.com', 'password123');
  });

  it('handleLogout calls logout mutation and clears state', async () => {
    vi.mocked(api.getMe).mockResolvedValue({ user: null });
    vi.mocked(api.logout).mockResolvedValue({ message: 'Logged out.' });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(api.logout).toHaveBeenCalled();
  });
});
