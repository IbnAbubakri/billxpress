// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getMe, updateProfile as apiUpdateProfile, changePassword as apiChangePassword, setTransactionPin as apiSetTransactionPin, sendVerificationEmail as apiSendVerification, checkPhone as apiCheckPhone, checkEmail as apiCheckEmail, sendOtp as apiSendOtp, verifyOtp as apiVerifyOtp, generateMfaSecret as apiGenerateMfaSecret, verifyMfaSetup as apiVerifyMfaSetup, disableMfa as apiDisableMfa, deleteAccount as apiDeleteAccount } from '../api/client';
import type { User, ProfileUpdateData } from '../types';

const AUTH_STORAGE_KEY = 'billxpress_auth';

function saveStoredAuth(user: User, isAdmin: boolean) {
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      userId: user.id, email: user.email, role: isAdmin ? 'admin' : 'user',
      name: user.name, isAdmin, timestamp: Date.now(),
    }));
  } catch { /* sessionStorage unavailable */ }
}

function clearStoredAuth() {
  try { sessionStorage.removeItem(AUTH_STORAGE_KEY); } catch { /* sessionStorage unavailable */ }
}

function toUser(data: Record<string, unknown>): User {
  return {
    id: data.id as string,
    name: (data.name as string) || '',
    email: data.email as string,
    phone: (data.phone as string) || '',
    balance: (data.balance as number) ?? 0,
    hasTransactionPin: (data.hasTransactionPin as boolean) ?? false,
    emailVerified: (data.emailVerified as boolean) ?? false,
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
    dateOfBirth: (data.dateOfBirth as string) || '',
    gender: (data.gender as string) || '',
    nin: (data.nin as string) || '',
    nextOfKin: (data.nextOfKin as Record<string, string>) || {},
    employmentStatus: (data.employmentStatus as string) || '',
    annualIncome: (data.annualIncome as string) || '',
    createdAt: (data.createdAt as string) || '',
    lastLogin: (data.lastLogin as string) || '',
    passwordChangedAt: (data.passwordChangedAt as string) || '',
  };
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: authData, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const data = await getMe();
        if (data?.user) {
          const u = toUser(data.user);
          const isAdmin = data.user.role === 'admin';
          saveStoredAuth(u, isAdmin);
          return { user: u, isAdmin, isAuthenticated: true };
        }
      } catch {
        /* 401 or network error — not logged in */
      }
      clearStoredAuth();
      return { user: null, isAdmin: false, isAuthenticated: false };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { user, isAdmin, isAuthenticated } = authData || { user: null, isAdmin: false, isAuthenticated: false };

  const loginMutation = useMutation({
    mutationFn: ({ login, password, totpCode }: { login: string; password: string; totpCode?: string }) => apiLogin(login, password, totpCode),
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
      queryClient.removeQueries({ queryKey: ['auth'] });
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

  const handleLogin = useCallback(async (login: string, password: string, totpCode?: string) => {
    return loginMutation.mutateAsync({ login, password, totpCode });
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

  const handleCheckEmail = useCallback(async (email: string) => {
    return apiCheckEmail(email);
  }, []);

  const handleSendOtp = useCallback(async (phone: string) => {
    return apiSendOtp(phone);
  }, []);

  const handleVerifyOtp = useCallback(async (phone: string, code: string) => {
    return apiVerifyOtp(phone, code);
  }, []);

  const handleGenerateMfaSecret = useCallback(async () => {
    return apiGenerateMfaSecret();
  }, []);

  const handleVerifyMfaSetup = useCallback(async (token: string) => {
    return apiVerifyMfaSetup(token);
  }, []);

  const handleDisableMfa = useCallback(async (password: string, totpCode?: string) => {
    return apiDisableMfa(password, totpCode);
  }, []);

  const handleDeleteAccount = useCallback(async (password: string) => {
    return apiDeleteAccount(password);
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
    handleCheckEmail,
    handleSendOtp,
    handleVerifyOtp,
    handleGenerateMfaSecret,
    handleVerifyMfaSetup,
    handleDisableMfa,
    handleDeleteAccount,
  };
}
