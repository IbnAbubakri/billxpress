import { useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getMe, updateProfile as apiUpdateProfile } from '../api/client';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

function toUser(data: Record<string, unknown>): User {
  return {
    id: data.id as string,
    name: (data.name as string) || '',
    email: data.email as string,
    phone: (data.phone as string) || '',
    balance: (data.balance as number) ?? 0,
    hasTransactionPin: (data.hasTransactionPin as boolean) ?? false,
    emailVerified: (data.emailVerified as boolean) ?? true,
    bvn: (data.bvn as string) || '',
    accountNumber: (data.accountNumber as string) || '',
    bankName: (data.bankName as string) || '',
    accountName: (data.accountName as string) || '',
    billingStreet: (data.billingStreet as string) || '',
    billingCity: (data.billingCity as string) || '',
    billingState: (data.billingState as string) || '',
    billingCountry: (data.billingCountry as string) || '',
    homeStreet: (data.homeStreet as string) || '',
    homeCity: (data.homeCity as string) || '',
    homeState: (data.homeState as string) || '',
    homeZip: (data.homeZip as string) || '',
    avatar: (data.avatar as string) || '',
  };
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    isLoading: true,
  });

  const checkAuth = useCallback(async () => {
    try {
      const data = await getMe();
      if (data.user) {
        setState({
          user: toUser(data.user),
          isAuthenticated: true,
          isAdmin: data.user.role === 'admin',
          isLoading: false,
        });
      } else {
        setState({ user: null, isAuthenticated: false, isAdmin: false, isLoading: false });
      }
    } catch {
      setState({ user: null, isAuthenticated: false, isAdmin: false, isLoading: false });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogin = useCallback(async (email: string, password: string): Promise<{ user?: User; mfaRequired?: boolean }> => {
    const data = await apiLogin(email, password);
    if (data.mfaRequired) {
      return { mfaRequired: true };
    }
    if (data.user) {
      const u = toUser(data.user);
      setState({ user: u, isAuthenticated: true, isAdmin: data.user.role === 'admin', isLoading: false });
      return { user: u };
    }
    throw new Error('Login failed');
  }, []);

  const handleRegister = useCallback(async (email: string, password: string): Promise<User> => {
    const data = await apiRegister(email, password);
    if (data.user) {
      const u = toUser(data.user);
      setState({ user: u, isAuthenticated: true, isAdmin: false, isLoading: false });
      return u;
    }
    throw new Error('Registration failed');
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // proceed with local logout even if API fails
    }
    setState({ user: null, isAuthenticated: false, isAdmin: false, isLoading: false });
  }, []);

  const handleUpdateProfile = useCallback(async (profileData: Record<string, unknown>): Promise<User> => {
    const data = await apiUpdateProfile(profileData);
    if (data.user) {
      const u = toUser(data.user);
      setState((prev) => ({ ...prev, user: u }));
      return u;
    }
    throw new Error('Profile update failed');
  }, []);

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isAdmin: state.isAdmin,
    isLoading: state.isLoading,
    handleLogin,
    handleRegister,
    handleLogout,
    handleUpdateProfile,
  };
}
