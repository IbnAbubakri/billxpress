import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getMe, updateProfile as apiUpdateProfile, changePassword as apiChangePassword, setTransactionPin as apiSetTransactionPin, sendVerificationEmail as apiSendVerification, checkPhone as apiCheckPhone, sendOtp as apiSendOtp, verifyOtp as apiVerifyOtp } from '../api/client';
import type { User, ProfileUpdateData } from '../types';

const AUTH_STORAGE_KEY = 'billxpress_auth';
const AUTH_TTL = 60 * 60 * 1000;

interface StoredAuth {
  user: User;
  isAdmin: boolean;
  timestamp: number;
}

function loadStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    if (Date.now() - parsed.timestamp > AUTH_TTL) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function saveStoredAuth(user: User, isAdmin: boolean) {
  try {
    const data: StoredAuth = { user, isAdmin, timestamp: Date.now() };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  } catch { /* localStorage unavailable */ }
}

function clearStoredAuth() {
  try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch { /* localStorage unavailable */ }
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
    mfaEnabled: (data.mfaEnabled as boolean) ?? false,
  };
}

function getInitialAuth() {
  const stored = loadStoredAuth();
  if (stored) {
    return { user: stored.user, isAdmin: stored.isAdmin };
  }
  return null;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const initial = getInitialAuth();

  const { data: authData, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      if (!initial) {
        return { user: null, isAdmin: false, isAuthenticated: false };
      }
      try {
        const data = await getMe();
        if (data?.user) {
          const u = toUser(data.user);
          const isAdmin = data.user.role === 'admin';
          saveStoredAuth(u, isAdmin);
          return { user: u, isAdmin, isAuthenticated: true };
        }
      } catch {
        /* 401 is expected when not logged in */
      }
      clearStoredAuth();
      return { user: null, isAdmin: false, isAuthenticated: false };
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { user, isAdmin, isAuthenticated } = authData || { user: null, isAdmin: false, isAuthenticated: false };

  const loginMutation = useMutation({
    mutationFn: ({ login, password }: { login: string; password: string }) => apiLogin(login, password),
    onSuccess: (data) => {
      if (data.user) {
        const u = toUser(data.user);
        const admin = data.user.role === 'admin';
        saveStoredAuth(u, admin);
        queryClient.setQueryData(['auth', 'me'], { user: u, isAdmin: admin, isAuthenticated: true });
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({ email, password, phone, name }: { email: string; password: string; phone?: string; name?: string }) => apiRegister(email, password, { phone, name }),
    onSuccess: (data) => {
      if (data.user) {
        const u = toUser(data.user);
        saveStoredAuth(u, false);
        queryClient.setQueryData(['auth', 'me'], { user: u, isAdmin: false, isAuthenticated: true });
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: apiLogout,
    onSettled: () => {
      clearStoredAuth();
      queryClient.setQueryData(['auth', 'me'], { user: null, isAdmin: false, isAuthenticated: false });
      queryClient.clear();
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (profileData: ProfileUpdateData) => apiUpdateProfile(profileData),
    onSuccess: (data) => {
      if (data.user) {
        const u = toUser(data.user);
        const current = queryClient.getQueryData<{ user: User; isAdmin: boolean; isAuthenticated: boolean }>(['auth', 'me']);
        const admin = current?.isAdmin ?? false;
        saveStoredAuth(u, admin);
        queryClient.setQueryData(['auth', 'me'], { user: u, isAdmin: admin, isAuthenticated: true });
      }
    },
  });

  const handleLogin = useCallback(async (login: string, password: string) => {
    return loginMutation.mutateAsync({ login, password });
  }, [loginMutation]);

  const handleRegister = useCallback(async (data: { email: string; password: string; phone?: string; name?: string }) => {
    return registerMutation.mutateAsync(data);
  }, [registerMutation]);

  const handleLogout = useCallback(async () => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const handleUpdateProfile = useCallback(async (profileData: ProfileUpdateData) => {
    return updateProfileMutation.mutateAsync(profileData);
  }, [updateProfileMutation]);

  const handleChangePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    return apiChangePassword(currentPassword, newPassword);
  }, []);

  const handleSetTransactionPin = useCallback(async (pin: string) => {
    return apiSetTransactionPin(pin);
  }, []);

  const handleSendVerification = useCallback(async () => {
    return apiSendVerification();
  }, []);

  const handleCheckPhone = useCallback(async (phone: string) => {
    return apiCheckPhone(phone);
  }, []);

  const handleSendOtp = useCallback(async (phone: string) => {
    return apiSendOtp(phone);
  }, []);

  const handleVerifyOtp = useCallback(async (phone: string, code: string) => {
    return apiVerifyOtp(phone, code);
  }, []);

  return {
    user,
    isAuthenticated,
    isAdmin,
    isLoading,
    handleLogin,
    handleRegister,
    handleLogout,
    handleUpdateProfile,
    handleChangePassword,
    handleSetTransactionPin,
    handleSendVerification,
    handleCheckPhone,
    handleSendOtp,
    handleVerifyOtp,
  };
}
